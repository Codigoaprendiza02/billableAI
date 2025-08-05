import { log } from '../utils/logger.js';
import { generateSummary, cleanEmailContent, suggestClientMatter } from './gptService.js';
import { logTimeEntry, findClientByEmail } from './clioService.js';
import { sendEmail, trackAndSendEmail, parseEmailContent } from './gmailService.js';

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

// Store active email sessions
const activeSessions = new Map();

// Start tracking email composition
export const startEmailTracking = (userId, emailData) => {
  const sessionId = `${userId}_${Date.now()}`;
  const session = {
    userId,
    startTime: Date.now(),
    emailData,
    isActive: true,
    timeSpent: 0,
    lastActivity: Date.now()
  };
  
  activeSessions.set(sessionId, session);
  log(`Started email tracking for session: ${sessionId}`);
  
  return {
    sessionId,
    startTime: session.startTime
  };
};

// Update session activity
export const updateSessionActivity = (sessionId) => {
  const session = activeSessions.get(sessionId);
  if (session && session.isActive) {
    const now = Date.now();
    session.timeSpent += now - session.lastActivity;
    session.lastActivity = now;
    log(`Updated session activity: ${sessionId}, total time: ${session.timeSpent}ms`);
  }
};

// Stop tracking and generate billing summary
export const stopEmailTracking = async (sessionId, finalEmailContent) => {
  try {
    const session = activeSessions.get(sessionId);
    if (!session) {
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
            suggestedEmails: 'unknown@example.com',
            suggestedMatter: 'General correspondence',
            confidence: 0.5,
            reasoning: 'Session not found',
            model: 'fallback'
          },
          timeSpent: 0,
          hours: '0.00'
        }
      };
    }
    
    // Calculate final time spent
    const now = Date.now();
    session.timeSpent += now - session.lastActivity;
    session.isActive = false;
    session.finalContent = finalEmailContent;
    
    log(`Stopped email tracking for session: ${sessionId}, total time: ${session.timeSpent}ms`);
    
    // Generate billing summary
    const billingSummary = await generateBillingSummary(session);
    
    return {
      sessionId,
      timeSpent: session.timeSpent,
      billingSummary
    };
  } catch (error) {
    console.error('❌ Stop email tracking error:', error);
    log('Stop email tracking error:', error);
    
    // Return a fallback result instead of throwing
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
          suggestedEmails: 'unknown@example.com',
          suggestedMatter: 'General correspondence',
          confidence: 0.5,
          reasoning: 'Error occurred',
          model: 'fallback'
        },
        timeSpent: 0,
        hours: '0.00'
      }
    };
  }
};

// Generate billing summary with AI
const generateBillingSummary = async (session) => {
  try {
    const { timeSpent, finalContent, emailData } = session;
    
    console.log('📝 Generating billing summary for session:', {
      timeSpent,
      contentLength: finalContent?.length || 0,
      emailData,
      finalContentType: typeof finalContent
    });
    
    // Ensure finalContent is a string
    const safeContent = typeof finalContent === 'string' ? finalContent : String(finalContent || '');
    const cleanedContent = cleanEmailContent(safeContent);
    
    console.log('🧹 Cleaned content length:', cleanedContent.length);
    
    // Generate summary using AI
    const summary = await safeGenerateSummary(cleanedContent, timeSpent, {
      emailTone: 'formal'
    });
    
    console.log('✅ Summary generated:', summary);
    
    // Get client/matter suggestions
    const recipients = emailData?.to ? 
      (Array.isArray(emailData.to) ? emailData.to : [emailData.to]) : 
      ['unknown@example.com'];
    console.log('📧 Recipients for suggestions:', recipients);
    
    const suggestions = await safeSuggestClientMatter(recipients, cleanedContent);
    
    console.log('✅ Suggestions generated:', suggestions);
    
    return {
      summary: summary.summary,
      metadata: summary.metadata,
      suggestions,
      timeSpent,
      hours: (timeSpent / 3600).toFixed(2)
    };
    
  } catch (error) {
    console.error('❌ Generate billing summary error:', error);
    console.error('❌ Error stack:', error.stack);
    log('Generate billing summary error:', error);
    
    // Return a fallback summary instead of throwing
    return {
      summary: 'Email correspondence regarding Email communication. Composed detailed email communication requiring legal analysis and professional correspondence.',
      metadata: {
        wordCount: 0,
        sentenceCount: 0,
        timeSpent: session.timeSpent || 0,
        hours: '0.00',
        activityType: 'Email correspondence',
        tone: 'formal',
        model: 'fallback'
      },
      suggestions: {
        suggestedEmails: session.emailData?.to || 'unknown@example.com',
        suggestedMatter: 'General correspondence',
        confidence: 0.5,
        reasoning: 'Fallback due to error',
        model: 'fallback'
      },
      timeSpent: session.timeSpent || 0,
      hours: '0.00'
    };
  }
};

// Send email and log time entry to Clio
export const sendEmailAndLogTime = async (userId, sessionId, emailData) => {
  try {
    console.log('📧 Starting send email and log time process with Gmail integration...');
    console.log('📧 Email data:', emailData);
    
    // Stop tracking and get billing summary
    const trackingResult = await stopEmailTracking(sessionId, emailData.content);
    console.log('✅ Tracking stopped, billing summary generated');
    
    // Analyze email content for billable keywords
    const emailAnalysis = parseEmailContent({
      headers: [
        { name: 'Subject', value: emailData.subject },
        { name: 'To', value: emailData.to }
      ],
      payload: {
        body: { data: Buffer.from(emailData.content).toString('base64') }
      }
    });
    
    console.log('📊 Email analysis:', {
      isBillable: emailAnalysis.isBillable,
      category: emailAnalysis.billableCategory,
      confidence: emailAnalysis.confidence,
      keywords: emailAnalysis.billableKeywords
    });
    
    // Send email via Gmail with tracking
    const gmailResult = await trackAndSendEmail(userId, emailData, trackingResult.timeSpent);
    console.log('✅ Email sent via Gmail:', gmailResult);
    
    // Generate AI summary if billable
    let billingSummary = trackingResult.billingSummary;
    if (emailAnalysis.isBillable && gmailResult.isBillable) {
      try {
        const aiSummary = await safeGenerateSummary(
          emailData.content,
          trackingResult.timeSpent,
          { emailTone: 'formal' }
        );
        
        billingSummary = {
          ...aiSummary,
          billableCategory: emailAnalysis.billableCategory,
          confidence: emailAnalysis.confidence,
          billableKeywords: emailAnalysis.billableKeywords,
          isBillable: true
        };
        
        console.log('🤖 AI billing summary generated for billable email');
      } catch (summaryError) {
        console.error('❌ AI summary generation failed:', summaryError);
        // Use fallback summary
      }
    }
    
    // Try to log time entry to Clio (only for billable emails)
    let clioResult = null;
    if (emailAnalysis.isBillable) {
      try {
        console.log('📊 Billing summary for time entry:', billingSummary);
        
        // Find client by email
        const recipients = Array.isArray(emailData.to) ? emailData.to : [emailData.to || ''];
        console.log('🔍 Looking for client with email:', recipients[0]);
        
        const client = await findClientByEmail(userId, recipients[0]);
        console.log('🔍 Client found:', client);
        
        if (client) {
          clioResult = await logTimeEntry(userId, {
            matterId: billingSummary.suggestions?.suggestedMatter || emailAnalysis.billableCategory,
            description: billingSummary.summary,
            duration: trackingResult.timeSpent,
            date: new Date().toISOString().split('T')[0]
          });
          console.log('✅ Time logged to Clio:', clioResult);
        } else {
          console.log('⚠️ No client found, skipping Clio time entry');
        }
      } catch (clioError) {
        console.error('❌ Clio time entry error:', clioError);
        log('Clio time entry error:', clioError);
        // Continue even if Clio fails
      }
    } else {
      console.log('📝 Non-billable email, skipping Clio time entry');
    }
    
    const result = {
      success: true,
      emailSent: gmailResult.emailSent,
      timeLogged: clioResult,
      billingSummary,
      timeSpent: trackingResult.timeSpent,
      isBillable: emailAnalysis.isBillable,
      billableCategory: emailAnalysis.billableCategory,
      confidence: emailAnalysis.confidence,
      analysis: gmailResult.analysis
    };
    
    console.log('✅ Send email and log time completed successfully:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Send email and log time error:', error);
    console.error('❌ Error stack:', error.stack);
    log('Send email and log time error:', error);
    
    // Return a fallback response instead of throwing
    return {
      success: false,
      error: error.message,
      fallback: true,
      emailSent: null,
      timeLogged: null,
      billingSummary: null,
      timeSpent: 0,
      isBillable: false,
      billableCategory: 'error',
      confidence: 0
    };
  }
};

// Get active sessions for user
export const getActiveSessions = (userId) => {
  const userSessions = [];
  for (const [sessionId, session] of activeSessions) {
    if (session.userId === userId && session.isActive) {
      userSessions.push({
        sessionId,
        startTime: session.startTime,
        timeSpent: session.timeSpent,
        lastActivity: session.lastActivity
      });
    }
  }
  return userSessions;
};

// Clean up old sessions
export const cleanupOldSessions = () => {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  for (const [sessionId, session] of activeSessions) {
    if (now - session.lastActivity > maxAge) {
      activeSessions.delete(sessionId);
      log(`Cleaned up old session: ${sessionId}`);
    }
  }
};

// Run cleanup every hour
setInterval(cleanupOldSessions, 60 * 60 * 1000); 