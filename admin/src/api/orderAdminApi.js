import { axiosInstance } from './axiosInstance.js';

/**
 * API service for order admin operations
 */
export const orderAdminApi = {
  /**
   * Get orders with pagination and filters
   * @param {Object} params - Filter parameters
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @param {string} params.status - Order status filter
   * @param {string} params.thyrocareStatus - Thyrocare status filter
   * @param {string} params.startDate - Start date filter (YYYY-MM-DD)
   * @param {string} params.endDate - End date filter (YYYY-MM-DD)
   * @param {string} params.search - Search term
   * @returns {Promise<Object>} Orders with pagination
   */
  getOrders: ({ 
    page = 1, 
    limit = 20, 
    status, 
    thyrocareStatus, 
    startDate, 
    endDate, 
    search 
  } = {}) => {
    const params = new URLSearchParams();
    
    params.append('page', page);
    params.append('limit', limit);
    if (status) params.append('status', status);
    if (thyrocareStatus) params.append('thyrocareStatus', thyrocareStatus);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (search) params.append('search', search);
    
    return axiosInstance.get(`/admin/orders?${params.toString()}`);
  },

  /**
   * Get order statistics
   * @returns {Promise<Object>} Order statistics
   */
  getOrderStats: () => {
    return axiosInstance.get('/admin/orders/stats');
  },

  /**
   * Get detailed information about a specific order
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} Order data
   */
  getOrder: (orderId) => {
    return axiosInstance.get(`/admin/orders/${orderId}`);
  },

  /**
   * Update order information
   * @param {string} orderId - Order ID
   * @param {Object} data - Order data to update
   * @returns {Promise<Object>} Updated order data
   */
  updateOrder: (orderId, data) => {
    return axiosInstance.put(`/admin/orders/${orderId}`, data);
  },

  /**
   * Retry a failed order
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} Retry result
   */
  retryOrder: (orderId) => {
    return axiosInstance.post(`/orders/${orderId}/retry`);
  },

  /**
   * Sync Thyrocare status for specific orders
   * @param {Array<string>} orderIds - Array of order IDs to sync
   * @returns {Promise<Object>} Sync result
   */
  syncOrdersStatus: (orderIds) => {
    return axiosInstance.post('/admin/orders/sync-status/batch', { orderIds });
  },

  /**
   * Sync Thyrocare status for all orders
   * @returns {Promise<Object>} Sync result
   */
  syncAllOrdersStatus: () => {
    return axiosInstance.post('/admin/orders/sync-status/all');
  },

  /**
   * Sync Thyrocare status for a single order
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} Sync result
   */
  syncOrderStatus: (orderId) => {
    return axiosInstance.post(`/admin/orders/${orderId}/sync-status`);
  }
};

export default orderAdminApi;
