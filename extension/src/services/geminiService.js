// Gemini API Service for BillableAI Extension
// Handles AI-powered summary generation using Google's Gemini 2.5 Pro API

import configService from './configService.js';

class GeminiService {
  constructor() {
    this.apiKey = null;
    // Updated to use Gemini 2.5 Pro model
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';
    this.isInitialized = false;
    this.modelName = 'Gemini 2.5 Pro (Flash)';
  }

  async initialize() {
    try {
      console.log('🎯 BillableAI: Initializing Gemini 2.5 Pro service...');
      
      // Test configuration import first
      console.log('🎯 BillableAI: Testing configuration import...');
      const testResult = await configService.testConfigImport();
      console.log('🎯 BillableAI: Configuration test result:', testResult);
      
      // Get API key from backend using ConfigService
      try {
        console.log('🎯 BillableAI: Attempting to fetch Gemini API key from backend...');
        const aiConfig = await configService.getAIServiceConfig();
        console.log('🎯 BillableAI: Received AI config from backend:', {
          hasGeminiApiKey: !!aiConfig.geminiApiKey,
          geminiApiKey: aiConfig.geminiApiKey ? `${aiConfig.geminiApiKey.substring(0, 10)}...` : 'not set',
          keyLength: aiConfig.geminiApiKey?.length || 0
        });
        
        if (aiConfig.geminiApiKey && aiConfig.geminiApiKey !== 'your_gemini_api_key_here' && aiConfig.geminiApiKey.startsWith('AIzaSy')) {
          this.apiKey = aiConfig.geminiApiKey;
          console.log('✅ BillableAI: Gemini 2.5 Pro API key loaded from backend via ConfigService');
        } else {
          console.log('❌ BillableAI: Backend API key validation failed:', {
            hasKey: !!aiConfig.geminiApiKey,
            isPlaceholder: aiConfig.geminiApiKey === 'your_gemini_api_key_here',
            startsWithAIzaSy: aiConfig.geminiApiKey?.startsWith('AIzaSy'),
            keyLength: aiConfig.geminiApiKey?.length
          });
          throw new Error('Backend API key not configured or invalid');
        }
      } catch (backendError) {
        console.log('⚠️ BillableAI: Backend API key not available, trying localStorage:', backendError.message);
        
        // Fallback to localStorage
        const storedKey = localStorage.getItem('gemini_api_key');
        console.log('🎯 BillableAI: localStorage key check:', {
          hasStoredKey: !!storedKey,
          keyLength: storedKey?.length,
          startsWithAIzaSy: storedKey?.startsWith('AIzaSy')
        });
        
        if (storedKey && storedKey.trim() !== '' && storedKey.startsWith('AIzaSy')) {
          this.apiKey = storedKey;
          console.log('✅ BillableAI: Gemini 2.5 Pro API key loaded from localStorage');
        } else {
          // Don't use internal fallback - require proper API key
          console.log('❌ BillableAI: No valid Gemini API key found');
          console.log('📝 Please configure your Gemini API key in backend/env.local');
          console.log('📝 Get your API key from: https://aistudio.google.com/app/apikey');
          throw new Error('Gemini API key not configured. Please set up your API key in backend/env.local');
        }
      }
      
      this.isInitialized = true;
      console.log('✅ BillableAI: Gemini 2.5 Pro service initialized successfully with API key:', this.apiKey ? `${this.apiKey.substring(0, 10)}...` : 'none');
    } catch (error) {
      console.log('❌ BillableAI: Error initializing Gemini 2.5 Pro service', error);
      // Don't set fallback key - require proper configuration
      this.isInitialized = false;
      throw error;
    }
  }

  isReady() {
    const ready = this.isInitialized && this.apiKey;
    console.log('🎯 BillableAI: Gemini 2.5 Pro service ready check:', ready);
    return ready;
  }

  // API Key Management Methods
  setApiKey(key) {
    this.apiKey = key;
    localStorage.setItem('gemini_api_key', key);
    console.log('🎯 BillableAI: Gemini 2.5 Pro API key set');
  }

  getApiKey() {
    return this.apiKey;
  }

  clearApiKey() {
    this.apiKey = null;
    localStorage.removeItem('gemini_api_key');
    console.log('🎯 BillableAI: Gemini 2.5 Pro API key cleared');
  }

  // Get API key from storage (for compatibility)
  getApiKeyFromStorage() {
    return localStorage.getItem('gemini_api_key') || '';
  }

  // Store API key (for compatibility)
  storeApiKey(key) {
    this.setApiKey(key);
  }

  async generateBillableSummary(emailData, timeSpent) {
    try {
      if (!this.isReady()) {
        console.log('❌ BillableAI: Gemini 2.5 Pro service not ready');
        throw new Error('Gemini 2.5 Pro service not initialized. Please configure your API key.');
      }

      const timeInMinutes = Math.round(timeSpent / 60000);
      const content = emailData.body || emailData.content || 'No content available';
      const subject = emailData.subject || 'No subject';
      const to = emailData.to || 'No recipient';
      const cc = emailData.cc || 'None';
      const bcc = emailData.bcc || 'None';

      const prompt = `You are a professional billing specialist. Create a comprehensive billable summary for this email communication.
        
Email Details:
- Subject: ${subject}
- To: ${to}
- CC: ${cc}
- BCC: ${bcc}
- Time Spent: ${timeInMinutes} minutes
- Content: ${content}

Generate a professional billing summary that includes:

1. **Service Description**: Detailed description of professional services rendered
2. **Time Breakdown**: Itemized time allocation (drafting, review, finalization)
3. **Rate Structure**: Professional rate calculation with justification
4. **Billing Details**: Line-item breakdown of charges
5. **Total Calculation**: Clear total amount with tax considerations if applicable
6. **Professional Language**: Formal billing language suitable for client presentation
7. **Payment Terms**: Standard payment terms and conditions

Format as a formal billing document with professional formatting and clear sections.`;

      const response = await this.makeApiCall(prompt);
      return response;
    } catch (error) {
      console.log('❌ BillableAI: Error generating billable summary with Gemini 2.5 Pro', error);
      throw error;
    }
  }

  async generateEmailAnalysis(emailData) {
    try {
      if (!this.isReady()) {
        console.log('❌ BillableAI: Gemini 2.5 Pro service not ready');
        throw new Error('Gemini 2.5 Pro service not initialized. Please configure your API key.');
      }

      const content = emailData.body || emailData.content || 'No content available';
      const subject = emailData.subject || 'No subject';

      const prompt = `You are an expert business communication analyst. Analyze this email and provide comprehensive insights.

Subject: ${subject}
Content: ${content}

Please provide a detailed analysis including:

1. **Content Analysis**: Key points, main message, and communication objectives
2. **Professional Assessment**: Tone, professionalism, and business appropriateness
3. **Legal/Business Implications**: Potential legal considerations or business impact
4. **Quality Assessment**: Writing quality, clarity, and effectiveness
5. **Improvement Suggestions**: Specific recommendations for enhancement
6. **Billable Time Estimation**: Professional time estimation for similar communications
7. **Risk Assessment**: Any potential risks or concerns in the communication

Format as a professional business analysis with clear sections and actionable insights.`;

      const response = await this.makeApiCall(prompt);
      return response;
    } catch (error) {
      console.log('❌ BillableAI: Error generating email analysis with Gemini 2.5 Pro', error);
      throw error;
    }
  }

  async generateClientBillingSummary(emailData, timeSpent) {
    try {
      if (!this.isReady()) {
        console.log('❌ BillableAI: Gemini 2.5 Pro service not ready');
        throw new Error('Gemini 2.5 Pro service not initialized. Please configure your API key.');
      }

      const timeInMinutes = Math.round(timeSpent / 60000);
      const content = emailData.body || emailData.content || 'No content available';
      const subject = emailData.subject || 'No subject';
      const to = emailData.to || 'No recipient';
      const cc = emailData.cc || 'None';
      const bcc = emailData.bcc || 'None';
      
      const prompt = `You are a professional billing specialist. Create a comprehensive client billing summary for this email communication.
        
        Email Details:
- Subject: ${subject}
- To: ${to}
- CC: ${cc}
- BCC: ${bcc}
- Time Spent: ${timeInMinutes} minutes
- Content: ${content}

Generate a professional billing summary that includes:

1. Service Description: Detailed description of professional services rendered
2. Time Breakdown: Itemized time allocation (drafting, review, finalization)
3. Rate Structure: Professional rate calculation with justification
4. Billing Details: Line-item breakdown of charges
5. Total Calculation: Clear total amount with tax considerations if applicable
6. Professional Language: Formal billing language suitable for client presentation
7. Payment Terms: Standard payment terms and conditions

Format as a formal billing document with professional formatting and clear sections.`;

      const response = await this.makeApiCall(prompt);
      return response;
    } catch (error) {
      console.log('❌ BillableAI: Error generating client billing summary with Gemini 2.5 Pro', error);
      throw error;
    }
  }

  async generateGeneralResponse(userMessage, emailData = null, timeSpent = 0) {
    try {
      if (!this.isReady()) {
        console.log('❌ BillableAI: Gemini 2.5 Pro service not ready');
        throw new Error('Gemini 2.5 Pro service not initialized. Please configure your API key.');
      }

      const timeInMinutes = Math.round(timeSpent / 60000);
      const emailContext = emailData ? `
Email Context:
- Subject: ${emailData.subject || 'No subject'}
- To: ${emailData.to || 'No recipient'}
- CC: ${emailData.cc || 'None'}
- BCC: ${emailData.bcc || 'None'}
- Time Spent: ${timeInMinutes} minutes
- Content: ${emailData.body || emailData.content || 'No content'}
` : '';

      const prompt = `You are BillableAI Assistant, an expert AI assistant for email analysis and billable time tracking. You help professionals with email composition, analysis, billing, and time tracking.

User Message: ${userMessage}
${emailContext}

Please provide a helpful, professional response that:

1. Addresses the user's specific request - Whether they're asking for summaries, analysis, suggestions, or general help
2. Provides actionable insights - Give specific, practical advice and recommendations
3. Maintains professional tone - Use appropriate business language
4. Includes relevant context - Reference email data and time tracking when applicable
5. Offers additional value - Suggest related services or improvements

If the user is asking about:
- Summaries: Provide detailed billable summaries with time breakdown
- Analysis: Offer comprehensive email analysis with professional insights
- Suggestions: Give specific improvement recommendations
- General help: Explain your capabilities and how you can assist

Format your response professionally with clear sections, bullet points where appropriate, and actionable insights.`;

      const response = await this.makeApiCall(prompt);
      return response;
    } catch (error) {
      console.log('❌ BillableAI: Error generating general response with Gemini 2.5 Pro', error);
      throw error;
    }
  }

  async makeApiCall(prompt) {
    // Ensure we have a valid API key
    if (!this.apiKey || this.apiKey === 'your_gemini_api_key_here' || !this.apiKey.startsWith('AIzaSy')) {
      throw new Error('Invalid or missing Gemini API key. Please configure your API key in backend/env.local');
    }

    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log('🎯 BillableAI: Gemini 2.5 Pro API error response:', errorText);
        throw new Error(`Gemini 2.5 Pro API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const generatedText = data.candidates[0].content.parts[0].text;
        console.log('✅ BillableAI: Gemini 2.5 Pro response generated successfully');
        return generatedText;
      } else {
        console.log('❌ BillableAI: Invalid response format from Gemini 2.5 Pro API:', data);
        throw new Error('Invalid response format from Gemini 2.5 Pro API');
      }
    } catch (error) {
      console.log('❌ BillableAI: Gemini 2.5 Pro API call failed:', error);
      throw error;
    }
  }

  generateFallbackSummary(emailData, timeSpent) {
    const timeInMinutes = Math.round(timeSpent / 60000);
    const subject = emailData.subject || 'No subject';
    const recipient = emailData.to || 'No recipient';
    const content = emailData.body || emailData.content || 'No content';
    
    return `📧 **Professional Billable Summary (Fallback Mode)**

**Email Details:**
- Subject: ${subject}
- Recipient: ${recipient}
- Time Spent: ${timeInMinutes} minutes
- Content Length: ${content.length} characters

**Professional Services Rendered:**
Email composition and client communication services including content drafting, review, and finalization.

**Time Breakdown:**
- Composition Time: ${timeInMinutes} minutes
- Professional Rate: Standard hourly rate
- Billable Amount: ${timeInMinutes} minutes

**Summary:**
This professional email communication required ${timeInMinutes} minutes of dedicated time for composition, review, and finalization. The content demonstrates professional client communication standards and represents billable professional services.

**Total Billable Time: ${timeInMinutes} minutes**

*Note: This is a fallback response. For enhanced analysis, please configure your Gemini 2.5 Pro API key in settings.*`;
  }

  generateFallbackEmailAnalysis(emailData) {
    const content = emailData.body || emailData.content || 'No content';
    const subject = emailData.subject || 'No subject';
    
    return `📊 **Email Analysis (Fallback Mode)**

**Subject:** ${subject}
**Content Length:** ${content.length} characters

**Key Points:**
- Professional communication
- Client-focused content
- Clear messaging structure

**Professional Assessment:**
This email demonstrates appropriate professional communication standards suitable for client interactions.

**Estimated Billable Time:** 5-10 minutes (standard email composition)

**Recommendations:**
- Maintain professional tone
- Ensure clarity in communication
- Consider follow-up actions if needed

*Note: This is a fallback response. For enhanced analysis, please configure your Gemini 2.5 Pro API key in settings.*`;
  }

  generateFallbackClientBilling(emailData, timeSpent) {
    const timeInMinutes = Math.round(timeSpent / 60000);
    const subject = emailData.subject || 'No subject';
    
    return `💰 **Client Billing Summary (Fallback Mode)**

**Service Description:**
Professional email communication services including composition, review, and client correspondence.

**Time Breakdown:**
- Email Composition: ${timeInMinutes} minutes
- Professional Services: Client communication
- Rate: Standard hourly rate

**Billing Details:**
- Time Spent: ${timeInMinutes} minutes
- Service Type: Professional communication
- Total Billable: ${timeInMinutes} minutes

**Professional Summary:**
This client communication represents ${timeInMinutes} minutes of professional services rendered.

*Note: This is a fallback response. For enhanced billing analysis, please configure your Gemini 2.5 Pro API key in settings.*`;
  }

  getModelInfo() {
    return {
      name: this.modelName,
      version: '2.5 Pro (Flash)',
      capabilities: [
        'Enhanced text generation',
        'Professional analysis',
        'Billing summaries',
        'Email content analysis'
      ]
    };
  }

  async testConnection() {
    try {
      if (!this.isReady()) {
        return { success: false, message: 'Service not initialized' };
      }

      const testPrompt = 'Generate a brief test response to verify Gemini 2.5 Pro integration.';
      const response = await this.makeApiCall(testPrompt);
      
      if (response && response.length > 0) {
        return { success: true, message: 'Gemini 2.5 Pro connection successful' };
      } else {
        return { success: false, message: 'Empty response from Gemini 2.5 Pro' };
      }
    } catch (error) {
      return { success: false, message: `Connection failed: ${error.message}` };
    }
  }
}

export default GeminiService;