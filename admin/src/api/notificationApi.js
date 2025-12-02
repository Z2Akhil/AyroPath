import { axiosInstance } from './axiosInstance';

export const notificationApi = {
  // Send new notification
  sendNotification: async (notificationData) => {
    try {
      const response = await axiosInstance.post('/admin/notifications', notificationData);
      return response.data;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  },

  // Get notification history with pagination
  getNotifications: async (page = 1, limit = 10, filters = {}) => {
    try {
      const params = { page, limit, ...filters };
      const response = await axiosInstance.get('/admin/notifications', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  // Get notification statistics
  getNotificationStats: async () => {
    try {
      const response = await axiosInstance.get('/admin/notifications/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      throw error;
    }
  },

  // Get specific notification details
  getNotificationById: async (id) => {
    try {
      const response = await axiosInstance.get(`/admin/notifications/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching notification:', error);
      throw error;
    }
  },

  // Retry failed deliveries for a notification
  retryFailed: async (id) => {
    try {
      const response = await axiosInstance.post(`/admin/notifications/${id}/retry-failed`);
      return response.data;
    } catch (error) {
      console.error('Error retrying failed emails:', error);
      throw error;
    }
  },

  // Get users for notification (for UserSelector component)
  getUsersForNotification: async (page = 1, limit = 50, search = '') => {
    try {
      const params = { page, limit, search };
      const response = await axiosInstance.get('/admin/notifications/users/list', { params });
      // The API returns { success: true, data: [], pagination: {} }
      return {
        success: response.data.success,
        data: response.data.data || [],
        totalCount: response.data.pagination?.total || 0
      };
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }
};
