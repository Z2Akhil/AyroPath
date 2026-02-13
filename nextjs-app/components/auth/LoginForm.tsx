'use client';

import React, { useState } from 'react';
import { useUser } from '@/providers/UserProvider';
import { useToast } from '@/providers/ToastProvider';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import authApi from '@/lib/api/authApi';

interface LoginFormProps {
    onClose: () => void;
    onSwitchToRegister: () => void;
    onForgotPassword: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onClose, onSwitchToRegister, onForgotPassword }) => {
    const { login } = useUser();
    const { error: toastError, success: toastSuccess } = useToast();
    const [formData, setFormData] = useState({
        identifier: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [verificationNeeded, setVerificationNeeded] = useState<{ email: string } | null>(null);
    const [resendLoading, setResendLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError('');
    };

    const handleResendVerification = async () => {
        if (!verificationNeeded) return;
        try {
            setResendLoading(true);
            await authApi.resendVerificationPublic(verificationNeeded.email);
            setError('');
            toastSuccess("Verification email sent! Please check your inbox.");
            setShowVerificationModal(false);
        } catch (err) {
            console.error(err);
            const message = err instanceof Error ? err.message : "Failed to send email";
            setError(message);
        } finally {
            setResendLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = await login(formData.identifier, formData.password);
            if (result.success) {
                onClose();
                toastSuccess("Signed in successfully!");
            } else {
                setError(result.message || "Login failed");
            }
        } catch (err) {
            if (err instanceof Error && err.message.includes('EMAIL_NOT_VERIFIED')) {
                setVerificationNeeded({ email: formData.identifier });
                setShowVerificationModal(true);
            } else {
                setError(err instanceof Error ? err.message : "Login failed");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
                <p className="text-gray-600">Sign in to your account to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-700 text-sm font-medium">{error}</p>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mobile Number or Email
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            name="identifier"
                            value={formData.identifier}
                            onChange={handleChange}
                            placeholder="Enter your mobile number or email"
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg 
                         placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 
                         focus:border-blue-500 transition-all duration-200 bg-white"
                            required
                        />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                        Enter your 10-digit mobile number or email address
                    </p>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <button
                            type="button"
                            onClick={onForgotPassword}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Forgot password?
                        </button>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter your password"
                            className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg 
                         placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 
                         focus:border-blue-500 transition-all duration-200 bg-white"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                            {showPassword ? (
                                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                            ) : (
                                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                            )}
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 
                     text-white rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none 
                     focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 
                     font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <>
                            Sign In
                            <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>

                {showVerificationModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl">
                            <div className="text-center mb-4">
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 mb-4">
                                    <Mail className="h-6 w-6 text-yellow-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Verification Required</h3>
                                <p className="text-sm text-gray-500 mt-2">
                                    Email <strong>{verificationNeeded?.email}</strong> is not verified.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    type="button"
                                    onClick={handleResendVerification}
                                    disabled={resendLoading}
                                    className="w-full inline-flex justify-center items-center rounded-lg bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700 disabled:opacity-50"
                                >
                                    {resendLoading ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    ) : (
                                        <Mail className="w-4 h-4 mr-2" />
                                    )}
                                    Resend Verification Email
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowVerificationModal(false)}
                                    className="w-full inline-flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">New to Ayropath?</span>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onSwitchToRegister}
                    className="w-full px-4 py-3 border-2 border-blue-600 text-blue-600 rounded-lg 
                     hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 
                     transition-all duration-200 font-medium"
                >
                    Create New Account
                </button>
            </form>
        </div>
    );
};

export default LoginForm;
