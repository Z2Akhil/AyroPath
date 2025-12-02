import express from 'express';
import {
  sendNotification,
  getNotifications,
  getNotificationById,
  retryFailed,
  getStats
} from '../controllers/notificationController.js';
import adminAuth from '../middleware/adminAuth.js';
import User from '../models/User.js';

const router = express.Router();

// All routes require admin authentication
router.use(adminAuth);

// Send new notification
router.post('/', sendNotification);

// Get notification history with pagination
router.get('/', getNotifications);

// Get notification statistics
router.get('/stats', getStats);

// Get specific notification details
router.get('/:id', getNotificationById);

// Retry failed deliveries for a notification
router.post('/:id/retry-failed', retryFailed);

// Get users for notification (simplified endpoint)
router.get('/users/list', async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build search query
    const searchQuery = {};
    if (search) {
      searchQuery.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobileNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Fetch users
    const users = await User.find(searchQuery)
      .select('-password') // Exclude password
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await User.countDocuments(searchQuery);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching users for notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

export default router;
