import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import React from 'react';

interface ProfileCompletionStepProps {
    formData: {
        firstName: string;
        lastName: string;
        email: string;
        password: string;
        confirmPassword: string;
    };
    onFormDataChange: (name: string, value: string) => void;
    showPassword: boolean;
    setShowPassword: (value: boolean) => void;
    showConfirmPassword: boolean;
    setShowConfirmPassword: (value: boolean) => void;
    showEmailField: boolean;
    setShowEmailField: (value: boolean) => void;
    mobileNumber: string;
    loading: boolean;
    error: string | null;
}

const ProfileCompletionStep: React.FC<ProfileCompletionStepProps> = ({
    formData,
    onFormDataChange,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    showEmailField,
    setShowEmailField,
    mobileNumber,
    loading,
    error
}) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        onFormDataChange(name, value);
    };

    return (
        <div className="space-y-6">
            <div className="text-center mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Complete Your Profile
                </h3>
                <p className="text-gray-600 text-sm">
                    Mobile number verified: <span className="font-medium text-green-600">{mobileNumber}</span>
                </p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
            )}

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name *
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            placeholder="First name"
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg 
                         placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 
                         focus:border-blue-500 transition-all duration-200 bg-white"
                            required
                            disabled={loading}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name
                    </label>
                    <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="Last name"
                        className="block w-full px-3 py-3 border border-gray-300 rounded-lg 
                       placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 
                       focus:border-blue-500 transition-all duration-200 bg-white"
                        disabled={loading}
                    />
                </div>
            </div>

            {/* Password */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Create a strong password"
                        className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg 
                       placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 
                       focus:border-blue-500 transition-all duration-200 bg-white"
                        required
                        disabled={loading}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        disabled={loading}
                    >
                        {showPassword ? (
                            <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        ) : (
                            <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        )}
                    </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
            </div>

            {/* Confirm Password */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password *
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm your password"
                        className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg 
                       placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 
                       focus:border-blue-500 transition-all duration-200 bg-white"
                        required
                        disabled={loading}
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        disabled={loading}
                    >
                        {showConfirmPassword ? (
                            <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        ) : (
                            <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        )}
                    </button>
                </div>
            </div>

            {/* Email Collection (Optional) */}
            {!showEmailField ? (
                <div className="text-center">
                    <button
                        type="button"
                        onClick={() => setShowEmailField(true)}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                        disabled={loading}
                    >
                        + Add email address (optional)
                    </button>
                    <p className="text-xs text-gray-500 mt-1">
                        Add email for password recovery and notifications
                    </p>
                </div>
            ) : (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address (Optional)
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter your email address"
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg 
                         placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 
                         focus:border-blue-500 transition-all duration-200 bg-white"
                            disabled={loading}
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        We'll use this for important notifications and password recovery
                    </p>
                </div>
            )}
        </div>
    );
};

export default ProfileCompletionStep;
