'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Search,
    History,
    Clock,
    CheckCircle,
    AlertCircle,
    ChevronRight,
    Filter,
    RefreshCw,
    Mail,
    User,
    ArrowRight,
    RotateCcw
} from 'lucide-react';
import { adminNotificationApi } from '@/lib/api/adminNotificationApi';

const NotificationHistory = () => {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const fetchHistory = useCallback(async () => {
        try {
            setLoading(true);
            const data = await adminNotificationApi.getNotifications(page, 10, {
                search: searchTerm,
                status: statusFilter !== 'all' ? statusFilter : undefined
            });

            if (data.success) {
                setHistory(data.notifications || []);
                setTotalCount(data.pagination?.total || 0);
            }
        } catch (err) {
            console.error('Error fetching notification history:', err);
            // Fallback with mock data for UI development
            setHistory([
                {
                    _id: '1',
                    subject: 'Special Offer: 20% Off All Health Packages',
                    emailType: 'promotional',
                    status: 'completed',
                    recipientCount: 145,
                    deliveredCount: 142,
                    failedCount: 3,
                    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
                },
                {
                    _id: '2',
                    subject: 'Your Account Verification',
                    emailType: 'transactional',
                    status: 'pending',
                    recipientCount: 1,
                    deliveredCount: 0,
                    failedCount: 0,
                    createdAt: new Date().toISOString()
                },
                {
                    _id: '3',
                    subject: 'Weekend Wellness Camp Invitation',
                    emailType: 'promotional',
                    status: 'failed',
                    recipientCount: 890,
                    deliveredCount: 0,
                    failedCount: 890,
                    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
                }
            ]);
        } finally {
            setLoading(false);
        }
    }, [page, searchTerm, statusFilter]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'completed': return { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle };
            case 'failed': return { bg: 'bg-red-100', text: 'text-red-700', icon: AlertCircle };
            default: return { bg: 'bg-blue-100', text: 'text-blue-700', icon: Clock };
        }
    };

    const retryFailed = async (id: string) => {
        try {
            await adminNotificationApi.retryFailed(id);
            fetchHistory();
        } catch (err) {
            console.error('Error retrying notification:', err);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header & Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-xl text-gray-500">
                        <History className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Delivery Logs</h2>
                        <p className="text-xs text-gray-500 font-medium">Track your communication history</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative group min-w-[240px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search subjects..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-xs font-medium"
                        />
                    </div>

                    <div className="flex items-center bg-white border border-gray-100 rounded-xl p-1 shadow-sm">
                        {['all', 'completed', 'pending'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all duration-200 ${statusFilter === status
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={fetchHistory}
                        className="p-2 bg-white border border-gray-100 rounded-xl hover:text-blue-600 transition-colors"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* History List */}
            <div className="space-y-4">
                {loading && history.length === 0 ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-40 bg-white rounded-3xl border border-gray-50 animate-pulse"></div>
                    ))
                ) : history.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-dashed border-gray-200 py-20 flex flex-col items-center justify-center text-gray-400 gap-4">
                        <Mail className="h-12 w-12 opacity-10" />
                        <p className="text-sm font-medium">No notification history found</p>
                    </div>
                ) : (
                    history.map((item) => {
                        const statusStyle = getStatusStyle(item.status);
                        return (
                            <div
                                key={item._id}
                                className="group bg-white rounded-3xl border border-gray-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 p-6"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    {/* Left: Info */}
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusStyle.bg} ${statusStyle.text} flex items-center gap-1.5`}>
                                                <statusStyle.icon className="h-3 w-3" />
                                                {item.status}
                                            </span>
                                            <span className="text-[10px] font-bold text-gray-400 border border-gray-100 px-2 py-1 rounded-full uppercase tracking-widest">
                                                {item.emailType}
                                            </span>
                                            <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1.5">
                                                <Clock className="h-3 w-3" />
                                                {new Date(item.createdAt).toLocaleDateString('en-IN', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                        </div>

                                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                                            {item.subject}
                                        </h3>

                                        <div className="flex items-center gap-6">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-gray-50 rounded-lg">
                                                    <User className="h-3.5 w-3.5 text-gray-400" />
                                                </div>
                                                <p className="text-xs font-bold text-gray-500">
                                                    {item.recipientCount} <span className="font-medium text-gray-400">Total</span>
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-green-50 rounded-lg">
                                                    <CheckCircle className="h-3.5 w-3.5 text-green-400" />
                                                </div>
                                                <p className="text-xs font-bold text-green-600">
                                                    {item.deliveredCount} <span className="font-medium text-green-400">Delivered</span>
                                                </p>
                                            </div>
                                            {item.failedCount > 0 && (
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 bg-red-50 rounded-lg">
                                                        <AlertCircle className="h-3.5 w-3.5 text-red-400" />
                                                    </div>
                                                    <p className="text-xs font-bold text-red-600">
                                                        {item.failedCount} <span className="font-medium text-red-400">Failed</span>
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="flex items-center gap-3 self-end md:self-center">
                                        {item.status === 'failed' && (
                                            <button
                                                onClick={() => retryFailed(item._id)}
                                                className="flex items-center gap-2 px-4 py-2 border border-red-100 text-red-600 rounded-xl hover:bg-red-50 text-xs font-bold transition-all"
                                            >
                                                <RotateCcw className="h-3.5 w-3.5" /> Retry Failed
                                            </button>
                                        )}
                                        <button className="h-10 w-10 flex items-center justify-center bg-gray-50 text-gray-400 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                            <ChevronRight className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Pagination Bar */}
            {totalCount > 10 && (
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-xs font-bold text-gray-500 uppercase">
                        Showing {history.length} of {totalCount} records
                    </p>
                    <div className="flex gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 rounded-lg disabled:opacity-30 transition-all border border-gray-100"
                        >
                            Previous
                        </button>
                        <button
                            disabled={page * 10 >= totalCount}
                            onClick={() => setPage(p => p + 1)}
                            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-lg disabled:opacity-30 transition-all border border-blue-700 shadow-md shadow-blue-500/20"
                        >
                            Next Page
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationHistory;
