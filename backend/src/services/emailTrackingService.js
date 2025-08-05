import { log } from '../utils/logger.js';
import { generateSummary, cleanEmailContent, suggestClientMatter } from './gptService.js';
import { logTimeEntry, findClientByEmail } from './clioService.js';
import { sendEmail, trackAndSendEmail, parseEmailContent } from './gmailService.js';
import EmailSession from '../models/EmailSession.js';
import User from '../models/User.js';
import notificationService from './notificationService.js';
import crypto from 'crypto';

// Add error handling for missing services
const safeGenerateSummary = async (content, timeSpent, preferences) => {
  try {
    return await generateSummary(content, timeSpent, preferences);
  } catch (error) {
    console.error('❌ generateSummary failed:', error);
    // Return fallback summary
    return {
      summary: 'Email correspondence requiring legal analysis and professional communication.',
      metadata: {
        wordCount: content.split(/\s+/).length,
        sentenceCount: content.split(/[.!?]+/).length,
        timeSpent,
        hours: (timeSpent / 3600).toFixed(2),
        activityType: 'Email correspondence',
        tone: 'formal',
        model: 'fallback'
      }
    };
  }
};

const safeSuggestClientMatter = async (recipients, content) => {
  try {
    return await suggestClientMatter(recipients, content);
  } catch (error) {
    console.error('❌ suggestClientMatter failed:', error);
    // Return fallback suggestions
    return {
      suggestedEmails: recipients,
      suggestedMatter: 'General correspondence',
      confidence: 0.5,
      reasoning: 'Fallback due to error',
      model: 'fallback'
    };
  }
};

// Legacy support - store active email sessions in memory for backward compatibility
const activeSessions = new Map();

// Generate unique session ID
const generateSessionId = (userId) => {
  return `${userId}_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
};

// Start tracking email composition with enhanced backend persistence
export const startEmailTracking = async (userId, emailData) => {
  try {
    const sessionId = generateSessionId(userId);
    
    // Create database session
    const emailSession = new EmailSession({
      sessionId,
      userId,
      emailData: {
        to: Array.isArray(emailData.to) ? emailData.to : [emailData.to],
        cc: emailData.cc || [],
        bcc: emailData.bcc || [],
        subject: emailData.subject || '',
        content: emailData.content || '',
        from: emailData.from || '',
        gmailDraftId: emailData.gmailDraftId,
        gmailMessageId: emailData.gmailMessageId,
        gmailThreadId: emailData.gmailThreadId
      },
      startTime: new Date(),
      status: 'active'
    });

    await emailSession.save();
    await emailSession.addActivity('start', { initialEmailData: emailData });

    // Legacy support - maintain in-memory session
    const legacySession = {
      userId,
      startTime: Date.now(),
      emailData,
      isActive: true,
      timeSpent: 0,
      lastActivity: Date.now()
    };
    activeSessions.set(sessionId, legacySession);

    // Send notification
    try {
      await notificationService.sendTrackingStartedNotification(
        userId, 
        emailData, 
        sessionId
      );
    } catch (notificationError) {
      console.error('Notification error:', notificationError);
      // Don't fail the tracking start if notification fails
    }

    log(`Started email tracking for session: ${sessionId}`);
    
    return {
      sessionId,
      startTime: emailSession.startTime.getTime(),
      dbSessionId: emailSession._id
    };
  } catch (error) {
    console.error('Error starting email tracking:', error);
    throw error;
  }
};

// Update session activity with enhanced tracking
export const updateSessionActivity = async (sessionId, activityData = {}) => {
  try {
    // Update database session
    const emailSession = await EmailSession.findOne({ sessionId });
    if (emailSession) {
      await emailSession.addActivity('content_change', activityData);

      // Update typing statistics if provided
      if (activityData.charactersTyped) {
        emailSession.typingStats.charactersTyped += activityData.charactersTyped;
      }
      if (activityData.wordsTyped) {
        emailSession.typingStats.wordsTyped += activityData.wordsTyped;
      }
      if (activityData.deletions) {
        emailSession.typingStats.deletions += activityData.deletions;
      }

      await emailSession.save();
    }

    // Legacy support - update in-memory session
    const session = activeSessions.get(sessionId);
    if (session && session.isActive) {
      const now = Date.now();
      session.timeSpent += now - session.lastActivity;
      session.lastActivity = now;
      log(`Updated session activity: ${sessionId}, total time: ${session.timeSpent}ms`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating session activity:', error);
    throw error;
  }
};

// Pause session tracking
export const pauseEmailTracking = async (sessionId, reason = 'user_pause') => {
  try {
    const emailSession = await EmailSession.findOne({ sessionId });
    if (emailSession) {
      await emailSession.addActivity('pause', { reason });
      emailSession.status = 'paused';
      await emailSession.save();
    }

    // Legacy support
    const session = activeSessions.get(sessionId);
    if (session) {
      session.isActive = false;
    }

    log(`Paused email tracking for session: ${sessionId}`);
    return { success: true, sessionId };
  } catch (error) {
    console.error('Error pausing email tracking:', error);
    throw error;
  }
};

// Resume session tracking
export const resumeEmailTracking = async (sessionId) => {
  try {
    const emailSession = await EmailSession.findOne({ sessionId });
    if (emailSession) {
      await emailSession.addActivity('resume');
      emailSession.status = 'active';
      await emailSession.save();
    }

    // Legacy support
    const session = activeSessions.get(sessionId);
    if (session) {
      session.isActive = true;
      session.lastActivity = Date.now();
    }

    log(`Resumed email tracking for session: ${sessionId}`);
    return { success: true, sessionId };
  } catch (error) {
    console.error('Error resuming email tracking:', error);
    throw error;
  }
};

// Stop tracking and generate billing summary with enhanced persistence
export const stopEmailTracking = async (sessionId, finalEmailContent, sendData = null) => {
  try {
    // Get database session
    const emailSession = await EmailSession.findOne({ sessionId });
    const legacySession = activeSessions.get(sessionId);

    if (!emailSession && !legacySession) {
      console.log('⚠️ Session not found:', sessionId);
      // Return a default result instead of throwing
      return {
        sessionId,
        timeSpent: 0,
        billingSummary: {
          summary: 'Email correspondence completed.',
          metadata: {
            wordCount: 0,
            sentenceCount: 0,
            timeSpent: 0,
            hours: '0.00',
            activityType: 'Email correspondence',
            tone: 'formal',
            model: 'fallback'
          },
          suggestions: {
            suggestedEmails: [],
            suggestedMatter: 'General correspondence',
            confidence: 0.5,
            reasoning: 'No session data available'
          }
        }
      };
    }

    const userId = emailSession?.userId || legacySession?.userId;
    let timeSpentMs = 0;
    let emailData = {};

    if (emailSession) {
      // Update final email content
      if (finalEmailContent) {
        emailSession.emailData.content = finalEmailContent;
      }

      // Mark as completed and calculate duration
      emailSession.status = sendData ? 'sent' : 'completed';
      emailSession.endTime = new Date();
      emailSession.calculateDuration();
      timeSpentMs = emailSession.totalDuration * 1000;
      emailData = emailSession.emailData;

      // Add final activity
      await emailSession.addActivity(sendData ? 'send' : 'stop', {
        finalContent: finalEmailContent,
        sendData
      });

      await emailSession.save();
    } else {
      // Legacy fallback
      timeSpentMs = legacySession.timeSpent;
      emailData = legacySession.emailData;
    }

    // Get user preferences for summary generation
    const user = await User.findById(userId);
    const preferences = user?.aiPreferences || {};

    // Generate content for analysis
    const emailContent = finalEmailContent || emailData.content || '';
    const recipients = Array.isArray(emailData.to) ? emailData.to : [emailData.to];
    const timeSpentSeconds = Math.round(timeSpentMs / 1000);

    // Generate AI summary and suggestions
    const [summaryResult, suggestionsResult] = await Promise.all([
      safeGenerateSummary(emailContent, timeSpentSeconds, preferences),
      safeSuggestClientMatter(recipients, emailContent)
    ]);

    // Update database session with summary
    if (emailSession) {
      emailSession.summary = {
        generatedSummary: summaryResult.summary,
        keyPoints: summaryResult.keyPoints || [],
        actionItems: summaryResult.actionItems || [],
        confidence: summaryResult.confidence || 0.8
      };

      emailSession.aiAssistance.summaryGenerated = true;
      emailSession.aiAssistance.totalAIInteractions += 1;

      await emailSession.save();
    }

    const billingSummary = {
      summary: summaryResult.summary,
      metadata: {
        ...summaryResult.metadata,
        sessionId,
        timeSpent: timeSpentSeconds,
        hours: (timeSpentSeconds / 3600).toFixed(2),
        recipients: recipients,
        subject: emailData.subject || ''
      },
      suggestions: suggestionsResult
    };

    // Send notifications
    try {
      await notificationService.sendTrackingStoppedNotification(
        userId,
        emailData,
        sessionId,
        timeSpentSeconds
      );

      if (billingSummary.summary) {
        await notificationService.sendSummaryGeneratedNotification(
          userId,
          { id: sessionId, summary: billingSummary.summary },
          sessionId
        );
      }
    } catch (notificationError) {
      console.error('Notification error:', notificationError);
    }

    // Clean up legacy session
    activeSessions.delete(sessionId);

    log(`Stopped email tracking for session: ${sessionId}, time spent: ${timeSpentSeconds}s`);

    return {
      sessionId,
      timeSpent: timeSpentSeconds,
      billingSummary,
      emailSessionId: emailSession?._id
    };
  } catch (error) {
    console.error('❌ Error in stopEmailTracking:', error);
    
    // Clean up on error
    activeSessions.delete(sessionId);
    
    // Return fallback result to prevent frontend errors
    return {
      sessionId,
      timeSpent: 0,
      billingSummary: {
        summary: 'Email tracking completed with errors. Please review manually.',
        metadata: {
          wordCount: 0,
          sentenceCount: 0,
          timeSpent: 0,
          hours: '0.00',
          activityType: 'Email correspondence',
          tone: 'formal',
          error: error.message
        },
        suggestions: {
          suggestedEmails: [],
          suggestedMatter: 'Manual review required',
          confidence: 0,
          reasoning: 'Error occurred during processing'
        }
      }
    };
  }
};

// Enhanced email sending with tracking integration
export const sendEmailAndLogTime = async (sessionId, emailData, billingData) => {
  try {
    const emailSession = await EmailSession.findOne({ sessionId });
    if (!emailSession) {
      throw new Error('Email session not found');
    }

    // Update session with final email data
    Object.assign(emailSession.emailData, emailData);
    emailSession.status = 'sent';
    
    // Update billing information
    if (billingData) {
      emailSession.billingInfo = {
        ...emailSession.billingInfo,
        ...billingData,
        isBillable: true
      };
      emailSession.calculateBillableAmount();
    }

    await emailSession.addActivity('send', { 
      finalEmailData: emailData,
      billingData 
    });

    // Send the email
    let sendResult;
    try {
      sendResult = await trackAndSendEmail(emailSession.userId, emailData);
      
      // Update with Gmail IDs
      if (sendResult.messageId) {
        emailSession.emailData.gmailMessageId = sendResult.messageId;
      }
      if (sendResult.threadId) {
        emailSession.emailData.gmailThreadId = sendResult.threadId;
      }
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      emailSession.status = 'completed'; // Mark as completed instead of sent
      
      // Send error notification
      await notificationService.sendErrorNotification(
        emailSession.userId,
        'email_send_error',
        'Failed to send email. Please try again.',
        'EMAIL_SEND_FAILED'
      );
      
      throw emailError;
    }

    await emailSession.save();

    // Log time entry if Clio data provided
    if (billingData && billingData.clioData) {
      try {
        const timeEntry = await logTimeEntry(emailSession.userId, {
          ...billingData.clioData,
          description: emailSession.summary?.generatedSummary || 'Email correspondence',
          timeSpent: emailSession.totalDuration
        });

        if (timeEntry.success) {
          emailSession.billingInfo.hasBeenLogged = true;
          emailSession.billingInfo.clioTimeEntryId = timeEntry.id;
          await emailSession.save();

          // Send success notification
          await notificationService.sendBillingEntryCreatedNotification(
            emailSession.userId,
            {
              duration: `${Math.round(emailSession.totalDuration / 60)} minutes`,
              amount: `$${emailSession.billingInfo.amount || 0}`,
              client: billingData.clioData.client || 'Unknown'
            }
          );
        }
      } catch (billingError) {
        console.error('Billing error:', billingError);
        // Don't fail the email send if billing fails
      }
    }

    return {
      success: true,
      sessionId,
      emailSent: !!sendResult,
      messageId: sendResult?.messageId,
      threadId: sendResult?.threadId,
      billingLogged: emailSession.billingInfo?.hasBeenLogged || false
    };
  } catch (error) {
    console.error('Error in sendEmailAndLogTime:', error);
    throw error;
  }
};

// Get all active sessions for monitoring
export const getActiveSessions = async (userId = null) => {
  try {
    const query = { status: 'active' };
    if (userId) {
      query.userId = userId;
    }

    const sessions = await EmailSession.find(query)
      .sort({ startTime: -1 })
      .lean();

    // Include legacy sessions for backward compatibility
    const legacySessions = Array.from(activeSessions.entries())
      .filter(([sessionId, session]) => !userId || session.userId === userId)
      .map(([sessionId, session]) => ({
        sessionId,
        userId: session.userId,
        startTime: new Date(session.startTime),
        emailData: session.emailData,
        timeSpent: Math.round(session.timeSpent / 1000),
        isLegacy: true
      }));

    return {
      success: true,
      sessions: [...sessions, ...legacySessions],
      count: sessions.length + legacySessions.length
    };
  } catch (error) {
    console.error('Error getting active sessions:', error);
    throw error;
  }
};

// Get session details
export const getSessionDetails = async (sessionId) => {
  try {
    const emailSession = await EmailSession.findOne({ sessionId });
    
    if (emailSession) {
      return {
        success: true,
        session: emailSession,
        isDatabase: true
      };
    }

    // Fallback to legacy session
    const legacySession = activeSessions.get(sessionId);
    if (legacySession) {
      return {
        success: true,
        session: {
          sessionId,
          ...legacySession,
          timeSpent: Math.round(legacySession.timeSpent / 1000)
        },
        isLegacy: true
      };
    }

    return {
      success: false,
      error: 'Session not found'
    };
  } catch (error) {
    console.error('Error getting session details:', error);
    throw error;
  }
};

// Get user's email tracking history
export const getUserEmailHistory = async (userId, { limit = 50, offset = 0, status = null } = {}) => {
  try {
    const query = { userId };
    if (status) {
      query.status = status;
    }

    const sessions = await EmailSession.find(query)
      .sort({ startTime: -1 })
      .limit(limit)
      .skip(offset)
      .lean();

    const total = await EmailSession.countDocuments(query);

    return {
      success: true,
      sessions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    };
  } catch (error) {
    console.error('Error getting user email history:', error);
    throw error;
  }
};

// Clean up abandoned sessions (older than 24 hours and still active)
export const cleanupAbandonedSessions = async () => {
  try {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

    const result = await EmailSession.updateMany(
      {
        status: 'active',
        startTime: { $lt: cutoffTime }
      },
      {
        status: 'abandoned',
        endTime: new Date()
      }
    );

    console.log(`Cleaned up ${result.modifiedCount} abandoned sessions`);
    return result.modifiedCount;
  } catch (error) {
    console.error('Error cleaning up abandoned sessions:', error);
    throw error;
  }
};

// Export legacy functions for backward compatibility
export { activeSessions }; 