import express from 'express';
import adminAuth from '../../../middleware/adminAuth.js';
import AdminActivity from '../../../models/AdminActivity.js';
import Order from '../../../models/Order.js';
import OrderStatusSyncService from '../../../services/OrderStatusSyncService.js';
import OrderController from '../../../controllers/orderController.js';

const router = express.Router();

// Order Management Routes
router.get('/orders', adminAuth, async (req, res) => {
  const startTime = Date.now();
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.get('User-Agent') || '';

  try {
    const {
      page = 1,
      limit = 20,
      status,
      thyrocareStatus,
      startDate,
      endDate,
      search
    } = req.query;

    console.log('Fetching orders for admin:', req.admin.name, {
      page, limit, status, thyrocareStatus, startDate, endDate, search
    });

    // Build query
    const query = {};

    // Handle categorized status filter
    if (status) {
      if (status === 'COMPLETED') {
        // COMPLETED category: system status COMPLETED OR thyrocare status DONE
        query.$or = [
          { status: 'COMPLETED' },
          { 'thyrocare.status': 'DONE' }
        ];
      } else if (status === 'FAILED') {
        // FAILED category: system status FAILED OR thyrocare status FAILED
        query.$or = [
          { status: 'FAILED' },
          { 'thyrocare.status': 'FAILED' }
        ];
      } else if (status === 'PENDING') {
        // PENDING category: everything else
        query.$and = [
          { status: { $nin: ['COMPLETED', 'FAILED'] } },
          { 'thyrocare.status': { $nin: ['DONE', 'FAILED'] } }
        ];
      } else {
        // Regular status filter (for backward compatibility)
        query.status = status;
      }
    }

    if (thyrocareStatus) {
      query['thyrocare.status'] = thyrocareStatus;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { 'contactInfo.email': { $regex: search, $options: 'i' } },
        { 'contactInfo.mobile': { $regex: search, $options: 'i' } },
        { 'package.name': { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch orders with pagination
    const orders = await Order.find(query)
      .populate('userId', 'firstName lastName email mobileNumber')
      .populate('adminId', 'name email mobile')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalOrders = await Order.countDocuments(query);

    await AdminActivity.logActivity({
      adminId: req.admin._id,
      sessionId: req.adminSession._id,
      action: 'ORDERS_FETCH',
      description: `Admin ${req.admin.name} fetched orders`,
      resource: 'orders',
      endpoint: '/api/admin/orders',
      method: 'GET',
      ipAddress: ipAddress,
      userAgent: userAgent,
      statusCode: 200,
      responseTime: Date.now() - startTime,
      metadata: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalOrders,
        filters: { status, thyrocareStatus, startDate, endDate, search }
      }
    });

    res.json({
      success: true,
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalOrders / parseInt(limit)),
        totalOrders,
        hasNextPage: skip + orders.length < totalOrders,
        hasPrevPage: parseInt(page) > 1
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('Orders fetch error:', error);

    await AdminActivity.logActivity({
      adminId: req.admin._id,
      sessionId: req.adminSession._id,
      action: 'ERROR',
      description: `Failed to fetch orders: ${error.message}`,
      resource: 'orders',
      endpoint: '/api/admin/orders',
      method: 'GET',
      ipAddress: ipAddress,
      userAgent: userAgent,
      statusCode: 500,
      responseTime: responseTime,
      errorMessage: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders'
    });
  }
});

router.get('/orders/stats', adminAuth, async (req, res) => {
  const startTime = Date.now();
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.get('User-Agent') || '';

  try {
    console.log('Fetching order stats for admin:', req.admin.name);

    // Get counts by status
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'PENDING' });
    const createdOrders = await Order.countDocuments({ status: 'CREATED' });
    const failedOrders = await Order.countDocuments({ status: 'FAILED' });
    const completedOrders = await Order.countDocuments({ status: 'COMPLETED' });
    const cancelledOrders = await Order.countDocuments({ status: 'CANCELLED' });

    // Get categorized stats
    const categorizedStats = await Order.getCategorizedStats();

    // Get counts by Thyrocare status
    const thyrocareStatusCounts = {
      YET_TO_ASSIGN: await Order.countDocuments({ 'thyrocare.status': 'YET TO ASSIGN' }),
      ASSIGNED: await Order.countDocuments({ 'thyrocare.status': 'ASSIGNED' }),
      ACCEPTED: await Order.countDocuments({ 'thyrocare.status': 'ACCEPTED' }),
      SERVICED: await Order.countDocuments({ 'thyrocare.status': 'SERVICED' }),
      DONE: await Order.countDocuments({ 'thyrocare.status': 'DONE' }),
      FAILED: await Order.countDocuments({ 'thyrocare.status': 'FAILED' })
    };

    // Get today's orders
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysOrders = await Order.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow }
    });

    // Get this week's orders
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
    const thisWeeksOrders = await Order.countDocuments({
      createdAt: { $gte: weekStart }
    });

    // Get this month's orders
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const thisMonthsOrders = await Order.countDocuments({
      createdAt: { $gte: monthStart }
    });

    await AdminActivity.logActivity({
      adminId: req.admin._id,
      sessionId: req.adminSession._id,
      action: 'ORDER_STATS_FETCH',
      description: `Admin ${req.admin.name} fetched order statistics`,
      resource: 'orders',
      endpoint: '/api/admin/orders/stats',
      method: 'GET',
      ipAddress: ipAddress,
      userAgent: userAgent,
      statusCode: 200,
      responseTime: Date.now() - startTime,
      metadata: {
        totalOrders,
        todaysOrders,
        thisWeeksOrders,
        thisMonthsOrders
      }
    });

    res.json({
      success: true,
      stats: {
        totalOrders,
        byStatus: {
          PENDING: pendingOrders,
          CREATED: createdOrders,
          FAILED: failedOrders,
          COMPLETED: completedOrders,
          CANCELLED: cancelledOrders
        },
        byCategorizedStatus: categorizedStats,
        byThyrocareStatus: thyrocareStatusCounts,
        todaysOrders,
        thisWeeksOrders,
        thisMonthsOrders
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('Order stats fetch error:', error);

    await AdminActivity.logActivity({
      adminId: req.admin._id,
      sessionId: req.adminSession._id,
      action: 'ERROR',
      description: `Failed to fetch order statistics: ${error.message}`,
      resource: 'orders',
      endpoint: '/api/admin/orders/stats',
      method: 'GET',
      ipAddress: ipAddress,
      userAgent: userAgent,
      statusCode: 500,
      responseTime: responseTime,
      errorMessage: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch order statistics'
    });
  }
});

router.get('/orders/:orderId', adminAuth, async (req, res) => {
  const startTime = Date.now();
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.get('User-Agent') || '';

  try {
    const { orderId } = req.params;

    console.log('Fetching order details for admin:', req.admin.name, { orderId });

    const order = await Order.findOne({ orderId })
      .populate('userId', 'firstName lastName email mobileNumber')
      .populate('adminId', 'name email mobile');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    await AdminActivity.logActivity({
      adminId: req.admin._id,
      sessionId: req.adminSession._id,
      action: 'ORDER_DETAILS_FETCH',
      description: `Admin ${req.admin.name} fetched order details for ${orderId}`,
      resource: 'orders',
      endpoint: '/api/admin/orders/:orderId',
      method: 'GET',
      ipAddress: ipAddress,
      userAgent: userAgent,
      statusCode: 200,
      responseTime: Date.now() - startTime,
      metadata: {
        orderId,
        orderStatus: order.status,
        thyrocareStatus: order.thyrocare.status
      }
    });

    res.json({
      success: true,
      order
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('Order details fetch error:', error);

    await AdminActivity.logActivity({
      adminId: req.admin._id,
      sessionId: req.adminSession._id,
      action: 'ERROR',
      description: `Failed to fetch order details: ${error.message}`,
      resource: 'orders',
      endpoint: '/api/admin/orders/:orderId',
      method: 'GET',
      ipAddress: ipAddress,
      userAgent: userAgent,
      statusCode: 500,
      responseTime: responseTime,
      errorMessage: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch order details'
    });
  }
});

router.put('/orders/:orderId', adminAuth, async (req, res) => {
  const startTime = Date.now();
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.get('User-Agent') || '';

  try {
    const { orderId } = req.params;
    const updates = req.body;

    console.log('Updating order for admin:', req.admin.name, { orderId, updates });

    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Update allowed fields
    const allowedUpdates = ['status', 'notes', 'thyrocare.status'];
    const updateData = {};

    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        if (field === 'thyrocare.status') {
          order.thyrocare.status = updates[field];
          order.thyrocare.statusHistory.push({
            status: updates[field],
            timestamp: new Date(),
            notes: updates.notes || 'Updated by admin'
          });
        } else {
          updateData[field] = updates[field];
        }
      }
    });

    // Apply updates
    Object.keys(updateData).forEach(key => {
      order[key] = updateData[key];
    });

    await order.save();

    await AdminActivity.logActivity({
      adminId: req.admin._id,
      sessionId: req.adminSession._id,
      action: 'ORDER_UPDATE',
      description: `Admin ${req.admin.name} updated order ${orderId}`,
      resource: 'orders',
      endpoint: '/api/admin/orders/:orderId',
      method: 'PUT',
      ipAddress: ipAddress,
      userAgent: userAgent,
      statusCode: 200,
      responseTime: Date.now() - startTime,
      metadata: {
        orderId,
        updates: Object.keys(updates)
      }
    });

    res.json({
      success: true,
      message: 'Order updated successfully',
      order
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('Order update error:', error);

    await AdminActivity.logActivity({
      adminId: req.admin._id,
      sessionId: req.adminSession._id,
      action: 'ERROR',
      description: `Failed to update order: ${error.message}`,
      resource: 'orders',
      endpoint: '/api/admin/orders/:orderId',
      method: 'PUT',
      ipAddress: ipAddress,
      userAgent: userAgent,
      statusCode: 500,
      responseTime: responseTime,
      errorMessage: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to update order'
    });
  }
});

// Order Status Sync Endpoints

// Sync status for all orders
router.post('/orders/sync-status/all', adminAuth, async (req, res) => {
  const startTime = Date.now();
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.get('User-Agent') || '';

  try {
    console.log('Admin requested sync for all orders:', req.admin.name);

    const result = await OrderStatusSyncService.syncAllOrdersStatus();

    await AdminActivity.logActivity({
      adminId: req.admin._id,
      sessionId: req.adminSession._id,
      action: 'ORDER_STATUS_SYNC',
      description: `Admin ${req.admin.name} synced status for all orders`,
      resource: 'orders',
      endpoint: '/api/admin/orders/sync-status/all',
      method: 'POST',
      ipAddress: ipAddress,
      userAgent: userAgent,
      statusCode: 200,
      responseTime: Date.now() - startTime,
      metadata: {
        total: result.total,
        successful: result.successful,
        failed: result.failed,
        statusChanged: result.statusChanged
      }
    });

    res.json({
      success: true,
      message: 'Order status sync completed',
      ...result
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('Order status sync error:', error);

    await AdminActivity.logActivity({
      adminId: req.admin._id,
      sessionId: req.adminSession._id,
      action: 'ERROR',
      description: `Failed to sync order status: ${error.message}`,
      resource: 'orders',
      endpoint: '/api/admin/orders/sync-status/all',
      method: 'POST',
      ipAddress: ipAddress,
      userAgent: userAgent,
      statusCode: 500,
      responseTime: responseTime,
      errorMessage: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to sync order status'
    });
  }
});

// Sync status for specific orders
router.post('/orders/sync-status/batch', adminAuth, async (req, res) => {
  const startTime = Date.now();
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.get('User-Agent') || '';

  try {
    const { orderIds } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'orderIds array is required'
      });
    }

    console.log('Admin requested sync for specific orders:', {
      admin: req.admin.name,
      orderCount: orderIds.length
    });

    const result = await OrderStatusSyncService.syncOrdersStatus(orderIds);

    await AdminActivity.logActivity({
      adminId: req.admin._id,
      sessionId: req.adminSession._id,
      action: 'ORDER_STATUS_SYNC',
      description: `Admin ${req.admin.name} synced status for ${orderIds.length} orders`,
      resource: 'orders',
      endpoint: '/api/admin/orders/sync-status/batch',
      method: 'POST',
      ipAddress: ipAddress,
      userAgent: userAgent,
      statusCode: 200,
      responseTime: Date.now() - startTime,
      metadata: {
        total: result.total,
        successful: result.successful,
        failed: result.failed,
        statusChanged: result.statusChanged
      }
    });

    res.json({
      success: true,
      message: 'Order status sync completed',
      ...result
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('Order status sync error:', error);

    await AdminActivity.logActivity({
      adminId: req.admin._id,
      sessionId: req.adminSession._id,
      action: 'ERROR',
      description: `Failed to sync order status: ${error.message}`,
      resource: 'orders',
      endpoint: '/api/admin/orders/sync-status/batch',
      method: 'POST',
      ipAddress: ipAddress,
      userAgent: userAgent,
      statusCode: 500,
      responseTime: responseTime,
      errorMessage: error.message,
      metadata: {
        orderCount: orderIds.length
      }
    });

    res.status(500).json({
      success: false,
      error: 'Failed to sync order status'
    });
  }
});

// Sync status for single order
router.post('/orders/:orderId/sync-status', adminAuth, async (req, res) => {
  const startTime = Date.now();
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.get('User-Agent') || '';

  try {
    const { orderId } = req.params;

    console.log('Admin requested sync for single order:', {
      admin: req.admin.name,
      orderId
    });

    const result = await OrderStatusSyncService.syncOrderStatus(orderId);

    await AdminActivity.logActivity({
      adminId: req.admin._id,
      sessionId: req.adminSession._id,
      action: 'ORDER_STATUS_SYNC',
      description: `Admin ${req.admin.name} synced status for order ${orderId}`,
      resource: 'orders',
      endpoint: '/api/admin/orders/:orderId/sync-status',
      method: 'POST',
      ipAddress: ipAddress,
      userAgent: userAgent,
      statusCode: 200,
      responseTime: Date.now() - startTime,
      metadata: {
        orderId,
        success: result.success,
        statusChanged: result.statusChanged,
        oldStatus: result.oldStatus,
        newStatus: result.newStatus
      }
    });

    res.json({
      success: true,
      message: 'Order status sync completed',
      ...result
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('Order status sync error:', error);

    await AdminActivity.logActivity({
      adminId: req.admin._id,
      sessionId: req.adminSession._id,
      action: 'ERROR',
      description: `Failed to sync order status: ${error.message}`,
      resource: 'orders',
      endpoint: '/api/admin/orders/:orderId/sync-status',
      method: 'POST',
      ipAddress: ipAddress,
      userAgent: userAgent,
      statusCode: 500,
      responseTime: responseTime,
      errorMessage: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to sync order status'
    });
  }
});

// Book on behalf of user
router.post('/orders/book-on-behalf', adminAuth, async (req, res, next) => {
  const startTime = Date.now();
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.get('User-Agent') || '';

  try {
    // Call the controller method
    await OrderController.bookOnBehalf(req, res);

    // Log activity (if success - though the response might already be sent)
    // Note: If the controller has already sent a response, this might need care.
    // However, bookOnBehalf sends responses.

    // To log activity properly, we might want to log it BEFORE calling controller 
    // or inside the controller. I added it to implementation plan to log.
    // Let's log it here if successful.

    await AdminActivity.logActivity({
      adminId: req.admin._id,
      sessionId: req.adminSession._id,
      action: 'ORDER_BOOK_ON_BEHALF',
      description: `Admin ${req.admin.name} booked an order for user ${req.body.userId}`,
      resource: 'orders',
      endpoint: '/api/admin/orders/book-on-behalf',
      method: 'POST',
      ipAddress: ipAddress,
      userAgent: userAgent,
      statusCode: 201,
      responseTime: Date.now() - startTime,
      metadata: {
        targetUserId: req.body.userId,
        package: req.body.packageName
      }
    });

  } catch (error) {
    console.error('Book on behalf route error:', error);
    // Error response handled by controller or middleware
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
});

export default router;

