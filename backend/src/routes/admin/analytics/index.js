import express from 'express';
import adminAuth from '../../../middleware/adminAuth.js';
import AdminActivity from '../../../models/AdminActivity.js';
import Order from '../../../models/Order.js';
import User from '../../../models/User.js';

const router = express.Router();

// Analytics Endpoints
router.get('/analytics/overview', adminAuth, async (req, res) => {
  const startTime = Date.now();
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.get('User-Agent') || '';

  try {
    const { startDate, endDate } = req.query;
    
    console.log('Fetching analytics overview for admin:', req.admin.name, { startDate, endDate });

    // Date range filter
    const dateFilter = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate);
    }

    // Get order analytics
    const orderMatch = {};
    if (startDate || endDate) {
      orderMatch.createdAt = dateFilter;
    }

    const [
      totalOrders,
      totalRevenue,
      pendingOrders,
      createdOrders,
      completedOrders,
      failedOrders,
      cancelledOrders,
      totalUsers,
      newUsers
    ] = await Promise.all([
      // Order counts
      Order.countDocuments(orderMatch),
      Order.aggregate([
        { $match: orderMatch },
        { $group: { _id: null, total: { $sum: '$package.price' } } }
      ]).then(result => result[0]?.total || 0),
      Order.countDocuments({ ...orderMatch, status: 'PENDING' }),
      Order.countDocuments({ ...orderMatch, status: 'CREATED' }),
      Order.countDocuments({ ...orderMatch, status: 'COMPLETED' }),
      Order.countDocuments({ ...orderMatch, status: 'FAILED' }),
      Order.countDocuments({ ...orderMatch, status: 'CANCELLED' }),
      
      // User counts
      User.countDocuments(),
      User.countDocuments(startDate || endDate ? { createdAt: dateFilter } : {})
    ]);

    // Calculate conversion rate
    const conversionRate = totalUsers > 0 ? (totalOrders / totalUsers * 100).toFixed(1) : 0;

    // Get Thyrocare status counts
    const thyrocareStatusCounts = {
      YET_TO_ASSIGN: await Order.countDocuments({ ...orderMatch, 'thyrocare.status': 'YET TO ASSIGN' }),
      ASSIGNED: await Order.countDocuments({ ...orderMatch, 'thyrocare.status': 'ASSIGNED' }),
      ACCEPTED: await Order.countDocuments({ ...orderMatch, 'thyrocare.status': 'ACCEPTED' }),
      SERVICED: await Order.countDocuments({ ...orderMatch, 'thyrocare.status': 'SERVICED' }),
      DONE: await Order.countDocuments({ ...orderMatch, 'thyrocare.status': 'DONE' }),
      FAILED: await Order.countDocuments({ ...orderMatch, 'thyrocare.status': 'FAILED' })
    };

    // Calculate average order value
    const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0;

    await AdminActivity.logActivity({
      adminId: req.admin._id,
      sessionId: req.adminSession._id,
      action: 'ANALYTICS_FETCH',
      description: `Admin ${req.admin.name} fetched analytics overview`,
      resource: 'analytics',
      endpoint: '/api/admin/analytics/overview',
      method: 'GET',
      ipAddress: ipAddress,
      userAgent: userAgent,
      statusCode: 200,
      responseTime: Date.now() - startTime,
      metadata: {
        startDate,
        endDate,
        totalOrders,
        totalRevenue
      }
    });

    res.json({
      success: true,
      overview: {
        metrics: {
          totalOrders,
          totalRevenue,
          avgOrderValue: parseFloat(avgOrderValue),
          totalUsers,
          newUsers,
          conversionRate: parseFloat(conversionRate),
          activeUsers: totalOrders > 0 ? totalOrders : 0 // Simplified active users
        },
        orderStatus: {
          PENDING: pendingOrders,
          CREATED: createdOrders,
          COMPLETED: completedOrders,
          FAILED: failedOrders,
          CANCELLED: cancelledOrders
        },
        thyrocareStatus: thyrocareStatusCounts
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('Analytics overview fetch error:', error);

    await AdminActivity.logActivity({
      adminId: req.admin._id,
      sessionId: req.adminSession._id,
      action: 'ERROR',
      description: `Failed to fetch analytics overview: ${error.message}`,
      resource: 'analytics',
      endpoint: '/api/admin/analytics/overview',
      method: 'GET',
      ipAddress: ipAddress,
      userAgent: userAgent,
      statusCode: 500,
      responseTime: responseTime,
      errorMessage: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics overview'
    });
  }
});

router.get('/analytics/trends', adminAuth, async (req, res) => {
  const startTime = Date.now();
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.get('User-Agent') || '';

  try {
    const { period = 'daily', startDate, endDate } = req.query;
    
    console.log('Fetching analytics trends for admin:', req.admin.name, { period, startDate, endDate });

    // Default date range: last 30 days
    const defaultEndDate = new Date();
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 30);

    const dateFilter = {
      $gte: startDate ? new Date(startDate) : defaultStartDate,
      $lte: endDate ? new Date(endDate) : defaultEndDate
    };

    // Determine date format for grouping
    let dateFormat;
    switch (period) {
      case 'daily':
        dateFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
        break;
      case 'weekly':
        dateFormat = { $dateToString: { format: '%Y-%W', date: '$createdAt' } };
        break;
      case 'monthly':
        dateFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
        break;
      default:
        dateFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
    }

    // Get order trends
    const orderTrends = await Order.aggregate([
      {
        $match: {
          createdAt: dateFilter
        }
      },
      {
        $group: {
          _id: dateFormat,
          date: { $first: '$createdAt' },
          orderCount: { $sum: 1 },
          revenue: { $sum: '$package.price' }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          orderCount: 1,
          revenue: 1
        }
      }
    ]);

    // Get user signup trends
    const userTrends = await User.aggregate([
      {
        $match: {
          createdAt: dateFilter
        }
      },
      {
        $group: {
          _id: dateFormat,
          date: { $first: '$createdAt' },
          userCount: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          userCount: 1
        }
      }
    ]);

    await AdminActivity.logActivity({
      adminId: req.admin._id,
      sessionId: req.adminSession._id,
      action: 'ANALYTICS_TRENDS_FETCH',
      description: `Admin ${req.admin.name} fetched analytics trends`,
      resource: 'analytics',
      endpoint: '/api/admin/analytics/trends',
      method: 'GET',
      ipAddress: ipAddress,
      userAgent: userAgent,
      statusCode: 200,
      responseTime: Date.now() - startTime,
      metadata: {
        period,
        startDate: dateFilter.$gte,
        endDate: dateFilter.$lte
      }
    });

    res.json({
      success: true,
      trends: {
        orderTrends,
        userTrends
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('Analytics trends fetch error:', error);

    await AdminActivity.logActivity({
      adminId: req.admin._id,
      sessionId: req.adminSession._id,
      action: 'ERROR',
      description: `Failed to fetch analytics trends: ${error.message}`,
      resource: 'analytics',
      endpoint: '/api/admin/analytics/trends',
      method: 'GET',
      ipAddress: ipAddress,
      userAgent: userAgent,
      statusCode: 500,
      responseTime: responseTime,
      errorMessage: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics trends'
    });
  }
});

export default router;
