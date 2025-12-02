import Notification from '../models/Notification.js';
import User from '../models/User.js';
import EmailService from '../utils/emailService.js';
import mongoose from 'mongoose';

export const sendNotification = async (req, res) => {
  try {
    const { subject, content, emailType, userIds } = req.body;
    const adminId = req.admin._id;

    // Validate required fields
    if (!subject || !content || !emailType || !userIds || !Array.isArray(userIds)) {
      return res.status(400).json({
        success: false,
        message: 'Subject, content, emailType, and userIds array are required'
      });
    }

    // Validate email type
    if (!['promotional', 'informational'].includes(emailType)) {
      return res.status(400).json({
        success: false,
        message: 'Email type must be either "promotional" or "informational"'
      });
    }

    // Get users with their emails
    const users = await User.find({
      _id: { $in: userIds },
      email: { $exists: true, $ne: null }
    }).select('_id email firstName');

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid users found with email addresses'
      });
    }

    // Create notification record
    const notification = new Notification({
      subject,
      content,
      emailType,
      createdBy: adminId,
      totalRecipients: users.length,
      status: 'draft',
      recipients: users.map(user => ({
        userId: user._id,
        email: user.email,
        status: 'pending'
      }))
    });

    await notification.save();

    // Start sending emails asynchronously
    sendEmailsInBackground(notification, users);

    res.status(201).json({
      success: true,
      message: 'Notification created and sending started',
      data: {
        notificationId: notification._id,
        totalRecipients: notification.totalRecipients,
        status: notification.status
      }
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      error: error.message
    });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, emailType } = req.query;
    const adminId = req.admin._id;

    const query = { createdBy: adminId };
    
    if (status) query.status = status;
    if (emailType) query.emailType = emailType;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'firstName lastName email')
      .lean();

    const total = await Notification.countDocuments(query);

    res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
};

export const getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin._id;

    const notification = await Notification.findOne({
      _id: id,
      createdBy: adminId
    })
    .populate('createdBy', 'firstName lastName email')
    .populate('recipients.userId', 'firstName lastName email')
    .lean();

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error fetching notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification',
      error: error.message
    });
  }
};

export const retryFailed = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin._id;

    const notification = await Notification.findOne({
      _id: id,
      createdBy: adminId,
      status: 'completed'
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or not completed'
      });
    }

    const failedRecipients = notification.recipients.filter(r => r.status === 'failed');
    
    if (failedRecipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No failed recipients to retry'
      });
    }

    // Get user details for failed recipients
    const failedUserIds = failedRecipients.map(r => r.userId);
    const users = await User.find({
      _id: { $in: failedUserIds }
    }).select('_id email firstName');

    // Update notification status
    notification.status = 'sending';
    notification.startedAt = new Date();
    await notification.save();

    // Retry failed emails in background
    retryFailedEmailsInBackground(notification, users);

    res.status(200).json({
      success: true,
      message: 'Retry started for failed emails',
      data: {
        notificationId: notification._id,
        failedCount: failedRecipients.length
      }
    });
  } catch (error) {
    console.error('Error retrying failed emails:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retry failed emails',
      error: error.message
    });
  }
};

export const getStats = async (req, res) => {
  try {
    const adminId = req.admin._id;

    const stats = await Notification.aggregate([
      { $match: { createdBy: new mongoose.Types.ObjectId(adminId) } },
      {
        $group: {
          _id: null,
          totalNotifications: { $sum: 1 },
          totalRecipients: { $sum: '$totalRecipients' },
          totalSent: { $sum: '$sentCount' },
          totalFailed: { $sum: '$failedCount' },
          completedNotifications: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      }
    ]);

    const typeStats = await Notification.aggregate([
      { $match: { createdBy: new mongoose.Types.ObjectId(adminId) } },
      {
        $group: {
          _id: '$emailType',
          count: { $sum: 1 },
          totalRecipients: { $sum: '$totalRecipients' },
          totalSent: { $sum: '$sentCount' },
          totalFailed: { $sum: '$failedCount' }
        }
      }
    ]);

    const recentNotifications = await Notification.find({ createdBy: adminId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('subject emailType status createdAt sentCount failedCount')
      .lean();

    const result = {
      overall: stats[0] || {
        totalNotifications: 0,
        totalRecipients: 0,
        totalSent: 0,
        totalFailed: 0,
        completedNotifications: 0
      },
      byType: typeStats.reduce((acc, stat) => {
        acc[stat._id] = stat;
        return acc;
      }, {}),
      recent: recentNotifications
    };

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};

// Helper functions for background processing
async function sendEmailsInBackground(notification, users) {
  try {
    notification.status = 'sending';
    notification.startedAt = new Date();
    await notification.save();

    let sentCount = 0;
    let failedCount = 0;

    // Process emails in batches of 10
    const batchSize = 10;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      const promises = batch.map(async (user) => {
        try {
          const result = await EmailService.sendNotificationEmail(
            user.email,
            notification.subject,
            notification.content,
            notification.emailType,
            { firstName: user.firstName }
          );

          // Update recipient status
          const recipient = notification.recipients.find(r => 
            r.userId.toString() === user._id.toString()
          );
          
          if (recipient) {
            recipient.status = result.success ? 'sent' : 'failed';
            recipient.error = result.success ? null : result.error;
            recipient.sentAt = new Date();
          }

          return result.success ? 'sent' : 'failed';
        } catch (error) {
          // Update recipient status on error
          const recipient = notification.recipients.find(r => 
            r.userId.toString() === user._id.toString()
          );
          
          if (recipient) {
            recipient.status = 'failed';
            recipient.error = error.message;
          }
          
          return 'failed';
        }
      });

      const results = await Promise.allSettled(promises);
      
      // Count results
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          if (result.value === 'sent') sentCount++;
          else failedCount++;
        } else {
          failedCount++;
        }
      });

      // Update counts in notification
      notification.sentCount = sentCount;
      notification.failedCount = failedCount;
      await notification.save();
    }

    // Update final status
    notification.status = 'completed';
    notification.completedAt = new Date();
    await notification.save();

    console.log(`Notification ${notification._id} completed: ${sentCount} sent, ${failedCount} failed`);
  } catch (error) {
    console.error('Error in background email sending:', error);
    notification.status = 'failed';
    await notification.save();
  }
}

async function retryFailedEmailsInBackground(notification, users) {
  try {
    let retrySentCount = 0;
    let retryFailedCount = 0;

    // Process retry emails
    for (const user of users) {
      try {
        const result = await EmailService.sendNotificationEmail(
          user.email,
          notification.subject,
          notification.content,
          notification.emailType,
          { firstName: user.firstName }
        );

        // Update recipient status
        const recipient = notification.recipients.find(r => 
          r.userId.toString() === user._id.toString()
        );
        
        if (recipient) {
          recipient.status = result.success ? 'sent' : 'failed';
          recipient.error = result.success ? null : result.error;
          recipient.sentAt = new Date();
        }

        if (result.success) retrySentCount++;
        else retryFailedCount++;
      } catch (error) {
        retryFailedCount++;
      }
    }

    // Update notification counts
    notification.sentCount += retrySentCount;
    notification.failedCount -= retrySentCount; // Remove from failed count
    notification.status = 'completed';
    notification.completedAt = new Date();
    await notification.save();

    console.log(`Retry completed for notification ${notification._id}: ${retrySentCount} retried successfully`);
  } catch (error) {
    console.error('Error in retry background process:', error);
    notification.status = 'failed';
    await notification.save();
  }
}
