import * as aiService from '../services/gptService.js';
import { log } from '../utils/logger.js';

// Generate email summary
export const summarize = async (req, res) => {
  try {
    const { emailText, timeSpent, userPreferences, model = 'gemini' } = req.body;
    
    if (!emailText || !timeSpent) {
      return res.status(400).json({ error: 'Email text and time spent are required' });
    }
    
    const summaryResult = await aiService.generateSummary(emailText, timeSpent, userPreferences, model);
    
    res.json({
      success: true,
      summary: summaryResult.summary,
      metadata: summaryResult.metadata
    });
    
  } catch (error) {
    log('AI summarize error:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
};

// Generate client/matter suggestions
export const suggest = async (req, res) => {
  try {
    const { emailRecipients, emailContent, useGemini = true } = req.body;
    
    if (!emailRecipients || !emailContent) {
      return res.status(400).json({ error: 'Email recipients and content are required' });
    }
    
    const suggestions = await aiService.suggestClientMatter(emailRecipients, emailContent, useGemini);
    
    res.json({
      success: true,
      suggestions
    });
    
  } catch (error) {
    log('AI suggest error:', error);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
};

// Clean email content
export const cleanContent = async (req, res) => {
  try {
    const { emailText } = req.body;
    
    if (!emailText) {
      return res.status(400).json({ error: 'Email text is required' });
    }
    
    const cleanedContent = aiService.cleanEmailContent(emailText);
    
    res.json({
      success: true,
      cleanedContent
    });
    
  } catch (error) {
    log('Clean content error:', error);
    res.status(500).json({ error: 'Failed to clean email content' });
  }
}; 