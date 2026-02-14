import { adminAxios } from './adminAxios';

const adminDashboardApi = {
    getDashboardData: async () => {
        try {
            const response = await adminAxios.get('/admin/dashboard');
            return response.data;
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            throw error;
        }
    },
    getAnalyticsOverview: async (params: any) => {
        try {
            const response = await adminAxios.get('/admin/analytics/overview', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching analytics overview:', error);
            throw error;
        }
    },
    getAnalyticsTrends: async (params: any) => {
        try {
            const response = await adminAxios.get('/admin/analytics/trends', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching analytics trends:', error);
            throw error;
        }
    }
};

export default adminDashboardApi;
