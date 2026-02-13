import { adminAxios } from './adminAxios';
import { CustomerUser, UserSearchResponse } from '@/types/admin';

/**
 * API service for user admin operations in Next.js
 */
export const adminUserApi = {
    /**
     * Get detailed information about a specific user
     * @param userId - User ID
     * @returns User data
     */
    getUser: async (userId: string) => {
        const response = await adminAxios.get<{ success: boolean; user: CustomerUser }>(`/admin/users/${userId}`);
        return response.data;
    },

    /**
     * Update user information
     * @param userId - User ID
     * @param data - User data to update
     * @returns Updated user data
     */
    updateUser: async (userId: string, data: Partial<CustomerUser>) => {
        const response = await adminAxios.put<{ success: boolean; user: CustomerUser; message: string }>(`/admin/users/${userId}`, data);
        return response.data;
    },

    /**
     * Toggle user active/inactive status
     * @param userId - User ID
     * @param isActive - New status
     * @returns Updated user data
     */
    toggleStatus: async (userId: string, isActive: boolean) => {
        const response = await adminAxios.patch<{ success: boolean; user: CustomerUser; message: string }>(`/admin/users/${userId}/status`, { isActive });
        return response.data;
    },

    /**
     * Search users with filters
     * @param params - Search parameters
     * @returns Search results with pagination
     */
    searchUsers: async (params: {
        search?: string;
        status?: string;
        verified?: boolean;
        page?: number;
        limit?: number;
    }) => {
        const response = await adminAxios.get<UserSearchResponse>('/admin/users/search', { params });
        return response.data;
    }
};

export default adminUserApi;
