import { useState } from 'react';
import { useUser } from '../context/userContext';
import { useToast } from '../context/ToastContext';
import { ArrowRight } from 'lucide-react';
import MobileNumberStep from './auth/MobileNumberStep';
import OTPVerificationStep from './auth/OTPVerificationStep';
import ProfileCompletionStep from './auth/ProfileCompletionStep';

const RegisterForm = ({ onClose, onSwitchToLogin }) => {
  const { register, requestOTP, verifyOTP } = useUser();
  const { success, error: toastError } = useToast();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    mobileNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    otp: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Mobile OTP, 2: OTP Verification, 3: Profile Completion
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [showEmailField, setShowEmailField] = useState(false);
  const [error, setError] = useState('');

  const handleFormDataChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const validateMobileNumber = () => {
    const mobile = formData.mobileNumber.trim();
    if (!mobile) {
      toastError('Mobile number is required');
      return false;
    }
    if (!/^\d{10}$/.test(mobile)) {
      toastError('Please enter a valid 10-digit mobile number');
      return false;
    }
    return true;
  };

  const validateRegistrationForm = () => {
    if (!formData.firstName.trim()) {
      toastError('First name is required');
      return false;
    }
    if (!formData.password) {
      toastError('Password is required');
      return false;
    }
    if (formData.password.length < 6) {
      toastError('Password must be at least 6 characters long');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toastError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleRequestOTP = async () => {
    if (!validateMobileNumber()) return;

    setOtpLoading(true);
    setError('');
    try {
      await requestOTP(formData.mobileNumber, 'verification');
      setStep(2);
      startOtpTimer();
      success('OTP sent to your mobile number');
    } catch (err) {
      setError(err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!formData.otp.trim()) {
      toastError('Please enter the OTP');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await verifyOTP(formData.mobileNumber, formData.otp, 'verification');
      setStep(3);
      success('Mobile number verified successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (otpTimer > 0) return;

    setOtpLoading(true);
    setError('');
    try {
      await requestOTP(formData.mobileNumber, 'verification');
      startOtpTimer();
      success('OTP resent to your mobile number');
    } catch (err) {
      setError(err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  const startOtpTimer = () => {
    setOtpTimer(60); // 60 seconds
    const timer = setInterval(() => {
      setOtpTimer(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCompleteRegistration = async () => {
    if (!validateRegistrationForm()) return;

    setLoading(true);
    setError('');
    try {
      await register(
        formData.firstName,
        formData.lastName,
        formData.mobileNumber,
        formData.password,
        formData.email // Pass email if provided
      );
      success('Account created successfully!');
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (step === 1) {
      handleRequestOTP();
    } else if (step === 2) {
      handleVerifyOTP();
    } else if (step === 3) {
      handleCompleteRegistration();
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <MobileNumberStep
            mobileNumber={formData.mobileNumber}
            onMobileNumberChange={(value) => handleFormDataChange('mobileNumber', value)}
            onRequestOTP={handleRequestOTP}
            loading={otpLoading}
            error={error}
          />
        );

      case 2:
        return (
          <OTPVerificationStep
            mobileNumber={formData.mobileNumber}
            otp={formData.otp}
            onOtpChange={(value) => handleFormDataChange('otp', value)}
            onVerifyOTP={handleVerifyOTP}
            onResendOTP={handleResendOTP}
            loading={loading}
            otpLoading={otpLoading}
            otpTimer={otpTimer}
            error={error}
          />
        );

      case 3:
        return (
          <ProfileCompletionStep
            formData={formData}
            onFormDataChange={handleFormDataChange}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            showConfirmPassword={showConfirmPassword}
            setShowConfirmPassword={setShowConfirmPassword}
            showEmailField={showEmailField}
            setShowEmailField={setShowEmailField}
            mobileNumber={formData.mobileNumber}
            loading={loading}
            error={error}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Create Account
        </h2>
        <p className="text-gray-600">
          Join Ayropath for comprehensive health services
        </p>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mt-4">
          {[1, 2, 3].map((stepNum) => (
            <div key={stepNum} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === stepNum
                  ? 'bg-blue-600 text-white'
                  : step > stepNum
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                {stepNum}
              </div>
              {stepNum < 3 && (
                <div className={`w-12 h-1 mx-2 ${step > stepNum ? 'bg-green-600' : 'bg-gray-200'
                  }`} />
              )}
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {step === 1 && 'Enter Mobile Number'}
          {step === 2 && 'Verify OTP'}
          {step === 3 && 'Complete Profile'}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {renderStep()}

        {/* Submit Button for Step 3 */}
        {step === 3 && (
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 bg-linear-to-r from-blue-600 to-blue-700 
                       text-white rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none 
                       focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 
                       font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Create Account
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        )}

        {/* Divider and Login Link */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="text-center">
            <p className="text-gray-600 text-sm">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default RegisterForm;
