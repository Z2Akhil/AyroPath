import axios from 'axios';
import validator from 'validator';

interface SMSConfig {
  CUSTOMER_ID: string;
  BASE64_KEY: string;
  EMAIL_ID: string;
  BASE_URL: string;
}

interface SendOTPResult {
  success: boolean;
  message: string;
  verificationId?: string;
  transactionId?: string;
  timeout?: number;
  provider?: string;
}

interface ValidateOTPResult {
  success: boolean;
  message: string;
  verificationStatus?: string;
  transactionId?: string;
  errorCode?: number;
  provider?: string;
}

class SMSService {
  static getConfig(): SMSConfig {
    return {
      CUSTOMER_ID: process.env.MC_CUSTOMER_ID || '',
      BASE64_KEY: process.env.MC_BASE64_KEY || '',
      EMAIL_ID: process.env.MC_EMAIL_ID || process.env.FROM_EMAIL || 'admin@ayropath.com',
      BASE_URL: 'https://cpaas.messagecentral.com'
    };
  }

  static async withRetry<T>(operation: () => Promise<T>, operationName: string, maxRetries = 2): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const isTimeout = (error as { code?: string; message?: string }).code === 'ECONNABORTED' || 
                          lastError.message?.includes('timeout');
        const isNetworkError = ['ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT'].includes((error as { code?: string }).code || '');

        if ((isTimeout || isNetworkError) && attempt < maxRetries) {
          console.log(`⚠️ ${operationName} attempt ${attempt} failed, retrying in 2 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }

        if (isTimeout || isNetworkError) {
          throw new Error('SMS service is temporarily unavailable. Please try again.');
        }

        throw lastError;
      }
    }

    throw lastError || new Error('Operation failed');
  }

  static async generateAuthToken(): Promise<string> {
    const config = this.getConfig();

    if (!config.CUSTOMER_ID || !config.BASE64_KEY) {
      throw new Error('Message Central credentials not configured');
    }

    return await this.withRetry(async () => {
      const response = await axios.get(
        `${config.BASE_URL}/auth/v1/authentication/token`,
        {
          params: {
            customerId: config.CUSTOMER_ID,
            key: config.BASE64_KEY,
            scope: 'NEW',
            country: '91',
            email: config.EMAIL_ID
          },
          headers: { 'accept': '*/*' },
          timeout: 30000,
        }
      );

      if (response.data.status === 200 && response.data.token) {
        return response.data.token as string;
      }

      throw new Error('Failed to generate auth token');
    }, 'Auth token generation');
  }

  static async sendOTP(mobileNumber: string, otp: string, options: { purpose?: string } = {}): Promise<SendOTPResult> {
    try {
      if (!this.isValidMobileNumber(mobileNumber)) {
        return { success: false, message: 'Invalid mobile number format' };
      }

      const authToken = await this.generateAuthToken();
      const config = this.getConfig();

      const params = {
        customerId: config.CUSTOMER_ID,
        mobileNumber: mobileNumber,
        flowType: 'SMS',
        otpLength: otp.length,
        countryCode: '91'
      };

      console.log('Sending OTP with params:', {
        customerId: config.CUSTOMER_ID ? '***' + config.CUSTOMER_ID.slice(-4) : 'MISSING',
        mobileNumber: mobileNumber,
        flowType: 'SMS',
        otpLength: otp.length,
        countryCode: '91',
        authToken: authToken ? 'present' : 'missing'
      });

      const response = await this.withRetry(async () => {
        return await axios.post(
          `${config.BASE_URL}/verification/v3/send`,
          null,
          {
            params,
            headers: {
              'authToken': authToken,
              'accept': '*/*'
            },
            timeout: 30000
          }
        );
      }, 'OTP sending');

      if (response.data.responseCode === 200) {
        return {
          success: true,
          message: 'OTP sent successfully',
          verificationId: response.data.data.verificationId,
          transactionId: response.data.data.transactionId,
          timeout: response.data.data.timeout || 60,
          provider: 'MessageCentral'
        };
      }

      throw new Error(response.data.message || 'Failed to send OTP');
    } catch (error) {
      const axiosError = error as { response?: { data?: unknown; status?: number }; message: string };
      console.error('Message Central OTP sending failed:', {
        error: axiosError.message,
        responseData: axiosError.response?.data,
        responseStatus: axiosError.response?.status,
      });
      const message = axiosError.response?.data && typeof axiosError.response.data === 'object' && 'message' in axiosError.response.data 
        ? String(axiosError.response.data.message) 
        : axiosError.message;
      return { success: false, message };
    }
  }

  static async validateOTP(verificationId: string, otpCode: string): Promise<ValidateOTPResult> {
    try {
      if (!verificationId || !otpCode) {
        return { success: false, message: 'Verification ID and OTP code are required' };
      }

      const authToken = await this.generateAuthToken();
      const config = this.getConfig();

      const response = await this.withRetry(async () => {
        return await axios.get(
          `${config.BASE_URL}/verification/v3/validateOtp`,
          {
            params: {
              verificationId,
              code: otpCode,
              flowType: 'SMS',
              langid: 'en'
            },
            headers: {
              'authToken': authToken,
              'accept': '*/*'
            },
            timeout: 30000
          }
        );
      }, 'OTP validation');

      const data = response.data;

      if (data.responseCode === 200) {
        const isVerified = data.data.verificationStatus === 'VERIFICATION_COMPLETED';
        return {
          success: isVerified,
          verificationStatus: data.data.verificationStatus,
          message: isVerified ? 'OTP verified successfully' : 'OTP verification failed',
          transactionId: data.data.transactionId,
          provider: 'MessageCentral'
        };
      }

      const errorMap: Record<number, string> = {
        702: 'Wrong OTP provided',
        705: 'OTP expired',
        703: 'Already verified',
        505: 'Invalid verification ID',
        800: 'Maximum attempts reached'
      };

      return {
        success: false,
        errorCode: data.responseCode,
        message: errorMap[data.responseCode] || data.message,
        provider: 'MessageCentral'
      };
    } catch (error) {
      console.error('Message Central OTP validation error:', error);
      const message = error instanceof Error ? error.message : 'Validation failed';
      return { success: false, message };
    }
  }

  static isValidMobileNumber(mobileNumber: string): boolean {
    if (!mobileNumber) return false;
    const cleanNumber = mobileNumber.replace(/\D/g, '');
    return validator.isMobilePhone(cleanNumber, 'en-IN') && cleanNumber.length === 10;
  }
}

export default SMSService;