import axios from 'axios';
import { GEMINI_API_KEY } from '../config.js';
import { log } from '../utils/logger.js';

// Generate email summary using Gemini API or template-based approach
export const generateSummary = async (emailText, timeSpent, userPreferences = {}, model = 'gemini') => {
  try {
    const { emailTone = 'formal' } = userPreferences;
    
    console.log('📝 Generating summary with params:', {
      emailTextLength: emailText?.length || 0,
      timeSpent,
      emailTone,
      model,
      hasGeminiKey: !!GEMINI_API_KEY,
      geminiKeyValid: GEMINI_API_KEY && GEMINI_API_KEY !== 'your_gemini_api_key',
      geminiKeyValue: GEMINI_API_KEY ? `${GEMINI_API_KEY.substring(0, 10)}...` : 'undefined'
    });
    
    // If Gemini API is available and model is set to gemini, use it
    if (model === 'gemini' && GEMINI_API_KEY && GEMINI_API_KEY !== 'your_gemini_api_key') {
      console.log('🤖 Using Gemini API for summary generation');
      return await generateGeminiSummary(emailText, timeSpent, emailTone);
    }
    
    // Fallback to template-based approach
    console.log('📝 Using template-based summary (Gemini API not configured)');
    return await generateTemplateSummary(emailText, timeSpent, emailTone);
    
  } catch (error) {
    console.error('❌ Generate summary error:', error);
    console.error('❌ Error stack:', error.stack);
    log('Generate summary error:', error);
    // Fallback to template-based approach if Gemini fails
    return await generateTemplateSummary(emailText, timeSpent, userPreferences.emailTone || 'formal');
  }
};

// Generate summary using Gemini API with enhanced prompts
const generateGeminiSummary = async (emailText, timeSpent, emailTone) => {
  try {
    const hours = (timeSpent / 3600).toFixed(2);
    const minutes = Math.round(timeSpent / 60);
    
    const prompt = `Create a professional legal billing summary for this email:

Email: ${emailText}
Time: ${hours} hours (${minutes} minutes)

Write a 1-2 sentence summary for legal billing. Include time spent. Focus on legal work performed.

Summary:`;

    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent',
      {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 500
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY
        }
      }
    );

    console.log('🤖 Gemini API Response:', JSON.stringify(response.data, null, 2));
    
    const summary = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log('📝 Extracted summary:', summary);
    
    // Extract metadata
    const wordCount = emailText.split(/\s+/).length;
    const sentenceCount = emailText.split(/[.!?]+/).length;
    
    return {
      summary: summary.trim(),
      metadata: {
        wordCount,
        sentenceCount,
        timeSpent,
        hours,
        minutes,
        activityType: 'AI-generated summary',
        tone: emailTone,
        model: 'gemini'
      }
    };
    
  } catch (error) {
    log('Gemini API error:', error.response?.data || error.message);
    throw new Error('Gemini API request failed');
  }
};

// Generate summary using template-based approach (fallback)
const generateTemplateSummary = async (emailText, timeSpent, emailTone) => {
  try {
    console.log('📝 Generating template summary with:', {
      emailTextLength: emailText?.length || 0,
      timeSpent,
      emailTone
    });
    
    // Ensure emailText is a string
    const safeEmailText = typeof emailText === 'string' ? emailText : String(emailText || '');
    
    // Extract key information from email
    const lines = safeEmailText.split('\n');
    const subject = lines.find(line => line.toLowerCase().includes('subject:'))?.replace(/subject:\s*/i, '') || 'Email communication';
    
    // Count words and sentences
    const wordCount = safeEmailText.split(/\s+/).length;
    const sentenceCount = safeEmailText.split(/[.!?]+/).length;
    
    // Determine activity type based on content with enhanced detection
    let activityType = 'Email correspondence';
    const contentLower = safeEmailText.toLowerCase();
    
    if (contentLower.includes('contract') || contentLower.includes('agreement')) {
      activityType = 'Contract review and correspondence';
    } else if (contentLower.includes('legal advice') || contentLower.includes('counsel')) {
      activityType = 'Legal advice and counsel';
    } else if (contentLower.includes('negotiation') || contentLower.includes('settlement')) {
      activityType = 'Negotiation and settlement discussions';
    } else if (contentLower.includes('research') || contentLower.includes('analysis')) {
      activityType = 'Legal research and analysis';
    } else if (contentLower.includes('litigation') || contentLower.includes('court')) {
      activityType = 'Litigation support and court correspondence';
    } else if (contentLower.includes('corporate') || contentLower.includes('business')) {
      activityType = 'Corporate legal matters';
    } else if (contentLower.includes('due diligence') || contentLower.includes('compliance')) {
      activityType = 'Due diligence and compliance review';
    } else if (contentLower.includes('document') || contentLower.includes('draft')) {
      activityType = 'Document preparation and drafting';
    }
    
    // Calculate time in hours and minutes
    const hours = (timeSpent / 3600).toFixed(2);
    const minutes = Math.round(timeSpent / 60);
    
    // Generate summary based on tone
    let summary;
    if (emailTone === 'formal') {
      summary = `${activityType} regarding ${subject}. Composed detailed email communication (${wordCount} words, ${sentenceCount} sentences) requiring legal analysis and professional correspondence.`;
    } else {
      summary = `Email correspondence about ${subject}. Wrote ${wordCount}-word email with ${sentenceCount} sentences covering ${activityType.toLowerCase()}.`;
    }
    
    // Add time information
    summary += ` Time spent: ${hours} hours (${minutes} minutes).`;
    
    console.log('✅ Template summary generated:', { wordCount, sentenceCount, activityType, hours, minutes });
    
    return {
      summary,
      metadata: {
        wordCount,
        sentenceCount,
        timeSpent,
        hours,
        minutes,
        activityType,
        tone: emailTone,
        model: 'template'
      }
    };
    
  } catch (error) {
    console.error('❌ Template summary error:', error);
    console.error('❌ Error stack:', error.stack);
    log('Template summary error:', error);
    throw new Error('Failed to generate template summary');
  }
};

// Generate client/matter suggestions using Gemini API with enhanced prompts
export const suggestClientMatter = async (emailRecipients, emailContent, useGemini = true) => {
  try {
    // Extract email addresses
    const emailAddresses = emailRecipients.filter(recipient => 
      recipient && recipient.includes('@') && !recipient.includes('noreply') && !recipient.includes('no-reply')
    );
    
    // If Gemini API is available and enabled, use it
    if (useGemini && GEMINI_API_KEY && GEMINI_API_KEY !== 'your_gemini_api_key') {
      console.log('🤖 Using Gemini API for suggestions');
      return await generateGeminiSuggestions(emailAddresses, emailContent);
    }
    
    // Fallback to simple keyword matching
    console.log('📝 Using template-based suggestions (Gemini API not configured)');
    return await generateTemplateSuggestions(emailAddresses, emailContent);
    
  } catch (error) {
    log('Suggest client/matter error:', error);
    // Fallback to template suggestions if Gemini fails
    return await generateTemplateSuggestions(emailRecipients || [], emailContent);
  }
};

// Generate suggestions using Gemini API with enhanced prompts
const generateGeminiSuggestions = async (emailAddresses, emailContent) => {
  try {
    const prompt = `You are a legal practice management assistant. Analyze this email content and suggest the most likely client and matter type for time billing.

Email Recipients: ${emailAddresses.join(', ')}
Email Content:
${emailContent}

Please provide suggestions in this JSON format:
{
  "suggestedEmails": ["most_likely_client_email"],
  "suggestedMatter": "brief_matter_description",
  "confidence": 0.85,
  "reasoning": "brief explanation",
  "matterType": "litigation|corporate|contract|real_estate|family|criminal|other"
}

Focus on:
1. Identifying the primary client from email addresses
2. Determining the type of legal work being performed
3. Providing a brief, professional matter description
4. Assessing confidence based on content clarity

Matter types should be one of: litigation, corporate, contract, real_estate, family, criminal, or other.`;

    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent',
      {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 800
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY
        }
      }
    );

    const responseText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Try to parse JSON response
    try {
      const suggestions = JSON.parse(responseText);
      return {
        suggestedEmails: suggestions.suggestedEmails || emailAddresses,
        suggestedMatter: suggestions.suggestedMatter || 'General correspondence',
        confidence: suggestions.confidence || 0.7,
        reasoning: suggestions.reasoning || 'AI analysis',
        matterType: suggestions.matterType || 'other',
        model: 'gemini'
      };
    } catch (parseError) {
      console.error('❌ Failed to parse Gemini JSON response:', parseError);
      console.log('📝 Raw response:', responseText);
      // If JSON parsing fails, return template suggestions
      return await generateTemplateSuggestions(emailAddresses, emailContent);
    }
    
  } catch (error) {
    log('Gemini suggestions error:', error.response?.data || error.message);
    throw new Error('Gemini suggestions failed');
  }
};

// Generate suggestions using template-based approach with enhanced logic
const generateTemplateSuggestions = async (emailAddresses, emailContent) => {
  try {
    // Enhanced keyword matching for matter suggestions
    const keywords = emailContent.toLowerCase();
    let suggestedMatter = 'General correspondence';
    let matterType = 'other';
    let confidence = 0.7;
    
    if (keywords.includes('contract') || keywords.includes('agreement')) {
      suggestedMatter = 'Contract review and negotiation';
      matterType = 'contract';
      confidence = 0.85;
    } else if (keywords.includes('litigation') || keywords.includes('lawsuit') || keywords.includes('court')) {
      suggestedMatter = 'Litigation support';
      matterType = 'litigation';
      confidence = 0.9;
    } else if (keywords.includes('corporate') || keywords.includes('business') || keywords.includes('company')) {
      suggestedMatter = 'Corporate legal matters';
      matterType = 'corporate';
      confidence = 0.8;
    } else if (keywords.includes('real estate') || keywords.includes('property') || keywords.includes('land')) {
      suggestedMatter = 'Real estate legal matters';
      matterType = 'real_estate';
      confidence = 0.85;
    } else if (keywords.includes('family') || keywords.includes('divorce') || keywords.includes('custody')) {
      suggestedMatter = 'Family law matters';
      matterType = 'family';
      confidence = 0.8;
    } else if (keywords.includes('criminal') || keywords.includes('arrest') || keywords.includes('charge')) {
      suggestedMatter = 'Criminal defense';
      matterType = 'criminal';
      confidence = 0.9;
    } else if (keywords.includes('merger') || keywords.includes('acquisition')) {
      suggestedMatter = 'Merger and acquisition matters';
      matterType = 'corporate';
      confidence = 0.9;
    } else if (keywords.includes('due diligence') || keywords.includes('compliance')) {
      suggestedMatter = 'Due diligence and compliance review';
      matterType = 'corporate';
      confidence = 0.85;
    }
    
    return {
      suggestedEmails: emailAddresses,
      suggestedMatter,
      confidence,
      reasoning: 'Keyword-based analysis',
      matterType,
      model: 'template'
    };
    
  } catch (error) {
    log('Template suggestions error:', error);
    throw new Error('Failed to generate template suggestions');
  }
};

// Generate enhanced billing entry with AI analysis
export const generateBillingEntry = async (emailData, timeSpent, userPreferences = {}) => {
  try {
    console.log('📝 Generating enhanced billing entry:', {
      emailData,
      timeSpent,
      userPreferences
    });
    
    // Generate summary
    const summary = await generateSummary(emailData.content, timeSpent, userPreferences);
    
    // Get client/matter suggestions
    const recipients = Array.isArray(emailData.to) ? emailData.to : [emailData.to || ''];
    const suggestions = await suggestClientMatter(recipients, emailData.content);
    
    // Calculate billing metrics
    const hours = (timeSpent / 3600).toFixed(2);
    const minutes = Math.round(timeSpent / 60);
    const wordCount = emailData.content.split(/\s+/).length;
    
    return {
      summary: summary.summary,
      metadata: {
        ...summary.metadata,
        hours,
        minutes,
        wordCount
      },
      suggestions,
      billingData: {
        timeSpent,
        hours,
        minutes,
        isBillable: true,
        category: suggestions.matterType || 'other',
        confidence: suggestions.confidence
      }
    };
    
  } catch (error) {
    console.error('❌ Generate billing entry error:', error);
    log('Generate billing entry error:', error);
    
    // Return fallback billing entry
    return {
      summary: 'Email correspondence requiring legal analysis and professional communication.',
      metadata: {
        wordCount: emailData.content.split(/\s+/).length,
        timeSpent,
        hours: (timeSpent / 3600).toFixed(2),
        minutes: Math.round(timeSpent / 60),
        activityType: 'Email correspondence',
        tone: 'formal',
        model: 'fallback'
      },
      suggestions: {
        suggestedEmails: emailData.to || 'unknown@example.com',
        suggestedMatter: 'General correspondence',
        confidence: 0.5,
        reasoning: 'Fallback due to error',
        matterType: 'other',
        model: 'fallback'
      },
      billingData: {
        timeSpent,
        hours: (timeSpent / 3600).toFixed(2),
        minutes: Math.round(timeSpent / 60),
        isBillable: true,
        category: 'other',
        confidence: 0.5
      }
    };
  }
};

// Validate and clean email content
export const cleanEmailContent = (emailText) => {
  try {
    // Remove email headers and signatures
    let cleaned = emailText
      .replace(/From:.*?\n/g, '')
      .replace(/To:.*?\n/g, '')
      .replace(/Subject:.*?\n/g, '')
      .replace(/Date:.*?\n/g, '')
      .replace(/Sent:.*?\n/g, '')
      .replace(/Cc:.*?\n/g, '')
      .replace(/Bcc:.*?\n/g, '')
      .replace(/--\s*\n.*$/s, '') // Remove signature
      .trim();
    
    // Remove excessive whitespace
    cleaned = cleaned.replace(/\n\s*\n/g, '\n\n');
    
    return cleaned;
  } catch (error) {
    log('Clean email content error:', error);
    return emailText; // Return original if cleaning fails
  }
}; 