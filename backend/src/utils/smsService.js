import axios from "axios";
import validator from "validator";
import SMSHistory from "../models/SMSHistory.js";

class SMSService {
  // Configuration for Message Central
  static getMessageCentralConfig() {
    return {
      CUSTOMER_ID: process.env.MC_CUSTOMER_ID,
      BASE64_KEY: process.env.MC_BASE64_KEY,
      EMAIL_ID: process.env.MC_EMAIL_ID || process.env.FROM_EMAIL || 'admin@ayropath.com',
      BASE_URL: 'https://cpaas.messagecentral.com'
    };
  }

  // Retry helper for handling timeouts - tries once more after failure
  static async withRetry(operation, operationName, maxRetries = 2) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout');
        const isNetworkError = error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT';

        // Only retry on timeout or network errors
        if ((isTimeout || isNetworkError) && attempt < maxRetries) {
          console.log(`⚠️ ${operationName} attempt ${attempt} failed (${isTimeout ? 'timeout' : 'network error'}), retrying in 2 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
          continue;
        }

        // If it's a timeout/network error on final attempt, throw user-friendly message
        if (isTimeout || isNetworkError) {
          console.error(`❌ ${operationName} failed after ${maxRetries} attempts:`, error.message);
          throw new Error('SMS service is temporarily unavailable. Please try again in a moment.');
        }

        // For other errors, throw as-is
        throw error;
      }
    }

    throw lastError;
  }

  // Generate authentication token for Message Central
  static async generateAuthToken() {
    const CONFIG = this.getMessageCentralConfig();

    if (!CONFIG.CUSTOMER_ID || !CONFIG.BASE64_KEY) {
      throw new Error('Message Central credentials not configured (MC_CUSTOMER_ID, MC_BASE64_KEY required)');
    }

    return await this.withRetry(async () => {
      console.log('Generating Message Central auth token...');

      const response = await axios.get(
        `${CONFIG.BASE_URL}/auth/v1/authentication/token`,
        {
          params: {
            customerId: CONFIG.CUSTOMER_ID,
            key: CONFIG.BASE64_KEY,
            scope: 'NEW',
            country: '91',
            email: CONFIG.EMAIL_ID
          },
          headers: {
            'accept': '*/*'
          },
          timeout: 15000 // Increased to 15 seconds
        }
      );

      // Actual response matches { status: 200, token: "..." }
      if (response.data.status === 200 && response.data.token) {
        const token = response.data.token;
        console.log('Auth token generated successfully');
        return token;
      } else {
        throw new Error(`Token generation failed. Status: ${response.data.status}`);
      }
    }, 'Auth token generation');
  }

  // Send OTP using Message Central
  static async sendOTP(mobileNumber, otp, options = {}) {
    let smsRecord = null;
    try {
      // Validate inputs
      if (!this.isValidMobileNumber(mobileNumber)) {
        return {
          success: false,
          message: "Invalid mobile number format"
        };
      }

      // Create SMS history record
      smsRecord = await SMSHistory.createRecord({
        mobileNumber,
        messageType: "otp",
        message: `OTP: ${otp} for verification`,
        otp: otp,
        purpose: options.purpose || "verification",
        status: "pending",
        retryCount: 0,
      });

      // Generate auth token
      const authToken = await this.generateAuthToken();

      // Prepare parameters for Message Central
      const params = {
        customerId: this.getMessageCentralConfig().CUSTOMER_ID,
        mobileNumber: mobileNumber,
        flowType: 'SMS',
        otpLength: otp.length,
        countryCode: '91'
      };

      console.log(`Sending OTP via Message Central to ${mobileNumber}...`);

      const response = await this.withRetry(async () => {
        return await axios.post(
          `${this.getMessageCentralConfig().BASE_URL}/verification/v3/send`,
          null,
          {
            params: params,
            headers: {
              'authToken': authToken,
              'accept': '*/*'
            },
            timeout: 15000
          }
        );
      }, 'OTP sending');

      if (response.data.responseCode === 200) {
        console.log(`✅ OTP sent successfully via Message Central to ${mobileNumber}`);
        console.log(`Verification ID: ${response.data.data.verificationId}`);

        // Update SMS history with success
        await SMSHistory.updateStatus(
          smsRecord._id.toString(),
          "sent",
          {
            verificationId: response.data.data.verificationId,
            transactionId: response.data.data.transactionId,
            provider: 'MessageCentral'
          },
          null
        );

        return {
          success: true,
          message: "OTP sent successfully",
          verificationId: response.data.data.verificationId,
          transactionId: response.data.data.transactionId,
          timeout: response.data.data.timeout || 60,
          provider: 'MessageCentral'
        };
      } else {
        throw new Error(`Message Central API error: ${response.data.message}`);
      }
    } catch (error) {
      console.error("❌ Message Central OTP sending failed:", {
        mobileNumber,
        error: error.message,
        response: error.response?.data,
        timestamp: new Date().toISOString()
      });

      // Update SMS history with failure
      if (smsRecord) {
        await SMSHistory.updateStatus(
          smsRecord._id.toString(),
          "failed",
          null,
          error.message
        );
      }

      return {
        success: false,
        message: "Failed to send OTP via Message Central",
        error: error.message
      };
    }
  }

  // Validate OTP using Message Central
  static async validateOTP(verificationId, otpCode) {
    try {
      if (!verificationId || !otpCode) {
        return {
          success: false,
          message: 'Verification ID and OTP code are required'
        };
      }

      console.log(`Validating OTP via Message Central for verification ID: ${verificationId}...`);

      // Generate fresh auth token for validation
      const authToken = await this.generateAuthToken();

      const response = await this.withRetry(async () => {
        return await axios.get(
          `${this.getMessageCentralConfig().BASE_URL}/verification/v3/validateOtp`,
          {
            params: {
              verificationId: verificationId,
              code: otpCode,
              flowType: 'SMS',
              langid: 'en'
            },
            headers: {
              'authToken': authToken,
              'accept': '*/*'
            },
            timeout: 15000
          }
        );
      }, 'OTP validation');

      const data = response.data;

      if (data.responseCode === 200) {
        const isVerified = data.data.verificationStatus === 'VERIFICATION_COMPLETED';

        console.log(`OTP validation ${isVerified ? 'successful' : 'failed'} for verification ID: ${verificationId}`);

        return {
          success: isVerified,
          verificationStatus: data.data.verificationStatus,
          message: isVerified ? 'OTP verified successfully' : 'OTP verification failed',
          transactionId: data.data.transactionId,
          provider: 'MessageCentral'
        };
      } else {
        // Handle specific error codes
        const errorMap = {
          702: 'Wrong OTP provided',
          705: 'OTP expired',
          703: 'Already verified',
          505: 'Invalid verification ID',
          800: 'Maximum attempts reached'
        };

        const errorMessage = errorMap[data.responseCode] || data.message;

        return {
          success: false,
          errorCode: data.responseCode,
          message: errorMessage,
          provider: 'MessageCentral'
        };
      }
    } catch (error) {
      console.error('Message Central OTP validation error:', error.message);
      throw error;
    }
  }

  // Send notification using Message Central
  static async sendNotification(mobileNumber, message, options = {}) {
    let smsRecord = null;
    try {
      if (!this.isValidMobileNumber(mobileNumber)) {
        return {
          success: false,
          message: "Invalid mobile number format"
        };
      }

      if (!message || message.trim().length === 0) {
        return {
          success: false,
          message: "Message cannot be empty"
        };
      }

      // Create SMS history record
      smsRecord = await SMSHistory.createRecord({
        mobileNumber,
        messageType: "notification",
        message: message.trim(),
        purpose: options.purpose || "notification",
        status: "pending",
        retryCount: 0,
      });

      // Generate auth token
      const authToken = await this.generateAuthToken();
      console.log(`Sending notification via Message Central to ${mobileNumber}...`);

      throw new Error('Notification sending via Message Central not yet implemented. Check Message Central documentation for notification APIs.');

    } catch (error) {
      console.error("❌ Notification sending failed:", error.message);

      if (smsRecord) {
        await SMSHistory.updateStatus(
          smsRecord._id.toString(),
          "failed",
          null,
          error.message
        );
      }

      return {
        success: false,
        message: "Failed to send notification",
        error: error.message
      };
    }
  }

  // Helper methods
  static isValidMobileNumber(mobileNumber) {
    if (!mobileNumber) return false;

    const cleanNumber = mobileNumber.toString().replace(/\D/g, '');

    return validator.isMobilePhone(cleanNumber, 'en-IN') && cleanNumber.length === 10;
  }

  // Mock mode for development/testing
  static async sendOTPMock(mobileNumber, otp) {
    console.log(`📱 [MOCK] OTP ${otp} would be sent to ${mobileNumber}`);
    return {
      success: true,
      message: "OTP sent successfully (mock mode)",
      mock: true,
      verificationId: `mock-verification-${Date.now()}`
    };
  }

  static async validateOTPMock(verificationId, otpCode) {
    console.log(`📱 [MOCK] Validating OTP ${otpCode} for verification ID: ${verificationId}`);

    // Simple mock validation - accept any OTP that ends with verificationId last digit
    const lastDigit = verificationId.slice(-1);
    const isVerified = otpCode.endsWith(lastDigit);

    return {
      success: isVerified,
      message: isVerified ? 'OTP verified successfully (mock)' : 'OTP verification failed (mock)',
      mock: true
    };
  }

  static async sendNotificationMock(mobileNumber, message) {
    console.log(`📱 [MOCK] Notification "${message}" would be sent to ${mobileNumber}`);
    return {
      success: true,
      message: "Notification sent successfully (mock mode)",
      mock: true
    };
  }
}

export default SMSService;
