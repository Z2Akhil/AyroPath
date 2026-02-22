import { adminAxios } from './adminAxios';
import { AdminOrder, OrderSearchResponse, OrderStats } from '@/types/admin';

const adminOrderApi = {
    getOrders: async (params: {
        page?: number;
        limit?: number;
        status?: string;
        thyrocareStatus?: string;
        startDate?: string;
        endDate?: string;
        search?: string;
    }): Promise<OrderSearchResponse> => {
        const response = await adminAxios.get('/admin/orders', { params });
        return response.data;
    },

    getOrderStats: async (): Promise<{ success: boolean; stats: OrderStats }> => {
        const response = await adminAxios.get('/admin/orders/stats');
        return response.data;
    },

    getOrder: async (orderId: string): Promise<{ success: boolean; order: AdminOrder }> => {
        const response = await adminAxios.get(`/admin/orders/${orderId}`);
        return response.data;
    },

    updateOrder: async (orderId: string, data: any): Promise<{ success: boolean; order: AdminOrder; message: string }> => {
        const response = await adminAxios.put(`/admin/orders/${orderId}`, data);
        return response.data;
    },

    syncOrderStatus: async (orderId: string): Promise<{
        success: boolean;
        message: string;
        statusChanged: boolean;
        oldStatus?: string;
        newStatus?: string;
    }> => {
        const response = await adminAxios.post(`/admin/orders/${orderId}/sync-status`);
        return response.data;
    },

    syncOrdersStatus: async (orderIds: string[]): Promise<{
        success: boolean;
        message: string;
        total: number;
        successful: number;
        failed: number;
        statusChanged: number;
    }> => {
        const response = await adminAxios.post('/admin/orders/sync-status/batch', { orderIds });
        return response.data;
    },

    syncAllOrdersStatus: async (): Promise<{
        success: boolean;
        message: string;
        total: number;
        successful: number;
        failed: number;
        statusChanged: number;
    }> => {
        const response = await adminAxios.post('/admin/orders/sync-status/all');
        return response.data;
    },

    bookOnBehalf: async (data: any): Promise<{ success: boolean; message: string; order?: any }> => {
        const response = await adminAxios.post('/admin/orders/book-on-behalf', data);
        return response.data;
    }
};

export default adminOrderApi;
