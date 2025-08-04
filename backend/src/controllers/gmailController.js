import * as gmailService from '../services/gmailService.js';
import * as aiService from '../services/gptService.js';
import Email from '../models/Email.js';
import User from '../models/User.js';
import { log } from '../utils/logger.js';
import { generateSummary } from '../services/gptService.js';

// Fetch Gmail threads
export const fetchThreads = async (req, res) => {
  try {
    const { userId } = req.user;
    const { maxResults = 10 } = req.query;
    
    const threads = await gmailService.fetchThreads(userId, parseInt(maxResults));
    
    res.json({ 
      success: true, 
      threads,
      count: threads.length 
    });
    
  } catch (error) {
    log('Fetch threads error:', error);
    res.status(500).json({ error: 'Failed to fetch Gmail threads' });
  }
};

// Process email and generate summary
export const processEmail = async (req, res) => {
  try {
    const { userId } = req.user;
    const { threadId, messageId, typingTime, content } = req.body;
    
    if (!threadId || !messageId || !typingTime || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Get thread details from Gmail
    const threadDetails = await gmailService.getThreadDetails(userId, threadId);
    
    // Extract participants
    const participants = threadDetails.messages?.[0]?.payload?.headers
      ?.filter(header => ['to', 'from', 'cc'].includes(header.name.toLowerCase()))
      ?.map(header => header.value)
      ?.flat() || [];
    
    // Clean email content
    const cleanedContent = aiService.cleanEmailContent(content);
    
    // Generate summary
    const user = await User.findById(userId);
    const summaryResult = await aiService.generateSummary(
      cleanedContent, 
      typingTime, 
      user?.preferences
    );
    
    // Save email to database
    const email = new Email({
      threadId,
      user: userId,
      participants,
      subject: threadDetails.snippet || 'Email communication',
      content: cleanedContent,
      typingTime
    });
    
    await email.save();
    
    // Generate suggestions
    const suggestions = await aiService.suggestClientMatter(participants, cleanedContent);
    
    res.json({
      success: true,
      email: {
        id: email._id,
        threadId,
        participants,
        subject: email.subject,
        typingTime,
        summary: summaryResult.summary,
        metadata: summaryResult.metadata
      },
      suggestions
    });
    
  } catch (error) {
    log('Process email error:', error);
    res.status(500).json({ error: 'Failed to process email' });
  }
};

// Get email content
export const getEmailContent = async (req, res) => {
  try {
    const { userId } = req.user;
    const { messageId } = req.params;
    
    const emailContent = await gmailService.getEmailContent(userId, messageId);
    
    res.json({
      success: true,
      email: emailContent
    });
    
  } catch (error) {
    log('Get email content error:', error);
    res.status(500).json({ error: 'Failed to get email content' });
  }
};

// Get Gmail profile
export const getGmailProfile = async (req, res) => {
  try {
    const { userId } = req.user;
    
    const profile = await gmailService.getGmailProfile(userId);
    
    res.json({
      success: true,
      profile
    });
    
  } catch (error) {
    log('Get Gmail profile error:', error);
    res.status(500).json({ error: 'Failed to get Gmail profile' });
  }
};

// Get billable emails
export const getBillableEmails = async (req, res) => {
  try {
    const { userId } = req.user;
    const { maxResults = 20 } = req.query;
    
    const billableEmails = await gmailService.getBillableEmails(userId, parseInt(maxResults));
    
    res.json({
      success: true,
      emails: billableEmails,
      count: billableEmails.length,
      totalBillableTime: billableEmails.reduce((sum, email) => sum + email.billableTime, 0)
    });
    
  } catch (error) {
    log('Get billable emails error:', error);
    res.status(500).json({ error: 'Failed to get billable emails' });
  }
};

// Track and send email with billing
export const trackAndSendEmail = async (req, res) => {
  try {
    const { userId } = req.user;
    const { emailData, compositionTime } = req.body;
    
    if (!emailData || !compositionTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    console.log('📧 Processing tracked email send:', {
      userId,
      compositionTime,
      subject: emailData.subject
    });
    
    // Track and send email via Gmail
    const sendResult = await gmailService.trackAndSendEmail(userId, emailData, compositionTime);
    
    // Generate AI summary if billable
    let billingSummary = null;
    if (sendResult.isBillable) {
      try {
        const summaryResult = await generateSummary(
          emailData.content,
          compositionTime,
          { emailTone: 'formal' },
          'gemini'
        );
        
        billingSummary = {
          summary: summaryResult.summary,
          metadata: summaryResult.metadata,
          billableCategory: sendResult.billableCategory,
          confidence: sendResult.confidence,
          compositionTime
        };
        
        console.log('🤖 Generated billing summary:', billingSummary.summary);
      } catch (summaryError) {
        console.error('❌ Summary generation failed:', summaryError);
        // Continue without summary
      }
    }
    
    // Save to database
    const email = new Email({
      threadId: sendResult.emailSent.threadId,
      user: userId,
      participants: [emailData.to],
      subject: emailData.subject,
      content: emailData.content,
      typingTime: compositionTime,
      isBillable: sendResult.isBillable,
      billableCategory: sendResult.billableCategory,
      confidence: sendResult.confidence
    });
    
    await email.save();
    
    res.json({
      success: true,
      emailSent: sendResult.emailSent,
      isBillable: sendResult.isBillable,
      billableCategory: sendResult.billableCategory,
      confidence: sendResult.confidence,
      compositionTime,
      billingSummary,
      analysis: sendResult.analysis
    });
    
  } catch (error) {
    log('Track and send email error:', error);
    res.status(500).json({ error: 'Failed to track and send email' });
  }
}; 