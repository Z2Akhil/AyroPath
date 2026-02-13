'use client';

import React, { useState } from 'react';
import { useUser } from '@/providers/UserProvider';
import { useToast } from '@/providers/ToastProvider';
import { Smartphone, Lock, Eye, EyeOff, ArrowRight, RefreshCw } from 'lucide-react';

interface ForgotPasswordFormProps {
    onClose: () => void;
    onSwitchToLogin: () => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onClose, onSwitchToLogin }) => {
    const { forgotPassword, resetPassword } = useUser();
    const { success: toastSuccess, error: toastError } = useToast();

    const [step, setStep] = useState(1); // 1: Request OTP, 2: Reset password
    const [formData, setFormData] = useState({
        mobileNumber: '',
        otp: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'mobileNumber') {
            const numericValue = value.replace(/\D/g, '').slice(0, 10);
            setFormData(prev => ({ ...prev, [name]: numericValue }));
            return;
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRequestOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.mobileNumber.trim()) {
            toastError('Mobile number is required');
            return;
        }
        if (formData.mobileNumber.length !== 10) {
            toastError('Please enter a valid 10-digit mobile number');
            return;
        }

        setOtpLoading(true);
        try {
            const result = await forgotPassword(formData.mobileNumber);
            if (result.success) {
                toastSuccess("OTP sent successfully!");
                setStep(2);
                startCountdown();
            } else {
                toastError(result.message || "Failed to send OTP");
            }
        } catch (err: any) {
            toastError(err.message || "An error occurred");
        } finally {
            setOtpLoading(false);
        }
    };

    const startCountdown = () => {
        setCountdown(30);
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleResendOTP = async () => {
        if (countdown > 0) return;
        setOtpLoading(true);
        try {
            const result = await forgotPassword(formData.mobileNumber);
            if (result.success) {
                toastSuccess("OTP resent successfully!");
                startCountdown();
            } else {
                toastError(result.message || "Failed to resend OTP");
            }
        } catch (err: any) {
            toastError(err.message || "An error occurred");
        } finally {
            setOtpLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.newPassword !== formData.confirmPassword) {
            toastError('Passwords do not match');
            return;
        }
        if (formData.newPassword.length < 6) {
            toastError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            const result = await resetPassword(formData.mobileNumber, formData.otp, formData.newPassword);
            if (result.success) {
                toastSuccess("Password reset successful! Please login.");
                onSwitchToLogin();
            } else {
                toastError(result.message || "Failed to reset password");
            }
        } catch (err: any) {
            toastError(err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {step === 1 ? 'Reset Password' : 'Create New Password'}
                </h2>
                <p className="text-gray-600 italic">
                    {step === 1 ? 'Enter mobile number for OTP' : 'Enter the code sent to your mobile'}
                </p>
            </div>

            <form onSubmit={step === 1 ? handleRequestOTP : handleResetPassword} className="space-y-6">
                {step === 1 ? (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number *</label>
                            <div className="relative">
                                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="tel"
                                    name="mobileNumber"
                                    value={formData.mobileNumber}
                                    onChange={handleChange}
                                    placeholder="10-digit number"
                                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={otpLoading}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium disabled:opacity-50"
                        >
                            {otpLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <>Send OTP <ArrowRight className="h-4 w-4" /></>}
                        </button>
                    </>
                ) : (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Enter OTP *</label>
                            <input
                                type="text"
                                name="otp"
                                value={formData.otp}
                                onChange={handleChange}
                                placeholder="6-digit code"
                                maxLength={6}
                                className="w-full px-3 py-3 border border-gray-300 rounded-lg text-center text-xl font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                            <button
                                type="button"
                                onClick={handleResendOTP}
                                disabled={countdown > 0 || otpLoading}
                                className="text-sm text-blue-600 mt-2 disabled:text-gray-400"
                            >
                                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                            </button>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">New Password *</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="newPassword"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                                    {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                                </button>
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium disabled:opacity-50"
                        >
                            {loading ? <RefreshCw className="h-5 w-5 animate-spin mx-auto" /> : 'Reset Password'}
                        </button>
                    </>
                )}
                <button type="button" onClick={onSwitchToLogin} className="w-full text-blue-600 text-sm font-medium">Back to Sign In</button>
            </form>
        </div>
    );
};

export default ForgotPasswordForm;
