import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getRecentEmailsWithAnalysis, parseEmailContent } from '../services/gmailService.js';
import { generateSummary, suggestClientMatter } from '../services/gptService.js';
import { log } from '../utils/logger.js';

const router = express.Router();

// Get recent emails with time analysis
router.get('/recent', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { limit = 10 } = req.query;
    
    const emails = await getRecentEmailsWithAnalysis(userId, parseInt(limit));
    
    res.json({
      success: true,
      emails
    });
    
  } catch (error) {
    log('Get recent emails error:', error);
    res.status(500).json({ error: 'Failed to get recent emails' });
  }
});

// Analyze specific email for billing suggestions
router.post('/analyze', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { emailContent, estimatedTime } = req.body;
    
    if (!emailContent) {
      return res.status(400).json({ error: 'Email content is required' });
    }
    
    // Generate AI summary
    const summary = await generateSummary(emailContent, estimatedTime || 0, {
      emailTone: 'formal'
    });
    
    // Get client/matter suggestions
    const suggestions = await suggestClientMatter([], emailContent);
    
    // Calculate billing recommendations
    const wordCount = emailContent.split(/\s+/).length;
    const estimatedReadingTime = Math.ceil(wordCount / 200);
    const suggestedBillingTime = Math.max(estimatedReadingTime, estimatedTime || 0);
    
    res.json({
      success: true,
      analysis: {
        summary: summary.summary,
        metadata: summary.metadata,
        suggestions,
        billingRecommendations: {
          estimatedReadingTime,
          suggestedBillingTime,
          wordCount,
          complexity: wordCount > 500 ? 'high' : wordCount > 200 ? 'medium' : 'low'
        }
      }
    });
    
  } catch (error) {
    log('Analyze email error:', error);
    res.status(500).json({ error: 'Failed to analyze email' });
  }
});

// Get auto-billing suggestions for recent emails
router.get('/auto-billing-suggestions', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { limit = 5 } = req.query;
    
    const emails = await getRecentEmailsWithAnalysis(userId, parseInt(limit));
    const suggestions = [];
    
    for (const email of emails) {
      const { analysis } = email;
      
      // Only suggest billing for emails that took time to process
      if (analysis.estimatedReadingTime > 1 || analysis.hasUrgency) {
        const summary = await generateSummary(analysis.body, analysis.estimatedReadingTime * 60, {
          emailTone: 'formal'
        });
        
        const clientSuggestions = await suggestClientMatter([analysis.from], analysis.body);
        
        suggestions.push({
          threadId: email.threadId,
          messageId: email.messageId,
          subject: analysis.subject,
          from: analysis.from,
          estimatedTime: analysis.estimatedReadingTime,
          urgency: analysis.hasUrgency,
          summary: summary.summary,
          suggestions: clientSuggestions,
          recommendedBilling: {
            time: analysis.estimatedReadingTime,
            description: summary.summary,
            matter: clientSuggestions.suggestedMatter,
            confidence: clientSuggestions.confidence
          }
        });
      }
    }
    
    res.json({
      success: true,
      suggestions
    });
    
  } catch (error) {
    log('Get auto-billing suggestions error:', error);
    res.status(500).json({ error: 'Failed to get auto-billing suggestions' });
  }
});

// Generate email template suggestions
router.post('/templates', authenticateToken, async (req, res) => {
  try {
    const { emailType, context, recipient } = req.body;
    
    if (!emailType) {
      return res.status(400).json({ error: 'Email type is required' });
    }
    
    // Generate template based on type
    const templates = {
      'follow-up': {
        subject: `Re: ${context || 'Previous Communication'}`,
        content: `Dear ${recipient || 'Client'},

Thank you for your recent communication. I wanted to follow up on our discussion and provide you with an update.

${context ? `Regarding ${context}, I have reviewed the matter and would like to discuss the next steps.` : 'I have reviewed the matter and would like to discuss the next steps.'}

Please let me know if you have any questions or if there's anything else you'd like me to address.

Best regards,
[Your Name]`
      },
      'status-update': {
        subject: `Status Update: ${context || 'Your Matter'}`,
        content: `Dear ${recipient || 'Client'},

I hope this email finds you well. I wanted to provide you with a status update on your matter.

${context ? `Regarding ${context}, here is the current status:` : 'Here is the current status:'}

• [Current Status Point 1]
• [Current Status Point 2]
• [Next Steps]

I will continue to keep you informed of any developments. Please don't hesitate to reach out if you have any questions.

Best regards,
[Your Name]`
      },
      'meeting-request': {
        subject: `Meeting Request: ${context || 'Important Discussion'}`,
        content: `Dear ${recipient || 'Client'},

I hope you're doing well. I would like to schedule a meeting to discuss ${context || 'an important matter'}.

I am available on the following dates and times:
• [Date/Time Option 1]
• [Date/Time Option 2]
• [Date/Time Option 3]

Please let me know which time works best for you, or if you'd prefer a different time.

Best regards,
[Your Name]`
      }
    };
    
    const template = templates[emailType] || templates['follow-up'];
    
    res.json({
      success: true,
      template
    });
    
  } catch (error) {
    log('Generate email template error:', error);
    res.status(500).json({ error: 'Failed to generate email template' });
  }
});

export default router; 