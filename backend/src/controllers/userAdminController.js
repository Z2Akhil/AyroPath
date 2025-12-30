import User from '../models/User.js';
import ActivityLogger from '../services/activityLogger.js';
import validator from 'validator';

/**
 * Controller for admin user management operations
 */
class UserAdminController {
  /**
   * Get detailed information about a specific user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getUserDetails(req, res) {
    const startTime = Date.now();
    
    try {
      const { userId } = req.params;
      
      console.log('Fetching user details for admin:', {
        admin: req.admin.name,
        userId,
        sessionId: req.adminSession._id
      });

      // Find user by ID
      const user = await User.findById(userId).select('-password');
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Log the view activity
      await ActivityLogger.logUserView(
        req.admin,
        req.adminSession,
        userId,
        user
      );

      const responseTime = Date.now() - startTime;
      
      res.json({
        success: true,
        user,
        responseTime
      });

    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error('Get user details error:', error);

      // Log error activity
      await ActivityLogger.logError(
        req.admin,
        req.adminSession,
        `Failed to fetch user details: ${error.message}`,
        error,
        `/api/admin/users/${req.params.userId}`,
        'GET'
      );

      res.status(500).json({
        success: false,
        error: 'Failed to fetch user details',
        responseTime
      });
    }
  }

  /**
   * Update user information (admin can update all fields)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async updateUser(req, res) {
    const startTime = Date.now();
    
    try {
      const { userId } = req.params;
      const updateData = req.body;
      
      console.log('Admin updating user:', {
        admin: req.admin.name,
        userId,
        updateData,
        sessionId: req.adminSession._id
      });

      // Find user first to get old data for logging
      const oldUser = await User.findById(userId).select('-password');
      
      if (!oldUser) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Validate email if provided
      if (updateData.email && !validator.isEmail(updateData.email)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email address'
        });
      }

      // Validate mobile number if provided
      if (updateData.mobileNumber && !validator.isMobilePhone(updateData.mobileNumber, "any", { strictMode: false })) {
        return res.status(400).json({
          success: false,
          error: 'Invalid mobile number'
        });
      }

      // Prepare update data
      const sanitizedUpdateData = { ...updateData };
      
      // Remove password field if present (password updates should be separate)
      if (sanitizedUpdateData.password) {
        delete sanitizedUpdateData.password;
      }
      
      // Add updatedAt timestamp
      sanitizedUpdateData.updatedAt = Date.now();

      // Update user
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        sanitizedUpdateData,
        { new: true, runValidators: true }
      ).select('-password');

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          error: 'User not found after update'
        });
      }

      // Log the update activity with detailed changes
      await ActivityLogger.logUserUpdate(
        req.admin,
        req.adminSession,
        userId,
        oldUser,
        updatedUser
      );

      const responseTime = Date.now() - startTime;
      
      res.json({
        success: true,
        message: 'User updated successfully',
        user: updatedUser,
        responseTime
      });

    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error('Update user error:', error);

      // Handle validation errors
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          error: errors.join(', ')
        });
      }

      // Handle duplicate key errors
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return res.status(400).json({
          success: false,
          error: `${field} already exists`
        });
      }

      // Log error activity
      await ActivityLogger.logError(
        req.admin,
        req.adminSession,
        `Failed to update user: ${error.message}`,
        error,
        `/api/admin/users/${req.params.userId}`,
        'PUT'
      );

      res.status(500).json({
        success: false,
        error: 'Failed to update user',
        responseTime
      });
    }
  }

  /**
   * Toggle user active/inactive status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async toggleUserStatus(req, res) {
    const startTime = Date.now();
    
    try {
      const { userId } = req.params;
      const { isActive } = req.body;
      
      console.log('Admin toggling user status:', {
        admin: req.admin.name,
        userId,
        isActive,
        sessionId: req.adminSession._id
      });

      if (typeof isActive !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'isActive must be a boolean value'
        });
      }

      // Find user first to get old data for logging
      const oldUser = await User.findById(userId).select('-password');
      
      if (!oldUser) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Update user status
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { 
          isActive,
          updatedAt: Date.now()
        },
        { new: true }
      ).select('-password');

      // Log the status change activity
      await ActivityLogger.logUserStatusChange(
        req.admin,
        req.adminSession,
        userId,
        oldUser,
        isActive
      );

      const responseTime = Date.now() - startTime;
      
      res.json({
        success: true,
        message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
        user: updatedUser,
        responseTime
      });

    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error('Toggle user status error:', error);

      // Log error activity
      await ActivityLogger.logError(
        req.admin,
        req.adminSession,
        `Failed to toggle user status: ${error.message}`,
        error,
        `/api/admin/users/${req.params.userId}/status`,
        'PATCH'
      );

      res.status(500).json({
        success: false,
        error: 'Failed to update user status',
        responseTime
      });
    }
  }

  /**
   * Search users with filters
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async searchUsers(req, res) {
    const startTime = Date.now();
    
    try {
      const { 
        search = '',
        status, // 'active', 'inactive', or undefined for all
        verified, // true, false, or undefined for all
        page = 1,
        limit = 20
      } = req.query;

      console.log('Admin searching users:', {
        admin: req.admin.name,
        search,
        status,
        verified,
        page,
        limit,
        sessionId: req.adminSession._id
      });

      // Build query
      const query = {};
      
      // Search by name, email, or mobile number
      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { mobileNumber: { $regex: search, $options: 'i' } }
        ];
      }
      
      // Filter by status
      if (status === 'active') {
        query.isActive = true;
      } else if (status === 'inactive') {
        query.isActive = false;
      }
      
      // Filter by verification status
      if (verified !== undefined) {
        query.emailVerified = verified === 'true';
      }

      // Calculate pagination
      const skip = (page - 1) * limit;
      
      // Execute query with pagination
      const [users, totalCount] = await Promise.all([
        User.find(query)
          .select('-password')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        User.countDocuments(query)
      ]);

      const responseTime = Date.now() - startTime;
      
      res.json({
        success: true,
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        },
        responseTime
      });

    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error('Search users error:', error);

      // Log error activity
      await ActivityLogger.logError(
        req.admin,
        req.adminSession,
        `Failed to search users: ${error.message}`,
        error,
        '/api/admin/users/search',
        'GET'
      );

      res.status(500).json({
        success: false,
        error: 'Failed to search users',
        responseTime
      });
    }
  }

  /**
   * Get users who need migration to mobile (email-only users)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getUsersNeedingMigration(req, res) {
    const startTime = Date.now();
    
    try {
      const { page = 1, limit = 20 } = req.query;
      
      console.log('Admin fetching users needing migration:', {
        admin: req.admin.name,
        page,
        limit,
        sessionId: req.adminSession._id
      });

      // Find users who have email but no mobile number or have pending migration
      const query = {
        $or: [
          { mobileNumber: { $exists: false } },
          { mobileNumber: null },
          { mobileNumber: '' },
          { migrationStatus: { $in: ['pending', 'in_progress'] } }
        ],
        email: { $exists: true, $ne: null, $ne: '' } // Must have email
      };

      // Calculate pagination
      const skip = (page - 1) * limit;
      
      // Execute query with pagination
      const [users, totalCount] = await Promise.all([
        User.find(query)
          .select('-password')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        User.countDocuments(query)
      ]);

      const responseTime = Date.now() - startTime;
      
      res.json({
        success: true,
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        },
        responseTime
      });

    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error('Get users needing migration error:', error);

      // Log error activity
      await ActivityLogger.logError(
        req.admin,
        req.adminSession,
        `Failed to fetch users needing migration: ${error.message}`,
        error,
        '/api/admin/users/migration/needed',
        'GET'
      );

      res.status(500).json({
        success: false,
        error: 'Failed to fetch users needing migration',
        responseTime
      });
    }
  }

  /**
   * Initiate migration for a user (send migration email)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async initiateUserMigration(req, res) {
    const startTime = Date.now();
    
    try {
      const { userId } = req.params;
      
      console.log('Admin initiating user migration:', {
        admin: req.admin.name,
        userId,
        sessionId: req.adminSession._id
      });

      // Find user
      const user = await User.findById(userId).select('-password');
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Check if user already has mobile number
      if (user.mobileNumber && user.mobileNumber.trim() !== '') {
        return res.status(400).json({
          success: false,
          error: 'User already has a mobile number',
          user
        });
      }

      // Update migration status
      user.migrationStatus = 'pending';
      user.lastMigrationReminder = new Date();
      await user.save();

      // TODO: Send migration email to user
      // This would integrate with your email service
      // For now, we'll log it
      console.log(`Migration email would be sent to: ${user.email}`);
      console.log(`User: ${user.firstName} ${user.lastName}`);
      console.log('Migration instructions email template needed');

      // Log the migration initiation
      await ActivityLogger.logUserMigrationInitiated(
        req.admin,
        req.adminSession,
        userId,
        user
      );

      const responseTime = Date.now() - startTime;
      
      res.json({
        success: true,
        message: 'Migration initiated successfully. Email would be sent to user.',
        user,
        responseTime
      });

    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error('Initiate user migration error:', error);

      // Log error activity
      await ActivityLogger.logError(
        req.admin,
        req.adminSession,
        `Failed to initiate user migration: ${error.message}`,
        error,
        `/api/admin/users/${req.params.userId}/migrate`,
        'POST'
      );

      res.status(500).json({
        success: false,
        error: 'Failed to initiate user migration',
        responseTime
      });
    }
  }

  /**
   * Bulk initiate migration for multiple users
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async bulkInitiateMigration(req, res) {
    const startTime = Date.now();
    
    try {
      const { userIds } = req.body;
      
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'userIds array is required'
        });
      }

      console.log('Admin bulk initiating migration:', {
        admin: req.admin.name,
        userIdCount: userIds.length,
        sessionId: req.adminSession._id
      });

      const results = {
        successful: [],
        failed: [],
        alreadyHaveMobile: []
      };

      // Process each user
      for (const userId of userIds) {
        try {
          const user = await User.findById(userId).select('-password');
          
          if (!user) {
            results.failed.push({ userId, error: 'User not found' });
            continue;
          }

          // Check if user already has mobile number
          if (user.mobileNumber && user.mobileNumber.trim() !== '') {
            results.alreadyHaveMobile.push({ userId, user });
            continue;
          }

          // Update migration status
          user.migrationStatus = 'pending';
          user.lastMigrationReminder = new Date();
          await user.save();

          // TODO: Send migration email
          console.log(`Migration email would be sent to: ${user.email}`);

          results.successful.push({ userId, user });
          
          // Log individual migration initiation
          await ActivityLogger.logUserMigrationInitiated(
            req.admin,
            req.adminSession,
            userId,
            user
          );

        } catch (userError) {
          results.failed.push({ userId, error: userError.message });
        }
      }

      const responseTime = Date.now() - startTime;
      
      res.json({
        success: true,
        message: 'Bulk migration initiated',
        results,
        summary: {
          total: userIds.length,
          successful: results.successful.length,
          alreadyHaveMobile: results.alreadyHaveMobile.length,
          failed: results.failed.length
        },
        responseTime
      });

    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error('Bulk initiate migration error:', error);

      // Log error activity
      await ActivityLogger.logError(
        req.admin,
        req.adminSession,
        `Failed to bulk initiate migration: ${error.message}`,
        error,
        '/api/admin/users/migration/bulk',
        'POST'
      );

      res.status(500).json({
        success: false,
        error: 'Failed to bulk initiate migration',
        responseTime
      });
    }
  }
}

export default UserAdminController;
