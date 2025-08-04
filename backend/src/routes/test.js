import express from 'express';
import { optionalAuth } from '../middleware/auth.js';
import { 
  startEmailTracking, 
  updateSessionActivity, 
  stopEmailTracking, 
  sendEmailAndLogTime,
  getActiveSessions 
} from '../services/emailTrackingService.js';
import { log } from '../utils/logger.js';

const router = express.Router();

// Test endpoint - optional authentication
router.post('/email-tracking/start', optionalAuth, async (req, res) => {
  try {
    console.log('📥 Received request:', {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body
    });
    
    const { to, subject, content } = req.body;
    
    console.log('📥 Parsed values:', { to, subject, content });
    
    // Validate input data
    if (!to || !subject) {
      console.error('❌ Missing required fields:', { to, subject });
      return res.status(400).json({ 
        error: 'Recipients and subject are required',
        received: { to, subject, content }
      });
    }
    
    // Ensure content is a string
    const safeContent = typeof content === 'string' ? content : String(content || '');
    
    const emailData = { 
      to: String(to), 
      subject: String(subject), 
      content: safeContent 
    };
    
    console.log('📤 Starting email tracking with data:', emailData);
    
    const result = await startEmailTracking('test_user_123', emailData);
    
    console.log('✅ Email tracking started successfully:', result);
    
    res.json({
      success: true,
      sessionId: result.sessionId,
      startTime: result.startTime
    });
    
  } catch (error) {
    console.error('❌ Test email tracking start error:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    log('Test email tracking start error:', error);
    
    // Send a more detailed error response
    res.status(500).json({ 
      error: 'Failed to start email tracking',
      details: error.message,
      name: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Test endpoint - optional authentication
router.post('/email-tracking/activity', optionalAuth, async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    
    updateSessionActivity(sessionId);
    
    res.json({ success: true });
    
  } catch (error) {
    log('Test email tracking activity error:', error);
    res.status(500).json({ error: 'Failed to update session activity' });
  }
});

// Test endpoint - optional authentication
router.post('/email-tracking/stop', optionalAuth, async (req, res) => {
  try {
    const { sessionId, finalContent } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    
    const result = await stopEmailTracking(sessionId, finalContent);
    
    res.json({
      success: true,
      timeSpent: result.timeSpent,
      billingSummary: result.billingSummary
    });
    
  } catch (error) {
    log('Test email tracking stop error:', error);
    res.status(500).json({ error: 'Failed to stop email tracking' });
  }
});

// Test endpoint - optional authentication
router.post('/email-tracking/send', optionalAuth, async (req, res) => {
  try {
    const { sessionId, emailData } = req.body;
    
    if (!sessionId || !emailData) {
      return res.status(400).json({ error: 'Session ID and email data are required' });
    }
    
    const result = await sendEmailAndLogTime('test_user_123', sessionId, emailData);
    
    res.json({
      success: true,
      emailSent: result.emailSent,
      timeLogged: result.timeLogged,
      billingSummary: result.billingSummary,
      timeSpent: result.timeSpent
    });
    
  } catch (error) {
    log('Test send email and log time error:', error);
    res.status(500).json({ error: 'Failed to send email and log time' });
  }
});

// Test endpoint - optional authentication
router.get('/email-tracking/sessions', optionalAuth, async (req, res) => {
  try {
    const sessions = getActiveSessions('test_user_123');
    
    res.json({
      success: true,
      sessions
    });
    
  } catch (error) {
    log('Test get active sessions error:', error);
    res.status(500).json({ error: 'Failed to get active sessions' });
  }
});

export default router; 