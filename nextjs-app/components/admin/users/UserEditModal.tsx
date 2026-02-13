import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, User, Mail, CheckCircle } from 'lucide-react';
import { CustomerUser } from '@/types/admin';

interface UserEditModalProps {
    user: CustomerUser;
    onClose: () => void;
    onSave: (updatedData: Partial<CustomerUser>) => void;
    loading?: boolean;
}

const UserEditModal: React.FC<UserEditModalProps> = ({ user, onClose, onSave, loading = false }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [formData, setFormData] = useState<Partial<CustomerUser>>({
        firstName: '',
        lastName: '',
        email: '',
        mobileNumber: '',
        isActive: true,
        emailVerified: false,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        // Trigger animation after component mounts
        const timer = setTimeout(() => setIsVisible(true), 10);
        return () => {
            clearTimeout(timer);
            setIsVisible(false);
        };
    }, []);

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                mobileNumber: user.mobileNumber || '',
                isActive: user.isActive !== undefined ? user.isActive : true,
                emailVerified: user.emailVerified !== undefined ? user.emailVerified : false,
            });
        }
    }, [user]);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.firstName?.trim()) {
            newErrors.firstName = 'First name is required';
        }

        if (!formData.lastName?.trim()) {
            newErrors.lastName = 'Last name is required';
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email address';
        }

        if (formData.mobileNumber && !/^[0-9+\-\s()]{10,}$/.test(formData.mobileNumber.replace(/[\s\-()]/g, ''))) {
            newErrors.mobileNumber = 'Invalid mobile number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (validateForm()) {
            onSave(formData);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for animation to complete
    };

    if (!user) return null;

    return (
        <div className={`fixed inset-0 z-50 flex justify-center items-center p-4 transition-all duration-300 ${isVisible ? 'bg-black/50' : 'bg-black/0'
            }`}>
            <div className={`bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
                }`}>
                {/* Header */}
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Edit User</h2>
                        <p className="text-sm text-gray-600">Update user information</p>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={loading}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Personal Information */}
                        <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <User className="h-5 w-5 text-blue-600" />
                                Personal Information
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        First Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${errors.firstName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                            }`}
                                        disabled={loading}
                                    />
                                    {errors.firstName && (
                                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            {errors.firstName}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Last Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${errors.lastName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                            }`}
                                        disabled={loading}
                                    />
                                    {errors.lastName && (
                                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            {errors.lastName}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Mail className="h-5 w-5 text-blue-600" />
                                Contact Information
                            </h4>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                            }`}
                                        disabled={loading}
                                    />
                                    {errors.email && (
                                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            {errors.email}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Mobile Number
                                    </label>
                                    <input
                                        type="tel"
                                        name="mobileNumber"
                                        value={formData.mobileNumber}
                                        onChange={handleChange}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${errors.mobileNumber ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                            }`}
                                        disabled={loading}
                                    />
                                    {errors.mobileNumber && (
                                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            {errors.mobileNumber}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Account Status */}
                        <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-blue-600" />
                                Account Status
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="isActive"
                                        name="isActive"
                                        checked={formData.isActive}
                                        onChange={handleChange}
                                        className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 transition-all duration-200"
                                        disabled={loading}
                                    />
                                    <label htmlFor="isActive" className="ml-3 text-sm font-medium text-gray-700 cursor-pointer">
                                        Account Active
                                    </label>
                                </div>

                                <div className="flex items-center" title="Email verification status">
                                    <input
                                        type="checkbox"
                                        id="emailVerified"
                                        name="emailVerified"
                                        checked={formData.emailVerified}
                                        onChange={handleChange}
                                        className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 transition-all duration-200"
                                        disabled={loading}
                                    />
                                    <label htmlFor="emailVerified" className="ml-3 text-sm font-medium text-gray-700 cursor-pointer">
                                        Email Verified
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* User ID Display */}
                        <div className="pt-4 border-t">
                            <p className="text-sm text-gray-500">
                                User ID: <span className="font-mono text-gray-900 bg-gray-100 px-2 py-0.5 rounded">{user._id}</span>
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3 z-10">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={loading}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                        >
                            {loading ? (
                                <>
                                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserEditModal;
