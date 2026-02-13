'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@/providers/UserProvider';
import {
    User, Edit3, Save, Phone, Lock, Loader, ShoppingCart,
    FileText, Mail, MapPin, Calendar, Package as PackageIcon,
    AlertCircle, CheckCircle, Clock
} from 'lucide-react';
import { fetchUserOrders, Order } from '@/lib/api/ordersApi';
import OrderCard from '@/components/orders/OrderCard';
import Modal from '@/components/ui/Modal';

// Dynamic import for ForgotPasswordForm to avoid SSR issues
import dynamic from 'next/dynamic';
const ForgotPasswordForm = dynamic(() => import('@/components/auth/ForgotPasswordForm'), { ssr: false });

export default function AccountPage() {
    const { user, updateProfile, loading: userLoading } = useUser();
    const router = useRouter();

    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');

    const [profileError, setProfileError] = useState('');
    const [profileSuccess, setProfileSuccess] = useState('');
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    // Order States
    const [orders, setOrders] = useState<Order[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [ordersError, setOrdersError] = useState('');

    // Account Statistics
    const [accountStats, setAccountStats] = useState({
        totalOrders: 0,
        totalSpent: 0,
        activeOrders: 0,
        completedOrders: 0
    });

    // Prefill user data
    useEffect(() => {
        if (user) {
            setFirstName(user.firstName || '');
            setLastName(user.lastName || '');
            setEmail(user.email || '');
            setMobileNumber(user.mobileNumber || '');
            setAddress(user.address || '');
            setCity(user.city || '');
            setState(user.state || '');
        }
    }, [user]);

    // Redirect if not logged in
    useEffect(() => {
        if (!userLoading && !user) {
            router.replace('/');
        }
    }, [user, userLoading, router]);

    // Fetch Orders
    useEffect(() => {
        const loadOrders = async () => {
            try {
                setOrdersLoading(true);
                const data = await fetchUserOrders();
                setOrders(data || []);

                const totalOrders = data?.length || 0;
                const totalSpent = data?.reduce((sum, order) => sum + (order.package?.price || 0), 0) || 0;
                const activeOrders = data?.filter(order =>
                    order.status && !["DONE", "REPORTED", "CANCELLED", "FAILED"].includes(order.status.toUpperCase())
                ).length || 0;
                const completedOrders = data?.filter(order =>
                    order.status && ["DONE", "REPORTED", "COMPLETED"].includes(order.status.toUpperCase())
                ).length || 0;

                setAccountStats({ totalOrders, totalSpent, activeOrders, completedOrders });
            } catch (err) {
                setOrdersError("Unable to load orders.");
            } finally {
                setOrdersLoading(false);
            }
        };

        if (user) loadOrders();
    }, [user]);

    // Save Profile
    const handleProfileSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileError('');
        setProfileSuccess('');
        setIsSavingProfile(true);

        try {
            const result = await updateProfile({
                firstName,
                lastName,
                email,
                mobileNumber,
                address,
                city,
                state
            });

            if (result.success) {
                setProfileSuccess(result.message || 'Profile updated successfully!');
                setIsEditingProfile(false);
            } else {
                setProfileError(result.message || 'Failed to update profile.');
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to update profile.';
            setProfileError(message);
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleProfileCancel = () => {
        setFirstName(user?.firstName || '');
        setLastName(user?.lastName || '');
        setEmail(user?.email || '');
        setMobileNumber(user?.mobileNumber || '');
        setAddress(user?.address || '');
        setCity(user?.city || '');
        setState(user?.state || '');
        setIsEditingProfile(false);
        setProfileError('');
        setProfileSuccess('');
    };

    // Filter active orders
    const activeOrders = orders.filter(order =>
        order.status && !["DONE", "REPORTED", "CANCELLED", "FAILED", "COMPLETED"].includes(order.status.toUpperCase())
    );

    if (userLoading) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
                <Loader className="animate-spin text-blue-600 h-10 w-10" />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 bg-gray-50 min-h-[calc(100vh-200px)]">
            <h1 className="text-3xl font-bold mb-8 text-gray-800">My Account</h1>

            {/* Account Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Orders</p>
                            <p className="text-2xl font-bold text-gray-800">{accountStats.totalOrders}</p>
                        </div>
                        <PackageIcon className="h-8 w-8 text-blue-500" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Spent</p>
                            <p className="text-2xl font-bold text-gray-800">₹{accountStats.totalSpent.toLocaleString()}</p>
                        </div>
                        <ShoppingCart className="h-8 w-8 text-green-500" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Active Orders</p>
                            <p className="text-2xl font-bold text-gray-800">{accountStats.activeOrders}</p>
                        </div>
                        <Clock className="h-8 w-8 text-yellow-500" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Completed</p>
                            <p className="text-2xl font-bold text-gray-800">{accountStats.completedOrders}</p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* ------------------- PROFILE SECTION ------------------- */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                        {/* Profile Header */}
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
                                <User className="h-5 w-5 text-blue-600" /> My Profile
                            </h2>

                            {!isEditingProfile && (
                                <button
                                    onClick={() => setIsEditingProfile(true)}
                                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                                >
                                    <Edit3 className="h-4 w-4" /> Edit
                                </button>
                            )}
                        </div>

                        {profileError && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-600 text-sm flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" /> {profileError}
                                </p>
                            </div>
                        )}

                        {profileSuccess && (
                            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-green-600 text-sm flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4" /> {profileSuccess}
                                </p>
                            </div>
                        )}

                        {/* Editing Mode */}
                        {isEditingProfile ? (
                            <form onSubmit={handleProfileSave} className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                        <input
                                            type="text"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            disabled={isSavingProfile}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                        <input
                                            type="text"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            disabled={isSavingProfile}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={isSavingProfile}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                                    <input
                                        type="tel"
                                        value={mobileNumber}
                                        onChange={(e) => setMobileNumber(e.target.value)}
                                        disabled={isSavingProfile}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
                                        placeholder="+91 9876543210"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">You can update your mobile number</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                    <textarea
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        disabled={isSavingProfile}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                        <input
                                            type="text"
                                            value={city}
                                            onChange={(e) => setCity(e.target.value)}
                                            disabled={isSavingProfile}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                                        <input
                                            type="text"
                                            value={state}
                                            onChange={(e) => setState(e.target.value)}
                                            disabled={isSavingProfile}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="submit"
                                        disabled={isSavingProfile}
                                        className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSavingProfile ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <Loader className="h-4 w-4 animate-spin" /> Saving...
                                            </span>
                                        ) : (
                                            <span className="flex items-center justify-center gap-2">
                                                <Save className="h-4 w-4" /> Save Changes
                                            </span>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleProfileCancel}
                                        disabled={isSavingProfile}
                                        className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-4">
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <User className="h-5 w-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-gray-500">Name</p>
                                            <p className="font-medium">{firstName} {lastName}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-gray-500">Mobile Number</p>
                                            <p className="font-medium">{mobileNumber || 'Not set'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-gray-500">Email</p>
                                            <p className="font-medium">{email}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">Primary contact</p>
                                        </div>
                                    </div>

                                    {address && (
                                        <div className="flex items-start gap-3">
                                            <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                                            <div>
                                                <p className="text-sm text-gray-500">Address</p>
                                                <p className="font-medium">{address}</p>
                                                {(city || state) && (
                                                    <p className="text-sm text-gray-600">{city}, {state}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => setShowChangePasswordModal(true)}
                                    className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                                >
                                    <Lock className="h-4 w-4" /> Change Password
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* ------------------- MY ORDERS SECTION ------------------- */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-blue-600" /> Active Orders
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">Your recent and ongoing orders</p>
                            </div>
                        </div>

                        {ordersLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="animate-pulse">
                                        <div className="h-32 bg-gray-200 rounded-lg"></div>
                                    </div>
                                ))}
                            </div>
                        ) : ordersError ? (
                            <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex items-center gap-3 text-red-700">
                                    <AlertCircle className="h-5 w-5" />
                                    <div>
                                        <p className="font-medium">Failed to load orders</p>
                                        <p className="text-sm mt-1">{ordersError}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : activeOrders.length === 0 ? (
                            <div className="p-8 text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                                    <PackageIcon className="h-8 w-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-700 mb-2">No Active Orders</h3>
                                <p className="text-gray-500 mb-6">You don&apos;t have any active orders at the moment.</p>
                                <Link
                                    href="/profiles"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                                >
                                    <ShoppingCart className="h-4 w-4" />
                                    Browse Packages
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {activeOrders.map((order) => (
                                    <OrderCard key={order.orderId} order={order} showContactSupport={true} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Recent Activity Section */}
                    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2 mb-4">
                            <Calendar className="h-5 w-5 text-blue-600" /> Recent Activity
                        </h2>
                        <div className="space-y-3">
                            {orders.slice(0, 3).map((order) => (
                                <div key={order.orderId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded ${order.status === 'COMPLETED' ? 'bg-green-100 text-green-600' :
                                            order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-600' :
                                                'bg-gray-100 text-gray-600'
                                            }`}>
                                            <PackageIcon className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">Order #{order.orderId}</p>
                                            <p className="text-xs text-gray-500">{order.package?.name}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium">₹{order.package?.price?.toLocaleString()}</p>
                                        <p className="text-xs text-gray-500">
                                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            ))}

                            {orders.length === 0 && (
                                <p className="text-gray-500 text-sm text-center py-4">No recent activity</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* PASSWORD MODAL */}
            {showChangePasswordModal && (
                <Modal onClose={() => setShowChangePasswordModal(false)}>
                    <ForgotPasswordForm onClose={() => setShowChangePasswordModal(false)} onSwitchToLogin={() => setShowChangePasswordModal(false)} />
                </Modal>
            )}
        </div>
    );
}
