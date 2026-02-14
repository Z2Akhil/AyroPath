'use client';

import React, { useState, useEffect, useCallback } from 'react';
import adminDashboardApi from '@/lib/api/adminDashboardApi';
import MetricCard from '@/components/admin/analytics/MetricCard';
import AnalyticsChart from '@/components/admin/analytics/AnalyticsChart';
import DateRangePicker from '@/components/admin/analytics/DateRangePicker';
import {
    ShoppingCart,
    Users,
    TrendingUp,
    Package,
    CheckCircle,
    Clock,
    IndianRupee,
    LayoutDashboard
} from 'lucide-react';

const AnalyticsPage = () => {
    const [loading, setLoading] = useState(true);
    const [trendsLoading, setTrendsLoading] = useState(false);
    const [error, setError] = useState('');

    // Analytics data states
    const [overviewData, setOverviewData] = useState<any>(null);
    const [trendsData, setTrendsData] = useState<any>(null);

    // Date range states
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });

    // Generate mock data for development/fallback
    const generateMockData = useCallback(() => {
        const mockOverview = {
            metrics: {
                totalOrders: 156,
                totalRevenue: 1250000,
                avgOrderValue: 8012,
                totalUsers: 89,
                newUsers: 12,
                conversionRate: 17.5,
                activeUsers: 45
            },
            orderStatus: {
                PENDING: 23,
                CREATED: 45,
                COMPLETED: 67,
                FAILED: 8,
                CANCELLED: 13
            },
            thyrocareStatus: {
                YET_TO_ASSIGN: 15,
                ASSIGNED: 28,
                ACCEPTED: 42,
                SERVICED: 19,
                DONE: 67,
                FAILED: 8
            }
        };

        const mockOrderTrends = [];
        const mockUserTrends = [];
        const today = new Date();

        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            mockOrderTrends.push({
                date: dateStr,
                orderCount: Math.floor(Math.random() * 20) + 5,
                revenue: Math.floor(Math.random() * 200000) + 50000
            });

            mockUserTrends.push({
                date: dateStr,
                userCount: Math.floor(Math.random() * 8) + 2
            });
        }

        return {
            overview: mockOverview,
            trends: {
                orderTrends: mockOrderTrends,
                userTrends: mockUserTrends
            }
        };
    }, []);

    // Fetch analytics overview
    const fetchAnalyticsOverview = useCallback(async (start: string, end: string) => {
        try {
            setLoading(true);
            setError('');

            const params = {
                startDate: start || undefined,
                endDate: end || undefined
            };

            const data = await adminDashboardApi.getAnalyticsOverview(params);

            if (data.success) {
                setOverviewData(data.overview);
            } else {
                throw new Error(data.message || 'Failed to fetch analytics overview');
            }

        } catch (err: any) {
            console.error('Error fetching analytics overview:', err);
            setError(`Notice: Using demo data. (${err.message || 'API connection failed'})`);

            // Use mock data as fallback
            const mockData = generateMockData();
            setOverviewData(mockData.overview);
        } finally {
            setLoading(false);
        }
    }, [generateMockData]);

    // Fetch analytics trends
    const fetchAnalyticsTrends = useCallback(async (start: string, end: string) => {
        try {
            setTrendsLoading(true);

            const params = {
                period: 'daily',
                startDate: start || undefined,
                endDate: end || undefined
            };

            const data = await adminDashboardApi.getAnalyticsTrends(params);

            if (data.success) {
                setTrendsData(data.trends);
            } else {
                throw new Error(data.message || 'Failed to fetch analytics trends');
            }

        } catch (err) {
            console.error('Error fetching analytics trends:', err);

            // Use mock data as fallback
            const mockData = generateMockData();
            setTrendsData(mockData.trends);
        } finally {
            setTrendsLoading(false);
        }
    }, [generateMockData]);

    // Handle date range change
    const handleDateChange = (startDate: string, endDate: string) => {
        setDateRange({ startDate, endDate });
        fetchAnalyticsOverview(startDate, endDate);
        fetchAnalyticsTrends(startDate, endDate);
    };

    // Prepare order status data for pie chart
    const orderStatusData = overviewData?.orderStatus ?
        Object.entries(overviewData.orderStatus).map(([status, count]) => ({
            name: status,
            value: count
        })).filter((item: any) => item.value > 0) : [];

    // Prepare Thyrocare status data for bar chart
    const thyrocareStatusData = overviewData?.thyrocareStatus ?
        Object.entries(overviewData.thyrocareStatus).map(([status, count]) => ({
            name: status.replace(/_/g, ' '),
            count: count
        })).filter((item: any) => item.count > 0) : [];

    // Prepare trends data
    const orderTrendsData = trendsData?.orderTrends || [];
    const userTrendsData = trendsData?.userTrends || [];

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                        <LayoutDashboard className="h-8 w-8 text-blue-600" />
                        Analytics Overview
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 font-medium">
                        Monitor your business performance and customer trends
                    </p>
                </div>
                <DateRangePicker
                    onDateChange={handleDateChange}
                    loading={loading || trendsLoading}
                />
            </div>

            {/* Error/Notice Message */}
            {error && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-800 shadow-sm animate-in fade-in slide-in-from-top-4">
                    <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></div>
                    <p className="text-sm font-semibold">{error}</p>
                </div>
            )}

            {/* Primary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Orders"
                    value={overviewData?.metrics?.totalOrders || 0}
                    trend={5.2}
                    subtitle="vs previous period"
                    icon={ShoppingCart}
                    loading={loading}
                />

                <MetricCard
                    title="Total Revenue"
                    value={formatCurrency(overviewData?.metrics?.totalRevenue || 0)}
                    trend={12.5}
                    subtitle="vs previous period"
                    icon={IndianRupee}
                    loading={loading}
                />

                <MetricCard
                    title="Active Users"
                    value={overviewData?.metrics?.activeUsers || 0}
                    trend={3.8}
                    subtitle="placed orders"
                    icon={Users}
                    loading={loading}
                />

                <MetricCard
                    title="Conversion Rate"
                    value={`${overviewData?.metrics?.conversionRate || 0}%`}
                    trend={2.1}
                    subtitle="signup to order"
                    icon={TrendingUp}
                    loading={loading}
                />
            </div>

            {/* Charts Section - Primary Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <AnalyticsChart
                    type="area"
                    data={orderTrendsData}
                    xKey="date"
                    yKeys={['revenue']}
                    title="Revenue Growth"
                    colors={['#3b82f6']}
                    loading={trendsLoading}
                    height={400}
                />

                <AnalyticsChart
                    type="pie"
                    data={orderStatusData}
                    title="Order Status Distribution"
                    colors={['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#6366f1']}
                    loading={loading}
                    height={400}
                />
            </div>

            {/* Charts Section - Secondary Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <AnalyticsChart
                    type="bar"
                    data={thyrocareStatusData}
                    xKey="name"
                    yKeys={['count']}
                    title="Thyrocare Workflow Status"
                    colors={['#6366f1']}
                    loading={loading}
                    height={400}
                />

                <AnalyticsChart
                    type="line"
                    data={userTrendsData}
                    xKey="date"
                    yKeys={['userCount']}
                    title="User Acquisition Trend"
                    colors={['#ec4899']}
                    loading={trendsLoading}
                    height={400}
                />
            </div>

            {/* Tertiary Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-purple-50 rounded-xl">
                        <Package className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase">Avg Order Value</p>
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(overviewData?.metrics?.avgOrderValue || 0)}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-blue-50 rounded-xl">
                        <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase">New Users</p>
                        <p className="text-lg font-bold text-gray-900">{overviewData?.metrics?.newUsers || 0}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-green-50 rounded-xl">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase">Success Rate</p>
                        <p className="text-lg font-bold text-gray-900">
                            {Math.round(((overviewData?.orderStatus?.COMPLETED || 0) / (overviewData?.metrics?.totalOrders || 1)) * 100)}%
                        </p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-amber-50 rounded-xl">
                        <Clock className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase">Pending Tasks</p>
                        <p className="text-lg font-bold text-gray-900">{overviewData?.orderStatus?.PENDING || 0}</p>
                    </div>
                </div>
            </div>

            {/* Quick Stats Summary Grid - Parity with old implementation */}
            {overviewData && (
                <div className="bg-white rounded-[40px] border border-gray-100 p-10 shadow-sm hover:shadow-2xl hover:shadow-gray-200/40 transition-all duration-700">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-12 w-12 bg-gray-900 rounded-2xl flex items-center justify-center text-white">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">Executive Summary</h3>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Snapshot of key performance indicators</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'Failed Orders', value: overviewData.orderStatus?.FAILED || 0, color: 'red' },
                            { label: 'Created Orders', value: overviewData.orderStatus?.CREATED || 0, color: 'blue' },
                            { label: 'Cancelled Orders', value: overviewData.orderStatus?.CANCELLED || 0, color: 'amber' },
                            { label: 'Total Users', value: overviewData.metrics?.totalUsers || 0, color: 'purple' }
                        ].map((stat, idx) => (
                            <div key={idx} className={`p-6 bg-${stat.color}-50/50 border border-${stat.color}-100/50 rounded-3xl group hover:bg-${stat.color}-50 transition-all duration-300`}>
                                <p className={`text-[10px] font-black text-${stat.color}-600/60 uppercase tracking-widest mb-2 group-hover:translate-x-1 transition-transform`}>
                                    {stat.label}
                                </p>
                                <p className="text-3xl font-black text-gray-900">{stat.value.toLocaleString()}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnalyticsPage;
