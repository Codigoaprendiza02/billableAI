import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { testAuth } from '../middleware/testAuth.js';
import { 
  startEmailTracking, 
  updateSessionActivity, 
  stopEmailTracking, 
  sendEmailAndLogTime,
  getActiveSessions 
} from '../services/emailTrackingService.js';
import { 
  trackEmailComposition,
  updateEmailDraft,
  sendEmailDraft,
  getEmailCompositionData,
  monitorEmailActivity
} from '../services/gmailService.js';
import { 
  generateBillingEntry 
} from '../services/gptService.js';
import { 
  completeOneClickBilling 
} from '../services/clioService.js';
import { log } from '../utils/logger.js';

const router = express.Router();

// Start tracking email composition with Gmail API
router.post('/start-composition', testAuth, async (req, res) => {
  try {
    const { userId } = req.user;
    const { to, subject, content, from } = req.body;
    
    // Provide default values for empty fields during initial tracking
    const emailData = { 
      to: to || 'draft@example.com', 
      subject: subject || 'Draft Email', 
      content: content || '', 
      from: from || 'user@gmail.com' 
    };
    
    // Start Gmail composition tracking
    const compositionResult = await trackEmailComposition(userId, emailData);
    
    // Start local session tracking
    const sessionResult = await startEmailTracking(userId, emailData);
    
    res.json({
      success: true,
      sessionId: sessionResult.sessionId,
      draftId: compositionResult.draftId,
      messageId: compositionResult.messageId,
      threadId: compositionResult.threadId,
      startTime: compositionResult.startTime
    });
    
  } catch (error) {
    log('Start email composition tracking error:', error);
    res.status(500).json({ error: 'Failed to start email composition tracking' });
  }
});

// Update email composition with new content
router.post('/update-composition', testAuth, async (req, res) => {
  try {
    const { userId } = req.user;
    const { draftId, to, subject, content, from } = req.body;
    
    if (!draftId || !to || !subject) {
      return res.status(400).json({ error: 'Draft ID, recipients, and subject are required' });
    }
    
    const emailData = { to, subject, content: content || '', from };
    
    // Update Gmail draft
    const updateResult = await updateEmailDraft(userId, draftId, emailData);
    
    res.json({
      success: true,
      draftUpdated: true,
      messageId: updateResult.message?.id,
      threadId: updateResult.message?.threadId
    });
    
  } catch (error) {
    log('Update email composition error:', error);
    res.status(500).json({ error: 'Failed to update email composition' });
  }
});

// Monitor email activity (called periodically from extension)
router.post('/activity', testAuth, async (req, res) => {
  try {
    const { sessionId, draftId, isTyping, content, timeSpent } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    
    // Update local session activity
    updateSessionActivity(sessionId);
    
    // Monitor Gmail activity if draftId is provided
    if (draftId) {
      await monitorEmailActivity(req.user.userId, draftId, {
        isTyping,
        content,
        timeSpent
      });
    }
    
    res.json({ success: true });
    
  } catch (error) {
    log('Update session activity error:', error);
    res.status(500).json({ error: 'Failed to update session activity' });
  }
});

// Stop tracking and generate billing summary
router.post('/stop-composition', testAuth, async (req, res) => {
  try {
    const { sessionId, draftId, finalContent, sendEmail = false } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    
    // Stop local tracking
    const trackingResult = await stopEmailTracking(sessionId, finalContent);
    
    // Generate enhanced billing entry
    const billingEntry = await generateBillingEntry(
      { content: finalContent, to: '', subject: '' },
      trackingResult.timeSpent,
      { emailTone: 'formal' }
    );
    
    let emailSent = null;
    
    // Send email if requested
    if (sendEmail && draftId) {
      try {
        emailSent = await sendEmailDraft(req.user.userId, draftId, trackingResult.timeSpent);
      } catch (emailError) {
        console.error('❌ Send email error:', emailError);
        // Continue without sending email
      }
    }
    
    res.json({
      success: true,
      timeSpent: trackingResult.timeSpent,
      billingEntry,
      emailSent,
      sessionId
    });
    
  } catch (error) {
    log('Stop email composition tracking error:', error);
    res.status(500).json({ error: 'Failed to stop email composition tracking' });
  }
});

// One-click billing: Send email and push to Clio
router.post('/one-click-billing', testAuth, async (req, res) => {
  try {
    const { userId } = req.user;
    const { sessionId, draftId, emailData, sendEmail = true } = req.body;
    
    if (!sessionId || !emailData) {
      return res.status(400).json({ error: 'Session ID and email data are required' });
    }
    
    // Stop tracking and get billing data
    const trackingResult = await stopEmailTracking(sessionId, emailData.content);
    
    // Generate enhanced billing entry
    const billingEntry = await generateBillingEntry(
      emailData,
      trackingResult.timeSpent,
      { emailTone: 'formal' }
    );
    
    let emailSent = null;
    
    // Send email if requested
    if (sendEmail && draftId) {
      try {
        emailSent = await sendEmailDraft(userId, draftId, trackingResult.timeSpent);
      } catch (emailError) {
        console.error('❌ Send email error:', emailError);
      }
    }
    
    // Complete one-click billing workflow
    const billingResult = await completeOneClickBilling(userId, emailData, {
      ...billingEntry,
      timeSpent: trackingResult.timeSpent
    });
    
    res.json({
      success: true,
      timeSpent: trackingResult.timeSpent,
      billingEntry,
      emailSent,
      billingResult,
      sessionId
    });
    
  } catch (error) {
    log('One-click billing error:', error);
    res.status(500).json({ error: 'Failed to complete one-click billing' });
  }
});

// Get composition data for a draft
router.get('/composition/:draftId', testAuth, async (req, res) => {
  try {
    const { draftId } = req.params;
    const { userId } = req.user;
    
    const compositionData = await getEmailCompositionData(userId, draftId);
    
    res.json({
      success: true,
      compositionData
    });
    
  } catch (error) {
    log('Get composition data error:', error);
    res.status(500).json({ error: 'Failed to get composition data' });
  }
});

// Start tracking email composition
router.post('/start', testAuth, async (req, res) => {
  try {
    const { userId } = req.user;
    const { to, subject, content } = req.body;
    
    // Provide default values for empty fields during initial tracking
    const emailData = { 
      to: to || 'draft@example.com', 
      subject: subject || 'Draft Email', 
      content: content || '' 
    };
    
    const result = await startEmailTracking(userId, emailData);
    
    res.json({
      success: true,
      sessionId: result.sessionId,
      startTime: result.startTime
    });
    
  } catch (error) {
    log('Start email tracking error:', error);
    res.status(500).json({ error: 'Failed to start email tracking' });
  }
});

// Stop tracking and get billing summary
router.post('/stop', testAuth, async (req, res) => {
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
    log('Stop email tracking error:', error);
    res.status(500).json({ error: 'Failed to stop email tracking' });
  }
});

// Send email and log time entry
router.post('/send', testAuth, async (req, res) => {
  try {
    const { userId } = req.user;
    const { sessionId, emailData } = req.body;
    
    if (!sessionId || !emailData) {
      return res.status(400).json({ error: 'Session ID and email data are required' });
    }
    
    const result = await sendEmailAndLogTime(userId, sessionId, emailData);
    
    res.json({
      success: true,
      emailSent: result.emailSent,
      timeLogged: result.timeLogged,
      billingSummary: result.billingSummary,
      timeSpent: result.timeSpent
    });
    
  } catch (error) {
    log('Send email and log time error:', error);
    res.status(500).json({ error: 'Failed to send email and log time' });
  }
});

// Get active sessions for user
router.get('/sessions', testAuth, async (req, res) => {
  try {
    const { userId } = req.user;
    const sessions = getActiveSessions(userId);
    
    res.json({
      success: true,
      sessions
    });
    
  } catch (error) {
    log('Get active sessions error:', error);
    res.status(500).json({ error: 'Failed to get active sessions' });
  }
});

export default router; 