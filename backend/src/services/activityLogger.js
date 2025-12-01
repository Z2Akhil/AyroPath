import AdminActivity from '../models/AdminActivity.js';

/**
 * Centralized activity logging service for admin actions
 * Provides consistent logging patterns across all admin operations
 */
class ActivityLogger {
  /**
   * Log a generic admin activity
   * @param {Object} admin - Admin document
   * @param {Object} session - AdminSession document
   * @param {string} action - Action type (must be in AdminActivity schema enum)
   * @param {string} description - Human-readable description
   * @param {Object} metadata - Additional metadata for the activity
   * @param {string} resource - Resource type (e.g., 'users', 'products', 'orders')
   * @param {string} resourceId - ID of the resource being acted upon
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method
   * @param {number} statusCode - HTTP status code
   * @param {number} responseTime - Response time in milliseconds
   * @param {string} errorMessage - Error message if any
   * @returns {Promise<Object>} The created activity document
   */
  static async logActivity({
    admin,
    session,
    action,
    description,
    metadata = {},
    resource = '',
    resourceId = null,
    endpoint = '',
    method = 'GET',
    statusCode = null,
    responseTime = null,
    errorMessage = null
  }) {
    try {
      const activityData = {
        adminId: admin._id,
        sessionId: session._id,
        action,
        description,
        resource,
        resourceId,
        endpoint,
        method,
        ipAddress: session.ipAddress || 'unknown',
        userAgent: session.userAgent || '',
        statusCode,
        responseTime,
        errorMessage,
        metadata
      };

      console.log(`📝 Logging admin activity: ${action} - ${description}`, {
        admin: admin.name,
        resource,
        resourceId
      });

      return await AdminActivity.logActivity(activityData);
    } catch (error) {
      console.error('Failed to log admin activity:', error);
      // Don't throw error to prevent breaking the main operation
      return null;
    }
  }

  /**
   * Log user-related admin activities
   */
  static async logUserActivity(admin, session, action, description, metadata = {}) {
    return this.logActivity({
      admin,
      session,
      action,
      description,
      resource: 'users',
      endpoint: '/api/admin/users',
      metadata
    });
  }

  /**
   * Log when admin views a user's details
   * @param {Object} admin - Admin document
   * @param {Object} session - AdminSession document
   * @param {string} userId - ID of the user being viewed
   * @param {Object} userData - User data (for logging purposes)
   * @returns {Promise<Object>} Activity document
   */
  static async logUserView(admin, session, userId, userData) {
    return this.logUserActivity(
      admin,
      session,
      'USERS_VIEW',
      `Admin ${admin.name} viewed user ${userData.email || userId}`,
      {
        userId,
        userEmail: userData.email,
        userName: `${userData.firstName} ${userData.lastName}`
      }
    );
  }

  /**
   * Log when admin updates a user
   * @param {Object} admin - Admin document
   * @param {Object} session - AdminSession document
   * @param {string} userId - ID of the user being updated
   * @param {Object} oldData - User data before update
   * @param {Object} newData - User data after update
   * @returns {Promise<Object>} Activity document
   */
  static async logUserUpdate(admin, session, userId, oldData, newData) {
    const changes = this.getFieldChanges(oldData, newData);
    
    return this.logUserActivity(
      admin,
      session,
      'USERS_UPDATE',
      `Admin ${admin.name} updated user ${oldData.email || userId}`,
      {
        userId,
        changes,
        oldData: this.sanitizeUserData(oldData),
        newData: this.sanitizeUserData(newData)
      }
    );
  }

  /**
   * Log when admin changes a user's status
   * @param {Object} admin - Admin document
   * @param {Object} session - AdminSession document
   * @param {string} userId - ID of the user
   * @param {Object} userData - User data
   * @param {boolean} newStatus - New active status
   * @returns {Promise<Object>} Activity document
   */
  static async logUserStatusChange(admin, session, userId, userData, newStatus) {
    return this.logUserActivity(
      admin,
      session,
      'USERS_UPDATE',
      `Admin ${admin.name} changed status of user ${userData.email || userId} to ${newStatus ? 'Active' : 'Inactive'}`,
      {
        userId,
        oldStatus: userData.isActive,
        newStatus,
        userEmail: userData.email
      }
    );
  }

  /**
   * Compare two objects and identify changed fields
   * @param {Object} oldData - Original data
   * @param {Object} newData - Updated data
   * @returns {Object} Object containing changed fields with old and new values
   */
  static getFieldChanges(oldData, newData) {
    const changes = {};
    
    // Check all fields in newData
    for (const key in newData) {
      // Skip internal fields and undefined values
      if (key.startsWith('_') || newData[key] === undefined) {
        continue;
      }
      
      // Check if value changed
      if (oldData[key] !== newData[key]) {
        changes[key] = {
          old: oldData[key],
          new: newData[key]
        };
      }
    }
    
    return changes;
  }

  /**
   * Sanitize user data for logging (remove sensitive information)
   * @param {Object} userData - User data object
   * @returns {Object} Sanitized user data
   */
  static sanitizeUserData(userData) {
    if (!userData) return {};
    
    const sanitized = { ...userData };
    
    // Remove sensitive fields
    delete sanitized.password;
    delete sanitized.__v;
    delete sanitized._id;
    
    // Convert Mongoose document to plain object if needed
    if (sanitized.toObject) {
      return sanitized.toObject();
    }
    
    return sanitized;
  }

  /**
   * Log product-related activities
   */
  static async logProductActivity(admin, session, action, description, metadata = {}) {
    return this.logActivity({
      admin,
      session,
      action,
      description,
      resource: 'products',
      endpoint: '/api/admin/products',
      metadata
    });
  }

  /**
   * Log order-related activities
   */
  static async logOrderActivity(admin, session, action, description, metadata = {}) {
    return this.logActivity({
      admin,
      session,
      action,
      description,
      resource: 'orders',
      endpoint: '/api/admin/orders',
      metadata
    });
  }

  /**
   * Log error activities
   */
  static async logError(admin, session, description, error, endpoint, method) {
    return this.logActivity({
      admin,
      session,
      action: 'ERROR',
      description,
      endpoint,
      method,
      statusCode: 500,
      errorMessage: error.message,
      metadata: {
        error: error.message,
        stack: error.stack
      }
    });
  }
}

export default ActivityLogger;
