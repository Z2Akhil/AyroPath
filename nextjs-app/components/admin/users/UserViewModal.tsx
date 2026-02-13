import React, { useEffect, useState } from 'react';
import { X, Mail, Phone, MapPin, Calendar, CheckCircle, XCircle, User } from 'lucide-react';
import { CustomerUser } from '@/types/admin';

interface UserViewModalProps {
    user: CustomerUser;
    onClose: () => void;
}

const UserViewModal: React.FC<UserViewModalProps> = ({ user, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger animation after component mounts
        const timer = setTimeout(() => setIsVisible(true), 10);
        return () => {
            clearTimeout(timer);
            setIsVisible(false);
        };
    }, []);

    if (!user) return null;

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for animation to complete
    };

    return (
        <div className={`fixed inset-0 z-50 flex justify-center items-center p-4 transition-all duration-300 ${isVisible ? 'bg-black/50' : 'bg-black/0'
            }`}>
            <div className={`bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
                }`}>
                {/* Header */}
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">User Details</h2>
                        <p className="text-sm text-gray-600">View detailed user information</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* User Profile Header */}
                    <div className="flex items-start gap-4 mb-8">
                        <div className="flex-shrink-0">
                            <div className="h-20 w-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                                <User className="h-10 w-10 text-white" />
                            </div>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-2xl font-bold text-gray-900">
                                {user.firstName} {user.lastName}
                            </h3>
                            <div className="flex flex-wrap gap-2 mt-2">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${user.isActive
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                    }`}>
                                    {user.isActive ? (
                                        <>
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            Active
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className="h-3 w-3 mr-1" />
                                            Inactive
                                        </>
                                    )}
                                </span>
                                {user.emailVerified && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Verified
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* User Information Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Contact Information */}
                        <div className="space-y-4">
                            <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">Contact Information</h4>

                            <div className="space-y-3">
                                {user.email && (
                                    <div className="flex items-start gap-3">
                                        <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">Email</p>
                                            <p className="text-gray-900 font-medium">{user.email}</p>
                                        </div>
                                    </div>
                                )}

                                {user.mobileNumber && (
                                    <div className="flex items-start gap-3">
                                        <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">Mobile Number</p>
                                            <p className="text-gray-900 font-medium">{user.mobileNumber}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Account Information */}
                        <div className="space-y-4">
                            <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">Account Information</h4>

                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Created</p>
                                        <p className="text-gray-900 font-medium">{formatDate(user.createdAt)}</p>
                                    </div>
                                </div>

                                {user.updatedAt && (
                                    <div className="flex items-start gap-3">
                                        <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">Last Updated</p>
                                            <p className="text-gray-900 font-medium">{formatDate(user.updatedAt)}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Additional Information */}
                        <div className="md:col-span-2 space-y-4">
                            <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">Additional Status</h4>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-sm font-medium text-gray-600">Email Verified</p>
                                    <p className="text-gray-900 font-semibold">
                                        {user.emailVerified ? 'Yes' : 'No'}
                                    </p>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-sm font-medium text-gray-600">Account Status</p>
                                    <p className="text-gray-900 font-semibold">
                                        {user.isActive ? 'Active' : 'Inactive'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* User ID */}
                    <div className="mt-8 pt-6 border-t">
                        <p className="text-sm text-gray-600">
                            User ID: <span className="font-mono text-gray-900 bg-gray-100 px-2 py-0.5 rounded">{user._id}</span>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end">
                    <button
                        onClick={handleClose}
                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserViewModal;
