import { adminAxios } from './adminAxios';

export interface NotificationData {
    subject: string;
    content: string;
    emailType: string;
    userIds: string[];
}

export interface NotificationHistoryFilters {
    page?: number;
    limit?: number;
    [key: string]: any;
}

export const adminNotificationApi = {
    // Send new notification
    sendNotification: async (notificationData: NotificationData) => {
        try {
            const response = await adminAxios.post('/admin/notifications', notificationData);
            return response.data;
        } catch (error) {
            console.error('Error sending notification:', error);
            throw error;
        }
    },

    // Get notification history with pagination
    getNotifications: async (page = 1, limit = 10, filters: NotificationHistoryFilters = {}) => {
        try {
            const params = { page, limit, ...filters };
            const response = await adminAxios.get('/admin/notifications', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching notifications:', error);
            throw error;
        }
    },

    // Get notification statistics
    getNotificationStats: async () => {
        try {
            const response = await adminAxios.get('/admin/notifications/stats');
            return response.data;
        } catch (error) {
            console.error('Error fetching notification stats:', error);
            throw error;
        }
    },

    // Get specific notification details
    getNotificationById: async (id: string) => {
        try {
            const response = await adminAxios.get(`/admin/notifications/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching notification:', error);
            throw error;
        }
    },

    // Retry failed deliveries for a notification
    retryFailed: async (id: string) => {
        try {
            const response = await adminAxios.post(`/admin/notifications/${id}/retry-failed`);
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
            const response = await adminAxios.get('/admin/notifications/users/list', { params });
            // The API returns { success: true, data: [], pagination: {} }
            return {
                success: response.data.success,
                data: response.data.data || [],
                totalCount: response.data.pagination?.total || 0,
                message: response.data.message
            };
        } catch (error: any) {
            console.error('Error fetching users:', error);
            throw error;
        }
    }
};
