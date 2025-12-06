import express from 'express';
import adminAuth from '../../../middleware/adminAuth.js';
import AdminActivity from '../../../models/AdminActivity.js';
import Order from '../../../models/Order.js';
import User from '../../../models/User.js';
import Notification from '../../../models/Notification.js';
import Test from '../../../models/Test.js';
import Offer from '../../../models/Offer.js';
import Profile from '../../../models/Profile.js';

const router = express.Router();

// Dashboard endpoint - returns top 5 data for each section
router.get('/dashboard', adminAuth, async (req, res) => {
  const startTime = Date.now();
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.get('User-Agent') || '';

  try {
    console.log('Fetching dashboard data for admin:', req.admin.name);

    // Fetch data in parallel for better performance
    const [
      recentOrders,
      userStats,
      recentNotifications,
      popularTests,
      popularOffers,
      systemStatus
    ] = await Promise.all([
      // Recent Orders (top 5)
      Order.find({})
        .populate('userId', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .limit(5)
        .select('orderId contactInfo package status createdAt thyrocare.status'),

      // User Statistics
      Promise.all([
        User.countDocuments(),
        User.countDocuments({ createdAt: { $gte: new Date(new Date().setDate(new Date().getDate() - 30)) } }),
        User.find({}).sort({ createdAt: -1 }).limit(5).select('firstName lastName email mobileNumber createdAt')
      ]),

      // Recent Notifications (top 5)
      Notification.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title type status createdAt'),

      // Popular Tests (top 5 by custom pricing updates)
      Test.find({ customDiscount: { $gt: 0 } })
        .sort({ updatedAt: -1 })
        .limit(5)
        .select('code name mrp customDiscount sellingPrice'),

      // Popular Offers (top 5)
      Offer.find({})
        .sort({ updatedAt: -1 })
        .limit(5)
        .select('code name mrp customDiscount sellingPrice'),

      // System Status
      Promise.all([
        Order.countDocuments(),
        Order.countDocuments({ status: 'PENDING' }),
        Order.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } })
      ])
    ]);

    // Process orders data
    const processedOrders = recentOrders.map(order => ({
      id: order.orderId,
      customer: order.contactInfo?.email || 'N/A',
      status: order.status,
      thyrocareStatus: order.thyrocare?.status || 'N/A',
      amount: order.package?.price || 0,
      date: order.createdAt
    }));

    // Process user data
    const [totalUsers, newUsersLast30Days, recentUsers] = userStats;
    const processedUsers = recentUsers.map(user => ({
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Anonymous',
      email: user.email,
      phone: user.mobileNumber,
      joined: user.createdAt
    }));

    // Process notifications
    const processedNotifications = recentNotifications.map(notification => ({
      title: notification.title,
      type: notification.type,
      status: notification.status,
      date: notification.createdAt
    }));

    // Process products
    const processedTests = popularTests.map(test => ({
      code: test.code,
      name: test.name,
      mrp: test.mrp,
      discount: test.customDiscount,
      sellingPrice: test.sellingPrice
    }));

    const processedOffers = popularOffers.map(offer => ({
      code: offer.code,
      name: offer.name,
      mrp: offer.mrp,
      discount: offer.customDiscount,
      sellingPrice: offer.sellingPrice
    }));

    // System stats
    const [totalOrders, pendingOrders, todaysOrders] = systemStatus;

    // Calculate analytics metrics
    const revenueData = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$package.price' },
          avgOrderValue: { $avg: '$package.price' }
        }
      }
    ]);

    const totalRevenue = revenueData[0]?.totalRevenue || 0;
    const avgOrderValue = revenueData[0]?.avgOrderValue || 0;
    const conversionRate = totalUsers > 0 ? ((totalOrders / totalUsers) * 100).toFixed(1) : 0;

    await AdminActivity.logActivity({
      adminId: req.admin._id,
      sessionId: req.adminSession._id,
      action: 'DASHBOARD_FETCH',
      description: `Admin ${req.admin.name} fetched dashboard data`,
      resource: 'dashboard',
      endpoint: '/api/admin/dashboard',
      method: 'GET',
      ipAddress: ipAddress,
      userAgent: userAgent,
      statusCode: 200,
      responseTime: Date.now() - startTime,
      metadata: {
        ordersCount: processedOrders.length,
        usersCount: processedUsers.length,
        notificationsCount: processedNotifications.length
      }
    });

    res.json({
      success: true,
      dashboard: {
        orders: {
          title: 'Recent Orders',
          description: 'Latest customer orders and their status',
          data: processedOrders,
          total: totalOrders,
          pending: pendingOrders,
          todays: todaysOrders,
          viewMoreUrl: '/orders'
        },
        analytics: {
          title: 'Business Insights',
          description: 'Key performance metrics and trends',
          data: {
            totalRevenue,
            totalOrders,
            totalUsers,
            newUsersLast30Days,
            avgOrderValue: avgOrderValue.toFixed(2),
            conversionRate: `${conversionRate}%`,
            pendingOrders
          },
          viewMoreUrl: '/analytics'
        },
        notifications: {
          title: 'Recent Notifications',
          description: 'Latest email and SMS notifications sent',
          data: processedNotifications,
          total: await Notification.countDocuments(),
          viewMoreUrl: '/notifications'
        },
        users: {
          title: 'Recent Users',
          description: 'Newly registered users',
          data: processedUsers,
          total: totalUsers,
          newLast30Days: newUsersLast30Days,
          viewMoreUrl: '/users'
        },
        products: {
          title: 'Popular Products',
          description: 'Tests and offers with custom pricing',
          tests: processedTests,
          offers: processedOffers,
          totalTests: await Test.countDocuments(),
          totalOffers: await Offer.countDocuments(),
          viewMoreUrl: '/offers' // Could be products management page
        },
        system: {
          title: 'System Status',
          description: 'Current system health and overview',
          data: {
            totalOrders,
            totalUsers,
            totalRevenue,
            pendingOrders,
            todaysOrders,
            newUsersLast30Days,
            uptime: process.uptime()
          },
          viewMoreUrl: '/settings'
        }
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('Dashboard fetch error:', error);

    await AdminActivity.logActivity({
      adminId: req.admin._id,
      sessionId: req.adminSession._id,
      action: 'ERROR',
      description: `Failed to fetch dashboard data: ${error.message}`,
      resource: 'dashboard',
      endpoint: '/api/admin/dashboard',
      method: 'GET',
      ipAddress: ipAddress,
      userAgent: userAgent,
      statusCode: 500,
      responseTime: responseTime,
      errorMessage: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data'
    });
  }
});

export default router;
