import axios from 'axios';
import Order from '../models/Order.js';
import ThyrocareRefreshService from './thyrocareRefreshService.js';
import { thyrocareCircuitBreaker } from '../utils/circuitBreaker.js';
import { thyrocareRequestQueue } from '../utils/requestQueue.js';

/**
 * Service for syncing order status from Thyrocare API
 */
class OrderStatusSyncService {

  /**
   * Get Thyrocare API base URL from environment
   */
  static getThyrocareApiUrl() {
    return process.env.THYROCARE_API_URL || 'https://velso.thyrocare.cloud';
  }

  /**
   * Fetch order status from Thyrocare API for a single order
   * @param {string} orderNumber - Thyrocare order number
   * @param {string} apiKey - Thyrocare API key
   * @returns {Promise<Object>} Thyrocare response
   */
  static async fetchOrderStatusFromThyrocare(orderNumber, apiKey) {
    const thyrocareApiUrl = this.getThyrocareApiUrl();

    // Wrapper for the single API call, moved inside to allow retry with new key
    const executeApiCall = async (currentApiKey) => {
      console.log(`🔄 Fetching Thyrocare status for order: ${orderNumber}`);

      const response = await axios.post(
        `${thyrocareApiUrl}/api/OrderSummary/OrderSummary`,
        {
          OrderNo: orderNumber,
          ApiKey: currentApiKey
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      console.log(`✅ Thyrocare API response for ${orderNumber}:`, {
        status: response.status,
        response: response.data.response,
        hasOrderMaster: !!response.data.orderMaster,
        orderMasterCount: response.data.orderMaster?.length || 0
      });

      return response.data;
    };

    // Wrapper for the circuit breaker execution
    const runCircuitBreaker = async (keyToUse) => {
      return await thyrocareRequestQueue.enqueue(async () => {
        return await thyrocareCircuitBreaker.execute(() => executeApiCall(keyToUse));
      }, {
        priority: 'normal',
        metadata: { type: 'order_status_check', orderNumber }
      });
    };

    try {
      // First attempt
      let data = await runCircuitBreaker(apiKey);

      // Check for Invalid Api Key response
      // Based on user logs: { status: 200, response: 'Invalid Api Key', ... }
      const isAuthError = (data?.response || '').toString().toLowerCase().includes('invalid api key') ||
        (data?.message || '').toString().toLowerCase().includes('invalid api key');

      if (isAuthError) {
        console.log(`🔄 User reported "Invalid Api Key" for order ${orderNumber}. Refreshing session and retrying...`);

        // Force refresh API keys
        const session = await ThyrocareRefreshService.refreshApiKeys();

        // Retry with new API key
        if (session && session.thyrocareApiKey) {
          console.log(`🔁 Retrying order ${orderNumber} with new API Key...`);
          data = await runCircuitBreaker(session.thyrocareApiKey);
        } else {
          throw new Error('Failed to obtain new API Key after refresh');
        }
      }

      return data;
    } catch (error) {
      console.error(`❌ Failed to fetch Thyrocare status for ${orderNumber}:`, error);
      throw error;
    }
  }

  /**
   * Sync status for a single order
   * @param {string} orderId - Our system order ID
   * @returns {Promise<Object>} Sync result
   */
  static async syncOrderStatus(orderId) {
    try {
      console.log(`🔄 Syncing status for order: ${orderId}`);

      // Get the order
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error(`Order not found: ${orderId}`);
      }

      // Check if order has Thyrocare order number
      if (!order.thyrocare?.orderNo) {
        console.log(`⚠️ Order ${orderId} has no Thyrocare order number, skipping`);
        return {
          orderId,
          success: false,
          message: 'No Thyrocare order number',
          statusChanged: false
        };
      }

      // Get API key
      const apiKey = await ThyrocareRefreshService.getOrRefreshApiKey();

      // Fetch status from Thyrocare
      const thyrocareResponse = await this.fetchOrderStatusFromThyrocare(
        order.thyrocare.orderNo,
        apiKey
      );

      // Store full response
      order.thyrocare.response = thyrocareResponse;

      // Extract status from response based on actual API response structure
      let newStatus = order.thyrocare.status;
      let statusChanged = false;
      let reportUrls = [];

      if (thyrocareResponse.response === 'Success') {
        // Check for orderMaster array in response (based on user's example)
        if (thyrocareResponse.orderMaster && thyrocareResponse.orderMaster.length > 0) {
          // Get status from first order in orderMaster array
          const thyrocareStatus = thyrocareResponse.orderMaster[0].status;

          if (thyrocareStatus && thyrocareStatus !== order.thyrocare.status) {
            newStatus = thyrocareStatus.toUpperCase();
            statusChanged = true;

            // Update order status
            await order.updateThyrocareStatus(newStatus, 'Synced from Thyrocare API');

            console.log(`✅ Order ${orderId} status updated: ${order.thyrocare.status} → ${newStatus}`);
          }

          // Extract report URLs from benMaster if available
          if (thyrocareResponse.benMaster && thyrocareResponse.benMaster.length > 0) {
            reportUrls = thyrocareResponse.benMaster.map(ben => ({
              beneficiaryName: ben.name,
              leadId: ben.id,
              reportUrl: ben.url,
              status: ben.status
            }));

            console.log(`📄 Found ${reportUrls.length} report URLs for order ${orderId}`);
          }
        }
        // Fallback to data field if orderMaster not present
        else if (thyrocareResponse.data) {
          const thyrocareStatus = thyrocareResponse.data.status ||
            thyrocareResponse.data.OrderStatus ||
            thyrocareResponse.data.currentStatus;

          if (thyrocareStatus && thyrocareStatus !== order.thyrocare.status) {
            newStatus = thyrocareStatus.toUpperCase();
            statusChanged = true;

            // Update order status
            await order.updateThyrocareStatus(newStatus, 'Synced from Thyrocare API');

            console.log(`✅ Order ${orderId} status updated: ${order.thyrocare.status} → ${newStatus}`);
          }
        }
      }

      // Save report URLs if any were found
      if (reportUrls.length > 0) {
        for (const report of reportUrls) {
          if (report.reportUrl) {
            await order.addReport(report.beneficiaryName, report.leadId, report.reportUrl);
          }
        }
        console.log(`💾 Saved ${reportUrls.length} report URLs for order ${orderId}`);
      }

      // Update last synced timestamp
      order.thyrocare.lastSyncedAt = new Date();

      // Save the order with updated response and timestamp
      await order.save();

      return {
        orderId,
        orderNumber: order.thyrocare.orderNo,
        success: true,
        statusChanged,
        oldStatus: order.thyrocare.status,
        newStatus: newStatus,
        message: statusChanged ? 'Status updated' : 'Status unchanged'
      };

    } catch (error) {
      console.error(`❌ Failed to sync order ${orderId}:`, error);

      // Update error in order record
      try {
        const order = await Order.findById(orderId);
        if (order) {
          order.thyrocare.error = error.message;
          await order.save();
        }
      } catch (saveError) {
        console.error('Failed to save error to order:', saveError);
      }

      return {
        orderId,
        success: false,
        message: error.message,
        statusChanged: false
      };
    }
  }

  /**
   * Sync status for multiple orders
   * @param {Array<string>} orderIds - Array of order IDs
   * @returns {Promise<Array>} Array of sync results
   */
  static async syncOrdersStatus(orderIds) {
    console.log(`🔄 Syncing status for ${orderIds.length} orders`);

    const results = [];
    const batchSize = 10; // Process 10 orders at a time to avoid overwhelming API

    for (let i = 0; i < orderIds.length; i += batchSize) {
      const batch = orderIds.slice(i, i + batchSize);
      const batchPromises = batch.map(orderId => this.syncOrderStatus(orderId));

      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            orderId: batch[index],
            success: false,
            message: result.reason?.message || 'Unknown error',
            statusChanged: false
          });
        }
      });

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < orderIds.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Calculate summary
    const successful = results.filter(r => r.success).length;
    const statusChanged = results.filter(r => r.statusChanged).length;

    console.log(`✅ Sync completed: ${successful}/${results.length} successful, ${statusChanged} status changes`);

    return {
      total: results.length,
      successful,
      failed: results.length - successful,
      statusChanged,
      results
    };
  }

  /**
   * Sync status for all orders with Thyrocare order numbers
   * @returns {Promise<Object>} Sync summary
   */
  static async syncAllOrdersStatus() {
    console.log('🔄 Starting sync for all orders with Thyrocare order numbers');

    // Find all orders that have Thyrocare order numbers
    const orders = await Order.find({
      'thyrocare.orderNo': { $exists: true, $ne: null }
    }).select('_id thyrocare.orderNo thyrocare.status');

    const orderIds = orders.map(order => order._id);

    console.log(`📊 Found ${orderIds.length} orders with Thyrocare order numbers`);

    if (orderIds.length === 0) {
      return {
        total: 0,
        successful: 0,
        failed: 0,
        statusChanged: 0,
        message: 'No orders with Thyrocare order numbers found'
      };
    }

    return await this.syncOrdersStatus(orderIds);
  }

  /**
   * Get orders that haven't been synced recently (e.g., in last 24 hours)
   * @param {number} hours - Hours threshold (default 24)
   * @returns {Promise<Array>} Array of order IDs needing sync
   */
  static async getOrdersNeedingSync(hours = 24) {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    const orders = await Order.find({
      'thyrocare.orderNo': { $exists: true, $ne: null },
      $or: [
        { 'thyrocare.lastSyncedAt': { $exists: false } },
        { 'thyrocare.lastSyncedAt': { $lt: cutoffTime } }
      ]
    }).select('_id thyrocare.orderNo thyrocare.status thyrocare.lastSyncedAt');

    return orders.map(order => order._id);
  }

  /**
   * Run daily sync job
   */
  static async runDailySync() {
    console.log('⏰ Starting daily order status sync job');
    const startTime = Date.now();

    try {
      const result = await this.syncAllOrdersStatus();
      const duration = Date.now() - startTime;

      console.log(`✅ Daily sync completed in ${duration}ms:`, {
        total: result.total,
        successful: result.successful,
        failed: result.failed,
        statusChanged: result.statusChanged
      });

      return {
        ...result,
        duration,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Daily sync job failed:', error);
      const duration = Date.now() - startTime;

      return {
        success: false,
        message: error.message,
        duration,
        timestamp: new Date().toISOString(),
        total: 0,
        successful: 0,
        failed: 0,
        statusChanged: 0
      };
    }
  }
}

export default OrderStatusSyncService;
