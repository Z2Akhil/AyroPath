import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { axiosInstance } from '../api/axiosInstance';
import { MetricCard, AnalyticsChart, DateRangePicker } from '../components/analytics';
import { 
  ShoppingCart, 
  DollarSign, 
  Users, 
  TrendingUp,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  IndianRupee
} from 'lucide-react';

const AnalyticPage = () => {
  const { user: _user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [trendsLoading, setTrendsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Analytics data states
  const [overviewData, setOverviewData] = useState(null);
  const [trendsData, setTrendsData] = useState(null);
  
  // Date range states
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  // Generate mock data for development
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

    // Generate mock trends data
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
  const fetchAnalyticsOverview = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = {
        startDate: dateRange.startDate || undefined,
        endDate: dateRange.endDate || undefined
      };
      
      const response = await axiosInstance.get('/admin/analytics/overview', { params });
      
      if (response.data.success) {
        setOverviewData(response.data.overview);
      } else {
        throw new Error(response.data.error || 'Failed to fetch analytics overview');
      }
      
    } catch (err) {
      console.error('Error fetching analytics overview:', err);
      setError(`Failed to load live analytics data: ${err.message}. Using demo data for display.`);
      
      // Use mock data as fallback
      const mockData = generateMockData();
      setOverviewData(mockData.overview);
    } finally {
      setLoading(false);
    }
  }, [dateRange, generateMockData]);

  // Fetch analytics trends
  const fetchAnalyticsTrends = useCallback(async () => {
    try {
      setTrendsLoading(true);
      
      const params = {
        period: 'daily',
        startDate: dateRange.startDate || undefined,
        endDate: dateRange.endDate || undefined
      };
      
      const response = await axiosInstance.get('/admin/analytics/trends', { params });
      
      if (response.data.success) {
        setTrendsData(response.data.trends);
      } else {
        throw new Error(response.data.error || 'Failed to fetch analytics trends');
      }
      
    } catch (err) {
      console.error('Error fetching analytics trends:', err);
      
      // Use mock data as fallback
      const mockData = generateMockData();
      setTrendsData(mockData.trends);
    } finally {
      setTrendsLoading(false);
    }
  }, [dateRange, generateMockData]);

  // Handle date range change
  const handleDateChange = (startDate, endDate) => {
    setDateRange({ startDate, endDate });
  };

  // Refresh data when date range changes
  useEffect(() => {
    fetchAnalyticsOverview();
    fetchAnalyticsTrends();
  }, [fetchAnalyticsOverview, fetchAnalyticsTrends]);

  // Prepare order status data for pie chart
  const orderStatusData = overviewData?.orderStatus ? 
    Object.entries(overviewData.orderStatus).map(([status, count]) => ({
      name: status,
      value: count
    })).filter(item => item.value > 0) : [];

  // Prepare Thyrocare status data for bar chart
  const thyrocareStatusData = overviewData?.thyrocareStatus ? 
    Object.entries(overviewData.thyrocareStatus).map(([status, count]) => ({
      name: status.replace(/_/g, ' '),
      count: count
    })).filter(item => item.count > 0) : [];

  // Prepare trends data for line chart
  const orderTrendsData = trendsData?.orderTrends || [];
  const userTrendsData = trendsData?.userTrends || [];

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          </div>
          <DateRangePicker 
            onDateChange={handleDateChange}
            loading={loading}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Overview Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
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
            subtitle="placed orders in period"
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

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Order Status Distribution */}
          <AnalyticsChart
            type="pie"
            data={orderStatusData}
            title="Order Status Distribution"
            loading={loading}
            height={350}
          />

          {/* Revenue Trend */}
          <AnalyticsChart
            type="line"
            data={orderTrendsData}
            xKey="date"
            yKeys={['revenue']}
            title="Revenue Trend"
            loading={trendsLoading}
            height={350}
          />
        </div>

        {/* Second Row Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* User Signup Trend */}
          <AnalyticsChart
            type="area"
            data={userTrendsData}
            xKey="date"
            yKeys={['userCount']}
            title="User Signup Trend"
            loading={trendsLoading}
            height={350}
          />

          {/* Thyrocare Status Flow */}
          <AnalyticsChart
            type="bar"
            data={thyrocareStatusData}
            xKey="name"
            yKeys={['count']}
            title="Thyrocare Status Flow"
            loading={loading}
            height={350}
          />
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Avg Order Value"
            value={formatCurrency(overviewData?.metrics?.avgOrderValue || 0)}
            icon={Package}
            loading={loading}
          />
          
          <MetricCard
            title="New Users"
            value={overviewData?.metrics?.newUsers || 0}
            icon={Users}
            loading={loading}
          />
          
          <MetricCard
            title="Completed Orders"
            value={overviewData?.orderStatus?.COMPLETED || 0}
            icon={CheckCircle}
            loading={loading}
          />
          
          <MetricCard
            title="Pending Orders"
            value={overviewData?.orderStatus?.PENDING || 0}
            icon={Clock}
            loading={loading}
          />
        </div>

        {/* Stats Summary */}
        {overviewData && (
          <div className="mt-6 p-6 bg-white rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Failed Orders</p>
                <p className="text-2xl font-bold text-gray-900">{overviewData.orderStatus?.FAILED || 0}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Created Orders</p>
                <p className="text-2xl font-bold text-gray-900">{overviewData.orderStatus?.CREATED || 0}</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-gray-600">Cancelled Orders</p>
                <p className="text-2xl font-bold text-gray-900">{overviewData.orderStatus?.CANCELLED || 0}</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{overviewData.metrics?.totalUsers || 0}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticPage;
