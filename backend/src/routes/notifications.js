import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import notificationService from '../services/notificationService.js';

const router = express.Router();

// Get user notifications
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      limit = 50, 
      offset = 0, 
      status = null, 
      type = null,
      unreadOnly = false 
    } = req.query;

    const result = await notificationService.getUserNotifications(userId, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      status,
      type,
      unreadOnly: unreadOnly === 'true'
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create notification (admin/system use)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      type,
      title,
      message,
      priority = 'medium',
      relatedData = {},
      channels = { desktop: true, extension: true, email: false },
      expiresIn = 24 * 60 * 60 * 1000 // 24 hours
    } = req.body;

    if (!type || !title || !message) {
      return res.status(400).json({
        success: false,
        error: 'Type, title, and message are required'
      });
    }

    const result = await notificationService.createNotification({
      userId,
      type,
      title,
      message,
      priority,
      relatedData,
      channels,
      expiresIn
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Mark notification as read
router.put('/:notificationId/read', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { notificationId } = req.params;

    const result = await notificationService.markAsRead(notificationId, userId);
    res.status(200).json(result);
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Dismiss notification
router.put('/:notificationId/dismiss', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { notificationId } = req.params;

    const result = await notificationService.dismissNotification(notificationId, userId);
    res.status(200).json(result);
  } catch (error) {
    console.error('Dismiss notification error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Mark all notifications as read
router.put('/mark-all-read', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get all unread notifications and mark them as read
    const notifications = await notificationService.getUserNotifications(userId, {
      status: 'delivered',
      limit: 1000
    });

    const markPromises = notifications.notifications.map(notification =>
      notificationService.markAsRead(notification.notificationId, userId)
    );

    await Promise.all(markPromises);

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      count: markPromises.length
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get notification statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const [total, unread, byType] = await Promise.all([
      notificationService.getUserNotifications(userId, { limit: 1 }),
      notificationService.getUserNotifications(userId, { unreadOnly: true, limit: 1 }),
      // Get counts by type (simplified for now)
      notificationService.getUserNotifications(userId, { limit: 100 })
    ]);

    const typeStats = {};
    byType.notifications.forEach(notification => {
      typeStats[notification.type] = (typeStats[notification.type] || 0) + 1;
    });

    res.status(200).json({
      success: true,
      stats: {
        total: total.pagination.total,
        unread: unread.pagination.total,
        byType: typeStats
      }
    });
  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;