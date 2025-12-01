import { axiosInstance } from './axiosInstance.js';

/**
 * API service for user admin operations
 */
export const userAdminApi = {
  /**
   * Get detailed information about a specific user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User data
   */
  getUser: (userId) => {
    return axiosInstance.get(`/admin/users/${userId}`);
  },

  /**
   * Update user information
   * @param {string} userId - User ID
   * @param {Object} data - User data to update
   * @returns {Promise<Object>} Updated user data
   */
  updateUser: (userId, data) => {
    return axiosInstance.put(`/admin/users/${userId}`, data);
  },

  /**
   * Toggle user active/inactive status
   * @param {string} userId - User ID
   * @param {boolean} isActive - New status
   * @returns {Promise<Object>} Updated user data
   */
  toggleStatus: (userId, isActive) => {
    return axiosInstance.patch(`/admin/users/${userId}/status`, { isActive });
  },

  /**
   * Search users with filters
   * @param {Object} params - Search parameters
   * @param {string} params.search - Search term
   * @param {string} params.status - 'active' or 'inactive'
   * @param {boolean} params.verified - Verification status
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @returns {Promise<Object>} Search results with pagination
   */
  searchUsers: ({ search = '', status, verified, page = 1, limit = 20 }) => {
    const params = new URLSearchParams();
    
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    if (verified !== undefined) params.append('verified', verified);
    params.append('page', page);
    params.append('limit', limit);
    
    return axiosInstance.get(`/admin/users/search?${params.toString()}`);
  }
};

export default userAdminApi;
