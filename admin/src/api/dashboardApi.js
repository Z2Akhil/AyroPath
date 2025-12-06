import { axiosInstance } from './axiosInstance';

const dashboardApi = {
  getDashboardData: async () => {
    try {
      const response = await axiosInstance.get('/admin/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }
};

export default dashboardApi;
