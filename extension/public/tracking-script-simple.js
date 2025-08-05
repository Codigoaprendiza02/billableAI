// BillableAI Simple Tracking Script
// Simplified version that loads all modules synchronously

(function() {
  console.log('🎯 BillableAI: Simple tracking script starting...');
  
  // Notify background script that content script is loaded
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ type: 'CONTENT_SCRIPT_LOADED' }, (response) => {
        if (response && response.success) {
          console.log('🎯 BillableAI: Background script confirmed content script loaded');
        } else {
          console.log('🎯 BillableAI: Background script not responding');
        }
      });
    } else {
      console.log('🎯 BillableAI: chrome.runtime not available - extension may not be loaded');
    }
  } catch (error) {
    console.log('🎯 BillableAI: Could not communicate with background script:', error.message);
  }

  // Global state for email tracking
  window.billableAIState = {
    isTracking: false,
    startTime: null,
    sessionId: null,
    currentEmail: {
      to: '',
      subject: '',
      content: '',
      draftId: null,
      messageId: null
    },
    typingTimeout: null,
    accumulatedTime: 0,
    isPaused: false,
    lastActivityTime: null,
    gmailApiReady: false,
    accessToken: null
  };

  // Safe localStorage wrapper to prevent errors
  function safeLocalStorageSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('🎯 BillableAI: localStorage error:', error);
      return false;
    }
  }

  function safeLocalStorageGet(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('🎯 BillableAI: localStorage error:', error);
      return defaultValue;
    }
  }

  // Function to update tracking status using only localStorage
  function updateTrackingStatus() {
    try {
      const currentTime = window.billableAIState.isTracking && window.billableAIState.startTime 
        ? Date.now() - window.billableAIState.startTime + window.billableAIState.accumulatedTime
        : window.billableAIState.accumulatedTime;
      
      const status = {
        isTracking: window.billableAIState.isTracking,
        currentTime: currentTime,
        isPaused: window.billableAIState.isPaused,
        lastUpdated: Date.now(),
        lastActivityTime: window.billableAIState.lastActivityTime
      };
      
      // Store in localStorage only
      safeLocalStorageSet('billableai_trackingStatus', status);
      console.log('🎯 BillableAI: Tracking status updated');
    } catch (error) {
      console.error('🎯 BillableAI: Error updating tracking status:', error);
    }
  }

  // Initialize Gmail API access with proper scopes
  async function initializeGmailApi() {
    try {
      // Get stored OAuth tokens
      const tokens = safeLocalStorageGet('billableai_oauth_tokens', {});
      if (tokens.accessToken) {
        window.billableAIState.accessToken = tokens.accessToken;
        window.billableAIState.gmailApiReady = true;
        console.log('🎯 BillableAI: Gmail API initialized with stored token');
        return true;
      }
      
      console.log('🎯 BillableAI: No Gmail API token available');
      return false;
    } catch (error) {
      console.error('🎯 BillableAI: Error initializing Gmail API:', error);
      return false;
    }
  }

  // Test Gmail API connection
  async function testGmailApi() {
    try {
      const tokens = JSON.parse(localStorage.getItem('billableai_oauth_tokens') || '{}');
      if (!tokens.accessToken) {
        throw new Error('No Gmail API token available');
      }

      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Gmail API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('🎯 BillableAI: Gmail API test successful');
      return true;
    } catch (error) {
      console.error('🎯 BillableAI: Gmail API test failed:', error);
      return false;
    }
  }

  // Generate test summary for testing purposes
  async function generateTestSummary(emailData, timeSpent) {
    try {
      console.log('🎯 BillableAI: Generating test summary for:', emailData);
      
      const minutes = Math.floor(timeSpent / 1000 / 60);
      const seconds = Math.floor((timeSpent / 1000) % 60);
      const timeFormatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;

      const geminiApiKey = localStorage.getItem('billableai_gemini_api_key');
      if (!geminiApiKey) {
        throw new Error('No Gemini API key available');
      }

      const prompt = `
        You are a legal billing assistant. Generate a professional billable summary for an email composition session.

        EMAIL DETAILS:
        - Recipient: ${emailData.to}
        - Subject: ${emailData.subject}
        - Content Length: ${emailData.content.length} characters
        - Time Spent: ${timeFormatted} (${minutes} minutes ${seconds} seconds)
        
        EMAIL CONTENT:
        ${emailData.content}

        REQUIREMENTS:
        1. Create a concise, professional summary suitable for legal billing
        2. Include the specific work performed (email composition)
        3. Mention key points or topics addressed
        4. Include the exact time spent
        5. Use professional legal billing language
        6. Keep it under 150 words
        
        FORMAT:
        - Brief description of work performed
        - Key points addressed
        - Time allocation
        - Professional tone for client billing

        Generate the summary now:
      `;

      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': geminiApiKey
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 300,
            topP: 0.8,
            topK: 40
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const summary = data.candidates[0].content.parts[0].text;
      
      console.log('🎯 BillableAI: Test summary generated:', summary);
      
      // Store in localStorage for the test page to display
      const summaryData = {
        emailData,
        timeSpent,
        timeFormatted,
        summary,
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem('billableai_test_summary', JSON.stringify(summaryData));
      
      return summary;
    } catch (error) {
      console.error('🎯 BillableAI: Test summary generation failed:', error);
      throw error;
    }
  }

  // Get drafts count
  async function getDraftsCount() {
    try {
      if (!window.billableAIState.gmailApiReady) {
        return 0;
      }

      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts?maxResults=10', {
        headers: {
          'Authorization': `Bearer ${window.billableAIState.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Gmail API error: ${response.status}`);
      }

      const data = await response.json();
      const count = data.drafts ? data.drafts.length : 0;
      console.log('🎯 BillableAI: Found', count, 'drafts');
      return count;
    } catch (error) {
      console.error('🎯 BillableAI: Error getting drafts count:', error);
      return 0;
    }
  }

  // Background email tracking functions
  async function startEmailTracking(emailData) {
    console.log('🎯 BillableAI: Starting email tracking', emailData);
    
    window.billableAIState.isTracking = true;
    window.billableAIState.startTime = Date.now();
    window.billableAIState.currentEmail = { ...emailData };
    window.billableAIState.isPaused = false;
    window.billableAIState.lastActivityTime = Date.now();
    
    // Clear any existing timeout
    if (window.billableAIState.typingTimeout) {
      clearTimeout(window.billableAIState.typingTimeout);
    }
    
    // Start activity tracking
    updateEmailActivity();
    
    // Update tracking status
    updateTrackingStatus();
    
    console.log('🎯 BillableAI: Email tracking started');

    // Notify background script
    try {
      chrome.runtime.sendMessage({ 
        type: 'TRACKING_STARTED',
        emailData: emailData
      });
    } catch (error) {
      console.log('🎯 BillableAI: Could not send tracking started message:', error);
    }
  }

  function stopEmailTracking() {
    console.log('🎯 BillableAI: Stopping email tracking');
    
    if (window.billableAIState.isTracking && window.billableAIState.startTime) {
      window.billableAIState.accumulatedTime += Date.now() - window.billableAIState.startTime;
    }
    
    window.billableAIState.isTracking = false;
    window.billableAIState.startTime = null;
    window.billableAIState.lastActivityTime = null;
    
    // Update tracking status
    updateTrackingStatus();
    
    console.log('🎯 BillableAI: Email tracking stopped');

    // Notify background script
    try {
      chrome.runtime.sendMessage({ 
        type: 'TRACKING_STOPPED',
        accumulatedTime: window.billableAIState.accumulatedTime
      });
    } catch (error) {
      console.log('🎯 BillableAI: Could not send tracking stopped message:', error);
    }
  }

  function updateEmailActivity() {
    if (window.billableAIState.isTracking) {
      // Update tracking status less frequently to reduce performance impact
      updateTrackingStatus();
      
      // Update activity every 10 seconds to eliminate performance impact
      setTimeout(() => {
        if (window.billableAIState.isTracking) {
          updateEmailActivity();
        }
      }, 10000);
    }
  }

  // Initialize tracking with proper error handling
  async function initializeTracking() {
    console.log('🎯 BillableAI: Initializing simple tracking system');
    
    try {
      // Initialize Gmail API
      await initializeGmailApi();
      
      // Initialize tracking status
      updateTrackingStatus();
      
      console.log('🎯 BillableAI: Simple tracking system initialized');
    } catch (error) {
      console.error('🎯 BillableAI: Error initializing tracking:', error);
    }
  }

  // Start tracking when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTracking);
  } else {
    initializeTracking();
  }

  // Also initialize after a short delay to catch dynamic content
  setTimeout(initializeTracking, 1000);
  setTimeout(initializeTracking, 3000);

  console.log('🎯 BillableAI: Simple tracking script ready');
  
  // Expose functions for manual testing - ensure this runs in page context
  try {
    window.billableAI = {
      startTracking: () => {
        console.log('🎯 BillableAI: Manual start tracking');
        startEmailTracking({ to: '', subject: '', content: '' });
      },
      stopTracking: () => {
        console.log('🎯 BillableAI: Manual stop tracking');
        stopEmailTracking();
      },
      getStatus: () => {
        console.log('🎯 BillableAI: Current status:', window.billableAIState);
        return window.billableAIState;
      },
      testGmailApi: async () => {
        return await testGmailApi();
      },
      generateTestSummary: async (emailData, timeSpent) => {
        return await generateTestSummary(emailData, timeSpent);
      },
      getDraftsCount: async () => {
        return await getDraftsCount();
      }
    };
    
    console.log('🎯 BillableAI: Manual functions available at window.billableAI');
  } catch (error) {
    console.error('🎯 BillableAI: Error exposing functions:', error);
  }
  
  // Fallback: Ensure window.billableAI is always available
  if (!window.billableAI) {
    console.log('🎯 BillableAI: Creating fallback window.billableAI object');
    window.billableAI = {
      startTracking: () => console.log('🎯 BillableAI: Fallback start tracking'),
      stopTracking: () => console.log('🎯 BillableAI: Fallback stop tracking'),
      getStatus: () => ({ isTracking: false, message: 'Extension not loaded' }),
      testGmailApi: async () => false,
      generateTestSummary: async () => 'Extension not loaded',
      getDraftsCount: async () => 0
    };
  }
})(); 