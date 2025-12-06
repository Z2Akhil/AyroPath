import express from 'express';
import adminAuth from '../../../middleware/adminAuth.js';
import AdminActivity from '../../../models/AdminActivity.js';
import User from '../../../models/User.js';
import UserAdminController from '../../../controllers/userAdminController.js';

const router = express.Router();

// Users endpoint - get all users
router.get('/users', adminAuth, async (req, res) => {
  const startTime = Date.now();
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.get('User-Agent') || '';

  try {
    console.log('Fetching all users for admin:', req.admin.name);

    // Fetch all users from database
    const users = await User.find({})
      .select('-password') // Exclude password field
      .sort({ createdAt: -1 });

    await AdminActivity.logActivity({
      adminId: req.admin._id,
      sessionId: req.adminSession._id,
      action: 'USERS_FETCH',
      description: `Admin ${req.admin.name} fetched all users`,
      resource: 'users',
      endpoint: '/api/admin/users',
      method: 'GET',
      ipAddress: ipAddress,
      userAgent: userAgent,
      statusCode: 200,
      responseTime: Date.now() - startTime,
      metadata: {
        userCount: users.length
      }
    });

    res.json({
      success: true,
      users: users,
      totalCount: users.length
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('Users fetch error:', error);

    await AdminActivity.logActivity({
      adminId: req.admin._id,
      sessionId: req.adminSession._id,
      action: 'ERROR',
      description: `Failed to fetch users: ${error.message}`,
      resource: 'users',
      endpoint: '/api/admin/users',
      method: 'GET',
      ipAddress: ipAddress,
      userAgent: userAgent,
      statusCode: 500,
      responseTime: responseTime,
      errorMessage: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
});

// Enhanced User Management Routes
router.get('/users/search', adminAuth, UserAdminController.searchUsers);
router.get('/users/:userId', adminAuth, UserAdminController.getUserDetails);
router.put('/users/:userId', adminAuth, UserAdminController.updateUser);
router.patch('/users/:userId/status', adminAuth, UserAdminController.toggleUserStatus);

export default router;
