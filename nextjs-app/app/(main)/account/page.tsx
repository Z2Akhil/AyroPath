'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@/providers/UserProvider';
import {
    User, Edit3, Save, Phone, Loader, ShoppingCart,
    FileText, Mail, Calendar, Package as PackageIcon,
    AlertCircle, CheckCircle, Clock, X
} from 'lucide-react';
import { fetchUserOrders, Order } from '@/lib/api/ordersApi';
import OrderCard from '@/components/orders/OrderCard';
import dynamic from 'next/dynamic';

const ManageAddresses = dynamic(() => import('@/components/account/ManageAddresses'), { ssr: false });

export default function AccountPage() {
    const { user, updateProfile, loading: userLoading } = useUser();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const [isEditing, setIsEditing] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [profileError, setProfileError] = useState('');
    const [profileSuccess, setProfileSuccess] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const [orders, setOrders] = useState<Order[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [ordersError, setOrdersError] = useState('');
    const [accountStats, setAccountStats] = useState({ totalOrders: 0, totalSpent: 0, activeOrders: 0, completedOrders: 0 });

    useEffect(() => {
        if (user) {
            setFirstName(user.firstName || '');
            setLastName(user.lastName || '');
            setEmail(user.email || '');
        }
    }, [user]);

    useEffect(() => {
        if (!userLoading && !user) router.replace('/');
    }, [user, userLoading, router]);

    useEffect(() => {
        if (!user) return;
        const load = async () => {
            try {
                setOrdersLoading(true);
                const data = await fetchUserOrders();
                setOrders(data || []);
                setAccountStats({
                    totalOrders: data?.length || 0,
                    totalSpent: data?.reduce((s, o) => s + (o.payment?.amount || o.package?.price || 0), 0) || 0,
                    activeOrders: data?.filter(o => o.status && !['DONE', 'REPORTED', 'CANCELLED', 'FAILED'].includes(o.status.toUpperCase())).length || 0,
                    completedOrders: data?.filter(o => o.status && ['DONE', 'REPORTED', 'COMPLETED'].includes(o.status.toUpperCase())).length || 0,
                });
            } catch { setOrdersError('Unable to load orders.'); }
            finally { setOrdersLoading(false); }
        };
        load();
    }, [user]);

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setProfileError('');
        setProfileSuccess('');
        setIsSaving(true);
        try {
            const result = await updateProfile({ firstName, lastName, email: email || undefined });
            if (result.success) {
                setProfileSuccess('Profile updated successfully!');
                setIsEditing(false);
            } else {
                setProfileError(result.message || 'Failed to update profile.');
            }
        } catch (err) {
            setProfileError(err instanceof Error ? err.message : 'Failed to update profile.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setFirstName(user?.firstName || '');
        setLastName(user?.lastName || '');
        setEmail(user?.email || '');
        setIsEditing(false);
        setProfileError('');
        setProfileSuccess('');
    };

    const activeOrders = orders.filter(o =>
        o.status && !['DONE', 'REPORTED', 'CANCELLED', 'FAILED', 'COMPLETED'].includes(o.status.toUpperCase())
    );

    if (!mounted || userLoading) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
                <Loader className="animate-spin text-blue-600 h-10 w-10" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 bg-gray-50 min-h-[calc(100vh-200px)]">
            <h1 className="text-3xl font-bold mb-8 text-gray-800">My Account</h1>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Total Orders', value: accountStats.totalOrders, icon: PackageIcon, color: 'text-blue-500' },
                    { label: 'Total Spent', value: `₹${accountStats.totalSpent.toLocaleString()}`, icon: ShoppingCart, color: 'text-green-500' },
                    { label: 'Active Orders', value: accountStats.activeOrders, icon: Clock, color: 'text-yellow-500' },
                    { label: 'Completed', value: accountStats.completedOrders, icon: CheckCircle, color: 'text-green-500' },
                ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">{label}</p>
                            <p className="text-2xl font-bold text-gray-800">{value}</p>
                        </div>
                        <Icon className={`h-8 w-8 ${color}`} />
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left column: profile + addresses */}
                <div className="lg:col-span-1 space-y-6">

                    {/* Profile Card */}
                    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
                                <User className="h-5 w-5 text-blue-600" /> My Profile
                            </h2>
                            {!isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                >
                                    <Edit3 className="h-4 w-4" /> Edit
                                </button>
                            )}
                        </div>

                        {profileError && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600 text-sm">
                                <AlertCircle className="h-4 w-4 shrink-0" /> {profileError}
                            </div>
                        )}
                        {profileSuccess && (
                            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-600 text-sm">
                                <CheckCircle className="h-4 w-4 shrink-0" /> {profileSuccess}
                            </div>
                        )}

                        {isEditing ? (
                            <form onSubmit={handleSave} className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                        <input
                                            type="text"
                                            value={firstName}
                                            onChange={e => setFirstName(e.target.value)}
                                            disabled={isSaving}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                        <input
                                            type="text"
                                            value={lastName}
                                            onChange={e => setLastName(e.target.value)}
                                            disabled={isSaving}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email <span className="text-gray-400 font-normal">(optional)</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        disabled={isSaving}
                                        placeholder="your@email.com"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div className="flex gap-2 pt-1">
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                                    >
                                        {isSaving ? <Loader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        {isSaving ? 'Saving...' : 'Save'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        disabled={isSaving}
                                        className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                                    >
                                        <X className="h-4 w-4" /> Cancel
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <User className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm text-gray-500">Name</p>
                                        <p className="font-medium">{[firstName, lastName].filter(Boolean).join(' ') || '—'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Phone className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm text-gray-500">Mobile</p>
                                        <p className="font-medium">{user.mobileNumber}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Mail className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm text-gray-500">Email</p>
                                        <p className="font-medium">{email || <span className="text-gray-400 italic text-sm">Not added</span>}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Manage Addresses */}
                    <ManageAddresses />
                </div>

                {/* Right column: orders */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
                                <FileText className="h-5 w-5 text-blue-600" /> Active Orders
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">Your recent and ongoing orders</p>
                        </div>

                        {ordersLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="animate-pulse h-32 bg-gray-200 rounded-lg" />
                                ))}
                            </div>
                        ) : ordersError ? (
                            <div className="p-6 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
                                <AlertCircle className="h-5 w-5 shrink-0" />
                                <div>
                                    <p className="font-medium">Failed to load orders</p>
                                    <p className="text-sm mt-1">{ordersError}</p>
                                </div>
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
                                    <ShoppingCart className="h-4 w-4" /> Browse Packages
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {activeOrders.map(order => (
                                    <OrderCard key={order.orderId} order={order} showContactSupport={true} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2 mb-4">
                            <Calendar className="h-5 w-5 text-blue-600" /> Recent Activity
                        </h2>
                        <div className="space-y-3">
                            {orders.slice(0, 3).map(order => (
                                <div key={order.orderId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded ${order.status === 'COMPLETED' ? 'bg-green-100 text-green-600' : order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-600'}`}>
                                            <PackageIcon className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">Order #{order.orderId}</p>
                                            <p className="text-xs text-gray-500">{order.package?.name}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium">₹{(order.payment?.amount || order.package?.price || 0).toLocaleString()}</p>
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
        </div>
    );
}
