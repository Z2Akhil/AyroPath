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
    }
};

export default adminDashboardApi;
