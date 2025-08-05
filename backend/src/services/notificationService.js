import crypto from 'crypto';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

class NotificationService {
  constructor() {
    this.pendingNotifications = new Map();
    this.retryQueue = [];
    
    // Start retry processor
    this.startRetryProcessor();
  }

  // Generate unique notification ID
  generateNotificationId() {
    return crypto.randomBytes(16).toString('hex');
  }

  // Create a new notification
  async createNotification({
    userId,
    type,
    title,
    message,
    priority = 'medium',
    relatedData = {},
    channels = { desktop: true, extension: true, email: false },
    expiresIn = 24 * 60 * 60 * 1000 // 24 hours
  }) {
    try {
      const notificationId = this.generateNotificationId();
      const expiresAt = new Date(Date.now() + expiresIn);

      const notification = new Notification({
        userId,
        notificationId,
        type,
        title,
        message,
        priority,
        relatedData,
        channels: {
          desktop: { enabled: channels.desktop || false, delivered: false },
          extension: { enabled: channels.extension || false, delivered: false },
          email: { enabled: channels.email || false, delivered: false }
        },
        expiresAt
      });

      await notification.save();
      
      // Immediately attempt to deliver
      await this.deliverNotification(notification);
      
      return {
        success: true,
        notificationId,
        notification
      };
    } catch (error) {
      console.error('Create notification error:', error);
      throw error;
    }
  }

  // Deliver notification to all enabled channels
  async deliverNotification(notification) {
    const deliveryPromises = [];

    if (notification.channels.desktop.enabled) {
      deliveryPromises.push(this.deliverDesktopNotification(notification));
    }

    if (notification.channels.extension.enabled) {
      deliveryPromises.push(this.deliverExtensionNotification(notification));
    }

    if (notification.channels.email.enabled) {
      deliveryPromises.push(this.deliverEmailNotification(notification));
    }

    const results = await Promise.allSettled(deliveryPromises);
    
    // Check if any delivery failed and schedule retry if needed
    const failedDeliveries = results.filter(result => result.status === 'rejected');
    if (failedDeliveries.length > 0 && notification.retryCount < notification.maxRetries) {
      await notification.scheduleRetry();
      this.addToRetryQueue(notification);
    }

    return results;
  }

  // Deliver desktop notification
  async deliverDesktopNotification(notification) {
    try {
      // In a real implementation, this would integrate with Chrome's notifications API
      // through the extension's background script
      console.log(`🔔 Desktop notification: ${notification.title} - ${notification.message}`);
      
      // Simulate successful delivery
      await notification.markDelivered('desktop');
      
      return { success: true, channel: 'desktop' };
    } catch (error) {
      console.error('Desktop notification delivery error:', error);
      throw error;
    }
  }

  // Deliver extension notification (through Chrome runtime messaging)
  async deliverExtensionNotification(notification) {
    try {
      // This would typically send a message to the Chrome extension
      // For now, we'll simulate successful delivery
      console.log(`📱 Extension notification: ${notification.title} - ${notification.message}`);
      
      await notification.markDelivered('extension');
      
      return { success: true, channel: 'extension' };
    } catch (error) {
      console.error('Extension notification delivery error:', error);
      throw error;
    }
  }

  // Deliver email notification
  async deliverEmailNotification(notification) {
    try {
      // Get user email
      const user = await User.findById(notification.userId);
      if (!user || !user.email) {
        throw new Error('User email not found');
      }

      // In a real implementation, this would send an actual email
      console.log(`📧 Email notification to ${user.email}: ${notification.title} - ${notification.message}`);
      
      await notification.markDelivered('email');
      
      return { success: true, channel: 'email' };
    } catch (error) {
      console.error('Email notification delivery error:', error);
      throw error;
    }
  }

  // Pre-defined notification types with templates
  async sendTrackingStartedNotification(userId, emailData, sessionId) {
    return await this.createNotification({
      userId,
      type: 'email_tracking_started',
      title: 'Email Tracking Started',
      message: `Started tracking email to ${emailData.to}: "${emailData.subject}"`,
      priority: 'medium',
      relatedData: { emailSessionId: sessionId },
      channels: { desktop: true, extension: true, email: false }
    });
  }

  async sendTrackingStoppedNotification(userId, emailData, sessionId, duration) {
    const durationText = duration > 60 ? `${Math.round(duration / 60)} min` : `${duration} sec`;
    
    return await this.createNotification({
      userId,
      type: 'email_tracking_stopped',
      title: 'Email Tracking Complete',
      message: `Finished tracking email (${durationText}). Click to review summary.`,
      priority: 'high',
      relatedData: { 
        emailSessionId: sessionId,
        actionRequired: true,
        actionUrl: '/assistant'
      },
      channels: { desktop: true, extension: true, email: false }
    });
  }

  async sendSummaryGeneratedNotification(userId, summaryData, sessionId) {
    return await this.createNotification({
      userId,
      type: 'summary_generated',
      title: 'Email Summary Ready',
      message: 'AI summary has been generated for your email. Review and confirm for billing.',
      priority: 'high',
      relatedData: { 
        emailSessionId: sessionId,
        summaryId: summaryData.id,
        actionRequired: true,
        actionUrl: '/assistant'
      },
      channels: { desktop: true, extension: true, email: false }
    });
  }

  async sendConfirmationRequiredNotification(userId, actionType, relatedData) {
    return await this.createNotification({
      userId,
      type: 'confirmation_required',
      title: 'Confirmation Required',
      message: `Please confirm ${actionType} before proceeding.`,
      priority: 'high',
      relatedData: { 
        ...relatedData,
        actionRequired: true
      },
      channels: { desktop: true, extension: true, email: false }
    });
  }

  async sendErrorNotification(userId, errorType, errorMessage, errorCode) {
    return await this.createNotification({
      userId,
      type: 'error_occurred',
      title: 'Error Occurred',
      message: errorMessage,
      priority: 'urgent',
      relatedData: { 
        errorCode,
        errorType
      },
      channels: { desktop: true, extension: true, email: false }
    });
  }

  async sendBillingEntryCreatedNotification(userId, billingData) {
    return await this.createNotification({
      userId,
      type: 'billing_entry_created',
      title: 'Billing Entry Created',
      message: `Billable time logged: ${billingData.duration} for ${billingData.amount}`,
      priority: 'medium',
      relatedData: billingData,
      channels: { desktop: true, extension: true, email: false }
    });
  }

  async sendTokenRefreshNeededNotification(userId) {
    return await this.createNotification({
      userId,
      type: 'token_refresh_needed',
      title: 'Session Expiring',
      message: 'Your session will expire soon. Please refresh to continue.',
      priority: 'high',
      relatedData: { 
        actionRequired: true,
        actionUrl: '/auth/refresh'
      },
      channels: { desktop: true, extension: true, email: false }
    });
  }

  async sendAssistantContextSavedNotification(userId) {
    return await this.createNotification({
      userId,
      type: 'assistant_context_saved',
      title: 'Assistant Context Saved',
      message: 'Your conversation history and preferences have been saved.',
      priority: 'low',
      relatedData: {},
      channels: { desktop: false, extension: true, email: false }
    });
  }

  // Get notifications for a user
  async getUserNotifications(userId, { 
    limit = 50, 
    offset = 0, 
    status = null, 
    type = null,
    unreadOnly = false 
  } = {}) {
    try {
      const query = { userId };
      
      if (status) query.status = status;
      if (type) query.type = type;
      if (unreadOnly) query.status = { $in: ['pending', 'delivered'] };

      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset)
        .lean();

      const total = await Notification.countDocuments(query);
      const unreadCount = await Notification.countDocuments({
        userId,
        status: { $in: ['pending', 'delivered'] }
      });

      return {
        success: true,
        notifications,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        },
        unreadCount
      };
    } catch (error) {
      console.error('Get user notifications error:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOne({ 
        notificationId, 
        userId 
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      await notification.markAsRead();

      return { success: true };
    } catch (error) {
      console.error('Mark notification as read error:', error);
      throw error;
    }
  }

  // Dismiss notification
  async dismissNotification(notificationId, userId) {
    try {
      const notification = await Notification.findOne({ 
        notificationId, 
        userId 
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      await notification.dismiss();

      return { success: true };
    } catch (error) {
      console.error('Dismiss notification error:', error);
      throw error;
    }
  }

  // Add notification to retry queue
  addToRetryQueue(notification) {
    this.retryQueue.push({
      notificationId: notification.notificationId,
      retryAt: notification.nextRetryAt
    });
  }

  // Process retry queue
  startRetryProcessor() {
    setInterval(async () => {
      const now = new Date();
      const retryItems = this.retryQueue.filter(item => item.retryAt <= now);

      for (const item of retryItems) {
        try {
          const notification = await Notification.findOne({
            notificationId: item.notificationId
          });

          if (notification && notification.status === 'pending') {
            await this.deliverNotification(notification);
          }

          // Remove from retry queue
          const index = this.retryQueue.findIndex(
            queued => queued.notificationId === item.notificationId
          );
          if (index > -1) {
            this.retryQueue.splice(index, 1);
          }
        } catch (error) {
          console.error('Retry notification delivery error:', error);
        }
      }
    }, 30000); // Check every 30 seconds
  }

  // Clean up expired notifications
  async cleanupExpiredNotifications() {
    try {
      const result = await Notification.deleteMany({
        expiresAt: { $lt: new Date() }
      });

      console.log(`Cleaned up ${result.deletedCount} expired notifications`);
      return result.deletedCount;
    } catch (error) {
      console.error('Cleanup expired notifications error:', error);
      throw error;
    }
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;