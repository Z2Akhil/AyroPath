import { Phone, RefreshCw } from 'lucide-react';
import React from 'react';

interface OTPVerificationStepProps {
    mobileNumber: string;
    otp: string;
    onOtpChange: (value: string) => void;
    onVerifyOTP: () => void;
    onResendOTP: () => void;
    loading: boolean;
    otpLoading: boolean;
    otpTimer: number;
    error: string | null;
}

const OTPVerificationStep: React.FC<OTPVerificationStepProps> = ({
    mobileNumber,
    otp,
    onOtpChange,
    onVerifyOTP,
    onResendOTP,
    loading,
    otpLoading,
    otpTimer,
    error
}) => {
    return (
        <div className="space-y-4">
            <div className="text-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Phone className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Verify Your Mobile Number
                </h3>
                <p className="text-gray-600 text-sm">
                    We've sent a 6-digit verification code to{' '}
                    <span className="font-medium text-blue-600">{mobileNumber}</span>
                </p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
            )}

            <div className="space-y-4">
                {/* OTP Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Enter Verification Code *
                    </label>
                    <input
                        type="text"
                        name="otp"
                        value={otp}
                        onChange={(e) => onOtpChange(e.target.value)}
                        placeholder="Enter 6-digit code"
                        maxLength={6}
                        className="block w-full px-3 py-3 border border-gray-300 rounded-lg 
                       placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 
                       focus:border-blue-500 transition-all duration-200 bg-white text-center text-lg font-semibold"
                        required
                        disabled={loading}
                    />
                </div>

                {/* Resend OTP */}
                <div className="text-center mt-4">
                    <button
                        type="button"
                        onClick={onResendOTP}
                        disabled={otpTimer > 0 || otpLoading}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                        {otpLoading ? (
                            <div className="flex items-center justify-center gap-2">
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Sending...
                            </div>
                        ) : otpTimer > 0 ? (
                            `Resend OTP in ${otpTimer}s`
                        ) : (
                            'Resend OTP'
                        )}
                    </button>
                </div>

                <button
                    type="button"
                    onClick={onVerifyOTP}
                    disabled={loading}
                    className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 
                     text-white rounded-lg hover:from-green-700 hover:to-green-800 focus:outline-none 
                     focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 
                     font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <>
                            Verify OTP
                            <Phone className="w-4 h-4" />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default OTPVerificationStep;
