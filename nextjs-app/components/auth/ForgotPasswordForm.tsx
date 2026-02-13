'use client';

import React, { useState } from 'react';
import { useUser } from '@/providers/UserProvider';
import { useToast } from '@/providers/ToastProvider';
import { ArrowRight, ArrowLeft } from 'lucide-react';

interface ForgotPasswordFormProps {
    onClose: () => void;
    onSwitchToLogin: () => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onClose, onSwitchToLogin }) => {
    const { forgotPassword, verifyOTP, resetPassword } = useUser();
    const { success: toastSuccess, error: toastError } = useToast();

    const [step, setStep] = useState(1);
    const [mobileNumber, setMobileNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRequestOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!mobileNumber.trim()) {
            toastError('Mobile number is required');
            return;
        }
        if (!/^\d{10}$/.test(mobileNumber)) {
            toastError('Please enter a valid 10-digit mobile number');
            return;
        }

        setLoading(true);
        try {
            const result = await forgotPassword(mobileNumber);
            if (result.success) {
                setStep(2);
                toastSuccess('OTP sent to your mobile number');
            } else {
                toastError(result.message || 'Failed to send OTP');
            }
        } catch (err) {
            toastError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otp.trim()) {
            toastError('Please enter the OTP');
            return;
        }

        setLoading(true);
        try {
            const result = await verifyOTP(mobileNumber, otp, 'password_reset');
            if (result.success) {
                setStep(3);
                toastSuccess('OTP verified successfully!');
            } else {
                toastError(result.message || 'OTP verification failed');
            }
        } catch (err) {
            toastError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPassword.trim()) {
            toastError('New password is required');
            return;
        }
        if (newPassword.length < 6) {
            toastError('Password must be at least 6 characters long');
            return;
        }

        setLoading(true);
        try {
            const result = await resetPassword(mobileNumber, otp, newPassword);
            if (result.success) {
                toastSuccess('Password reset successful! Please login with your new password.');
                onSwitchToLogin();
            } else {
                toastError(result.message || 'Failed to reset password');
            }
        } catch (err) {
            toastError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h2>
                <p className="text-gray-600 text-sm">
                    {step === 1 && 'Enter your mobile number to receive OTP'}
                    {step === 2 && 'Enter the OTP sent to your mobile'}
                    {step === 3 && 'Enter your new password'}
                </p>

                <div className="flex items-center justify-center mt-6">
                    {[1, 2, 3].map((stepNum) => (
                        <React.Fragment key={stepNum}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step === stepNum ? 'bg-blue-600 text-white shadow-md' :
                                    step > stepNum ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
                                }`}>
                                {stepNum}
                            </div>
                            {stepNum < 3 && (
                                <div className={`w-10 h-1 mx-2 rounded-full ${step > stepNum ? 'bg-green-600' : 'bg-gray-200'}`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {step === 1 && (
                <form onSubmit={handleRequestOTP}>
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Mobile Number
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">+91</span>
                            <input
                                type="tel"
                                value={mobileNumber}
                                onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="Enter your mobile number"
                                maxLength={10}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 
                       text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium 
                       shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> :
                            <>Send OTP <ArrowRight className="w-4 h-4" /></>}
                    </button>
                </form>
            )}

            {step === 2 && (
                <form onSubmit={handleVerifyOTP}>
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            OTP
                        </label>
                        <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Enter 6-digit OTP"
                            maxLength={6}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 
                       text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium 
                       shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> :
                            <>Verify OTP <ArrowRight className="w-4 h-4" /></>}
                    </button>
                </form>
            )}

            {step === 3 && (
                <form onSubmit={handleResetPassword}>
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            New Password
                        </label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Enter new password (min 6 characters)"
                            minLength={6}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 
                       text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium 
                       shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> :
                            <>Reset Password <ArrowRight className="w-4 h-4" /></>}
                    </button>
                </form>
            )}

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                <button type="button" onClick={onSwitchToLogin} className="text-blue-600 hover:text-blue-700 font-bold flex items-center justify-center gap-2 mx-auto">
                    <ArrowLeft className="w-4 h-4" /> Back to Login
                </button>
            </div>
        </div>
    );
};

export default ForgotPasswordForm;