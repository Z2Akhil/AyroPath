import Order from '../models/Order.js';
import AdminSession from '../models/AdminSession.js';
import axios from 'axios';

class OrderController {

  // Create a new order
  static async createOrder(req, res) {
    try {
      const {
        packageId,
        packageName,
        packagePrice,
        originalPrice,
        discountPercentage,
        discountAmount,
        beneficiaries,
        contactInfo,
        appointment,
        selectedSlot,
        reports
      } = req.body;

      // Validate required fields
      if (!packageId || !packageName || !packagePrice || !beneficiaries || !contactInfo || !appointment) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      // Get active admin session for API key
      const activeSession = await AdminSession.findOne({ isActive: true })
        .populate('adminId');

      if (!activeSession) {
        return res.status(500).json({
          success: false,
          message: 'No active admin session found'
        });
      }

      // Generate order ID
      const orderId = Order.generateOrderId();

      // Create order in our database first
      const order = new Order({
        orderId,
        userId: req.user._id,
        adminId: activeSession.adminId._id,
        package: {
          code: packageId,
          name: packageName,
          price: packagePrice,
          originalPrice: originalPrice,
          discountPercentage: discountPercentage,
          discountAmount: discountAmount
        },
        beneficiaries: beneficiaries.map(b => ({
          name: b.name,
          age: parseInt(b.age),
          gender: b.gender
        })),
        contactInfo: {
          email: contactInfo.email,
          mobile: contactInfo.mobile,
          address: {
            street: contactInfo.address.street,
            city: contactInfo.address.city,
            state: contactInfo.address.state,
            pincode: contactInfo.address.pincode,
            landmark: contactInfo.address.landmark || ''
          }
        },
        appointment: {
          date: appointment.date,
          slot: selectedSlot,
          slotId: appointment.slotId
        },
        reportsHardcopy: reports,
        payment: {
          amount: packagePrice,
          type: 'POSTPAID'
        },
        source: 'Ayropath'
      });
      console.log(order);

      await order.save();

      // Now create order in Thyrocare system
      try {
        const thyrocareResponse = await OrderController.createThyrocareOrder(order, activeSession);

        // Update order with Thyrocare response
        order.thyrocare.orderNo = thyrocareResponse.order_no;
        order.thyrocare.response = thyrocareResponse;

        // Update beneficiary lead IDs if available
        if (thyrocareResponse.ben_data && thyrocareResponse.ben_data.length > 0) {
          thyrocareResponse.ben_data.forEach((benData, index) => {
            if (order.beneficiaries[index]) {
              order.beneficiaries[index].leadId = benData.lead_id;
            }
          });
        }

        order.status = 'CREATED';
        await order.save();

        return res.status(201).json({
          success: true,
          message: 'Order created successfully',
          data: {
            orderId: order.orderId,
            thyrocareOrderNo: order.thyrocare.orderNo,
            order: order
          }
        });

      } catch (thyrocareError) {
        // Thyrocare order creation failed, but we still have our order record
        order.thyrocare.error = thyrocareError.message;
        order.status = 'FAILED';
        await order.save();

        return res.status(500).json({
          success: false,
          message: 'Order created in our system but failed in Thyrocare',
          data: {
            orderId: order.orderId,
            error: thyrocareError.message
          }
        });
      }

    } catch (error) {
      console.error('Error creating order:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create order',
        error: error.message
      });
    }
  }

  // Create order in Thyrocare system
  static async createThyrocareOrder(order, adminSession) {
    try {
      const payload = {
        api_key: adminSession.thyrocareApiKey,
        ref_order_id: order.orderId,
        email: order.contactInfo.email,
        mobile: order.contactInfo.mobile,
        address: `${order.contactInfo.address.street}, ${order.contactInfo.address.city}, ${order.contactInfo.address.state}`,
        appt_date: `${order.appointment.date} ${order.appointment.slot.split(' - ')[0]}`,
        order_by: order.beneficiaries[0]?.name || 'Customer',
        passon: order.package.discountAmount * order.beneficiaries.length,
        pay_type: 'POSTPAID',
        pincode: order.contactInfo.address.pincode,
        products: Array.isArray(order.package.code) ? order.package.code.join(',') : order.package.code,
        ref_code: adminSession.adminId.mobile,
        reports: order.reportsHardcopy,
        service_type: 'HOME',
        ben_data: order.beneficiaries.map(beneficiary => ({
          name: beneficiary.name,
          age: beneficiary.age,
          gender: beneficiary.gender === 'Male' ? 'M' : beneficiary.gender === 'Female' ? 'F' : 'O'
        })),
        coupon: '',
        order_mode: 'DSA-BOOKING-API',
        collection_type: 'Home Collection',
        source: 'Ayropath',
        phlebo_notes: ''
      };

      console.log('Creating Thyrocare order with payload:', {
        orderId: order.orderId,
        package: order.package.code,
        beneficiaries: order.beneficiaries.length
      });
      console.log(payload);

      const response = await axios.post(
        'https://dx-dsa-service.thyrocare.com/api/booking-master/v2/create-order',
        payload,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      if (response.data.response_status === 1) {
        console.log('Thyrocare order created successfully:', {
          orderId: order.orderId,
          thyrocareOrderNo: response.data.order_no
        });
        return response.data;
      } else {
        throw new Error(response.data.response || 'Thyrocare order creation failed');
      }

    } catch (error) {
      console.error('Thyrocare order creation failed:', {
        orderId: order.orderId,
        error: error.response?.data || error.message
      });
      throw new Error(error.response?.data?.response || error.message || 'Thyrocare API error');
    }
  }

  // Get user orders
  static async getUserOrders(req, res) {
    try {
      const orders = await Order.findByUser(req.user._id);

      // Auto-refresh Thyrocare status for orders that need it
      // Only refresh orders that haven't been synced in the last 1 hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const ordersToRefresh = orders.filter(order =>
        order.thyrocare?.orderNo &&
        (!order.thyrocare.lastSyncedAt || order.thyrocare.lastSyncedAt < oneHourAgo)
      );

      if (ordersToRefresh.length > 0) {
        console.log(`🔄 Auto-refreshing Thyrocare status for ${ordersToRefresh.length} user orders`);

        // Import OrderStatusSyncService
        const OrderStatusSyncService = (await import('../services/OrderStatusSyncService.js')).default;

        // Refresh each order (but don't wait for all to complete before responding)
        // We'll refresh in background to avoid delaying the response
        ordersToRefresh.forEach(async (order) => {
          try {
            await OrderStatusSyncService.syncOrderStatus(order._id);
          } catch (syncError) {
            console.error(`Failed to auto-refresh order ${order.orderId}:`, syncError);
            // Don't throw - we don't want to fail the whole request
          }
        });
      }

      // Return orders immediately (they'll be updated in background)
      // Note: The returned orders will have old status, but they'll be fresh on next load
      // Alternatively, we could wait for refreshes, but that would slow down the response

      return res.json({
        success: true,
        data: orders,
        metadata: {
          totalOrders: orders.length,
          autoRefreshed: ordersToRefresh.length,
          note: 'Order status is being refreshed in background. Refresh page to see updated status.'
        }
      });
    } catch (error) {
      console.error('Error fetching user orders:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch orders',
        error: error.message
      });
    }
  }

  // Get order by ID
  static async getOrderById(req, res) {
    try {
      const { orderId } = req.params;

      const order = await Order.findOne({ orderId })
        .populate('userId adminId');

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Check if user has permission to view this order
      if (order.userId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      return res.json({
        success: true,
        data: order
      });
    } catch (error) {
      console.error('Error fetching order:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch order',
        error: error.message
      });
    }
  }

  // Retry failed order
  static async retryOrder(req, res) {
    try {
      const { orderId } = req.params;

      const order = await Order.findOne({ orderId })
        .populate('adminId');

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Check permissions
      if (order.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Get active admin session
      const activeSession = await AdminSession.findOne({ isActive: true })
        .populate('adminId');

      if (!activeSession) {
        return res.status(500).json({
          success: false,
          message: 'No active admin session found'
        });
      }

      // Retry Thyrocare order creation
      try {
        const thyrocareResponse = await OrderController.createThyrocareOrder(order, activeSession);

        order.thyrocare.orderNo = thyrocareResponse.order_no;
        order.thyrocare.response = thyrocareResponse;
        order.thyrocare.error = null;
        order.thyrocare.retryCount += 1;
        order.thyrocare.lastRetryAt = new Date();
        order.status = 'CREATED';

        await order.save();

        return res.json({
          success: true,
          message: 'Order retried successfully',
          data: {
            orderId: order.orderId,
            thyrocareOrderNo: order.thyrocare.orderNo
          }
        });

      } catch (thyrocareError) {
        order.thyrocare.error = thyrocareError.message;
        order.thyrocare.retryCount += 1;
        order.thyrocare.lastRetryAt = new Date();
        await order.save();

        return res.status(500).json({
          success: false,
          message: 'Order retry failed',
          error: thyrocareError.message
        });
      }

    } catch (error) {
      console.error('Error retrying order:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retry order',
        error: error.message
      });
    }
  }

  // Download report for order
  static async downloadReport(req, res) {
    try {
      const { orderId } = req.params;
      const { beneficiaryIndex = 0 } = req.query;

      const order = await Order.findOne({ orderId });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Check permissions
      if (order.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Check if order is DONE/COMPLETED
      if (order.thyrocare?.status !== 'DONE' && order.status !== 'COMPLETED') {
        return res.status(400).json({
          success: false,
          message: 'Reports are only available for completed orders'
        });
      }

      // Check if reports exist
      if (!order.reports || order.reports.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No reports available for this order'
        });
      }

      // Get the specific report (default to first one)
      const reportIndex = parseInt(beneficiaryIndex);
      if (reportIndex < 0 || reportIndex >= order.reports.length) {
        return res.status(400).json({
          success: false,
          message: `Invalid beneficiary index. Valid range: 0-${order.reports.length - 1}`
        });
      }

      const report = order.reports[reportIndex];

      // Check if report URL exists
      if (!report.reportUrl) {
        return res.status(404).json({
          success: false,
          message: 'Report URL not available'
        });
      }

      // Mark report as downloaded
      await order.markReportDownloaded(report.leadId);

      // Redirect to the report URL (Thyrocare report URL)
      return res.json({
        success: true,
        message: 'Report download initiated',
        data: {
          orderId: order.orderId,
          beneficiaryName: report.beneficiaryName,
          reportUrl: report.reportUrl,
          downloadUrl: report.reportUrl, // Direct URL for frontend to use
          instructions: 'Click the download button to open the report in a new tab'
        }
      });

    } catch (error) {
      console.error('Error downloading report:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to download report',
        error: error.message
      });
    }
  }

  // Book on behalf of user (Admin initiated)
  static async bookOnBehalf(req, res) {
    try {
      const {
        userId,
        packageIds, // Changed from packageId
        packageNames, // Array of names
        packagePrices, // Array of prices
        beneficiaries,
        contactInfo,
        appointment,
        selectedSlot,
        reports,
        totalDiscount, // Passon from checkout pricing (with margin capping)
        collectionCharge,
        grandTotal
      } = req.body;

      // Validate required fields
      if (!userId || !packageIds || !packageNames || !packagePrices || !beneficiaries || !contactInfo || !appointment) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      // Get active admin session for API key
      const AdminSession = (await import('../models/AdminSession.js')).default;
      const activeSession = await AdminSession.findOne({ isActive: true })
        .populate('adminId');

      if (!activeSession) {
        return res.status(500).json({
          success: false,
          message: 'No active admin session found'
        });
      }

      // Calculate totals - use thyrocareRate for originalPrice
      const totalOriginalPrice = packagePrices.reduce((sum, p) => sum + (p.thyrocareRate || p.originalPrice || p.price || 0), 0);
      const totalSellingPrice = packagePrices.reduce((sum, p) => sum + (p.sellingPrice || p.price || 0), 0);

      // Use passed totalDiscount (from checkout pricing with margin capping) or calculate fallback
      const calculatedDiscount = totalDiscount !== undefined && totalDiscount !== null
        ? totalDiscount
        : (totalOriginalPrice - totalSellingPrice) * beneficiaries.length;

      const totalDiscountPercentage = totalOriginalPrice > 0 ? Math.round((calculatedDiscount / (totalOriginalPrice * beneficiaries.length)) * 100) : 0;
      const combinedName = packageNames.join(' + ');

      // Generate order ID
      const orderId = Order.generateOrderId();

      // Create order in our database
      const order = new Order({
        orderId,
        userId: userId,
        adminId: req.admin._id, // Use the current admin's ID
        package: {
          code: packageIds, // Now an array
          name: combinedName,
          price: totalSellingPrice,
          originalPrice: totalOriginalPrice,
          discountPercentage: totalDiscountPercentage,
          discountAmount: calculatedDiscount
        },
        beneficiaries: beneficiaries.map(b => ({
          name: b.name,
          age: parseInt(b.age),
          gender: b.gender
        })),
        contactInfo: {
          email: contactInfo.email,
          mobile: contactInfo.mobile,
          address: {
            street: contactInfo.address.street,
            city: contactInfo.address.city,
            state: contactInfo.address.state,
            pincode: contactInfo.address.pincode,
            landmark: contactInfo.address.landmark || ''
          }
        },
        appointment: {
          date: appointment.date,
          slot: selectedSlot,
          slotId: appointment.slotId
        },
        reportsHardcopy: reports || 'N',
        payment: {
          amount: totalSellingPrice,
          type: 'POSTPAID'
        },
        source: 'Ayropath (Admin)'
      });

      await order.save();

      // Create order in Thyrocare system
      try {
        const thyrocareResponse = await OrderController.createThyrocareOrder(order, activeSession);

        // Update order with Thyrocare response
        order.thyrocare.orderNo = thyrocareResponse.order_no;
        order.thyrocare.response = thyrocareResponse;

        // Update beneficiary lead IDs
        if (thyrocareResponse.ben_data && thyrocareResponse.ben_data.length > 0) {
          thyrocareResponse.ben_data.forEach((benData, index) => {
            if (order.beneficiaries[index]) {
              order.beneficiaries[index].leadId = benData.lead_id;
            }
          });
        }

        order.status = 'CREATED';
        await order.save();

        return res.status(201).json({
          success: true,
          message: 'Order created successfully on behalf of user',
          data: {
            orderId: order.orderId,
            thyrocareOrderNo: order.thyrocare.orderNo,
            order: order
          }
        });

      } catch (thyrocareError) {
        order.thyrocare.error = thyrocareError.message;
        order.status = 'FAILED';
        await order.save();

        return res.status(500).json({
          success: false,
          message: 'Order created in our system but failed in Thyrocare',
          data: {
            orderId: order.orderId,
            error: thyrocareError.message
          }
        });
      }

    } catch (error) {
      console.error('Error booking on behalf:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to book on behalf',
        error: error.message
      });
    }
  }
}

export default OrderController;
