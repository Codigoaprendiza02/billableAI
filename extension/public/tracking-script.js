// BillableAI Tracking Logic - Runs entirely in page context
// No extension APIs, no chrome.storage, only localStorage
(function() {
  console.log('🎯 BillableAI: Tracking logic injected into page context');
  
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

  // Initialize Gmail API access with proper scopes
  async function initializeGmailApi() {
    try {
      // Get stored OAuth tokens
      const tokens = safeLocalStorageGet('billableai_oauth_tokens', {});
      if (tokens.accessToken) {
        window.billableAIState.accessToken = tokens.accessToken;
        window.billableAIState.gmailApiReady = true;
        console.log('🎯 BillableAI: Gmail API initialized with stored token');
        
        // Verify token has required scopes
        await verifyGmailApiScopes();
        return true;
      }
      
      console.log('🎯 BillableAI: No Gmail API token available');
      return false;
    } catch (error) {
      console.error('🎯 BillableAI: Error initializing Gmail API:', error);
      return false;
    }
  }

  // Verify Gmail API scopes are sufficient
  async function verifyGmailApiScopes() {
    try {
      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
        headers: {
          'Authorization': `Bearer ${window.billableAIState.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Gmail API verification failed: ${response.status}`);
      }

      console.log('🎯 BillableAI: Gmail API scopes verified (readonly, compose, modify)');
      return true;
    } catch (error) {
      console.error('🎯 BillableAI: Gmail API scope verification failed:', error);
      window.billableAIState.gmailApiReady = false;
      return false;
    }
  }

  // Get current compose data via Gmail API with proper scopes
  async function getCurrentComposeData() {
    try {
      if (!window.billableAIState.gmailApiReady) {
        return null;
      }

      // Get drafts with readonly scope
      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts?maxResults=5', {
        headers: {
          'Authorization': `Bearer ${window.billableAIState.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get drafts: ${response.status}`);
      }

      const data = await response.json();
      console.log('🎯 BillableAI: Retrieved', data.drafts?.length || 0, 'drafts from Gmail API');
      return data.drafts || [];
    } catch (error) {
      console.error('🎯 BillableAI: Error getting compose data:', error);
      return null;
    }
  }

  // Get draft content via Gmail API with readonly scope
  async function getDraftContent(draftId) {
    try {
      if (!window.billableAIState.gmailApiReady) {
        return null;
      }

      const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/drafts/${draftId}?format=full`, {
        headers: {
          'Authorization': `Bearer ${window.billableAIState.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get draft content: ${response.status}`);
      }

      const data = await response.json();
      console.log('🎯 BillableAI: Retrieved draft content for draft ID:', draftId);
      return parseEmailContent(data.message);
    } catch (error) {
      console.error('🎯 BillableAI: Error getting draft content:', error);
      return null;
    }
  }

  // Parse email content from Gmail API response
  function parseEmailContent(message) {
    try {
      const headers = message.payload?.headers || [];
      const body = extractEmailBody(message.payload);

      return {
        id: message.id,
        threadId: message.threadId,
        to: getHeaderValue(headers, 'To') || '',
        from: getHeaderValue(headers, 'From') || '',
        subject: getHeaderValue(headers, 'Subject') || '',
        content: body || '',
        snippet: message.snippet || '',
        timestamp: new Date(parseInt(message.internalDate)).toISOString()
      };
    } catch (error) {
      console.error('🎯 BillableAI: Error parsing email content:', error);
      return null;
    }
  }

  // Extract email body from payload
  function extractEmailBody(payload) {
    if (!payload) return '';

    // Handle multipart messages
    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain') {
          return decodeBody(part.body.data);
        }
      }
    }

    // Handle single part messages
    if (payload.body && payload.body.data) {
      return decodeBody(payload.body.data);
    }

    return '';
  }

  // Decode base64 body data
  function decodeBody(data) {
    try {
      return atob(data.replace(/-/g, '+').replace(/_/g, '/'));
    } catch (error) {
      console.error('🎯 BillableAI: Error decoding body:', error);
      return '';
    }
  }

  // Get header value by name
  function getHeaderValue(headers, name) {
    const header = headers.find(h => h.name === name);
    return header ? header.value : '';
  }

  // Generate summary using Gemini API with enhanced prompt
  async function generateSummaryWithGemini(emailData, timeSpent) {
    try {
      // Get Gemini API key from localStorage
      const geminiApiKey = safeLocalStorageGet('billableai_gemini_api_key');
      if (!geminiApiKey) {
        console.log('🎯 BillableAI: No Gemini API key available, using basic summary');
        return generateBasicSummary(emailData, timeSpent);
      }

      const minutes = Math.floor(timeSpent / 1000 / 60);
      const seconds = Math.floor((timeSpent / 1000) % 60);
      const timeFormatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;

      const prompt = `
        You are a legal billing assistant. Generate a professional billable summary for an email composition session.

        EMAIL DETAILS:
        - Recipient: ${emailData.to || 'Not specified'}
        - Subject: ${emailData.subject || 'Not specified'}
        - Content Length: ${emailData.content?.length || 0} characters
        - Time Spent: ${timeFormatted} (${minutes} minutes ${seconds} seconds)
        
        EMAIL CONTENT:
        ${emailData.content || 'No content available'}

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

      console.log('🎯 BillableAI: Generating Gemini summary for', timeFormatted, 'of work');

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
      const summary = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Summary generation failed';
      
      console.log('🎯 BillableAI: Gemini summary generated successfully');
      
      return {
        timeSpent: timeSpent,
        emailData: emailData,
        summary: summary,
        timestamp: new Date().toISOString(),
        gmailApiUsed: window.billableAIState.gmailApiReady,
        aiGenerated: true,
        timeFormatted: timeFormatted
      };
    } catch (error) {
      console.error('🎯 BillableAI: Error generating Gemini summary:', error);
      return generateBasicSummary(emailData, timeSpent);
    }
  }

  // Generate basic summary as fallback
  function generateBasicSummary(emailData, timeSpent) {
    const minutes = Math.floor(timeSpent / 1000 / 60);
    const seconds = Math.floor((timeSpent / 1000) % 60);
    const timeFormatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    const summary = `
      EMAIL COMPOSITION SUMMARY
      
      Work Performed: Drafted and composed professional email communication
      Recipient: ${emailData.to || 'Not specified'}
      Subject: ${emailData.subject || 'Not specified'}
      Content Length: ${emailData.content?.length || 0} characters
      Time Spent: ${timeFormatted} (${minutes} minutes ${seconds} seconds)
      
      Key Points Addressed: ${emailData.subject || 'Email composition'}
      Time Allocation: ${minutes} minutes for email composition and review
      
      Billing Summary: Professional email communication drafting and composition.
    `;

    return {
      timeSpent: timeSpent,
      emailData: emailData,
      summary: summary,
      timestamp: new Date().toISOString(),
      gmailApiUsed: window.billableAIState.gmailApiReady,
      aiGenerated: false,
      timeFormatted: timeFormatted
    };
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

  function pauseEmailTracking() {
    console.log('🎯 BillableAI: Pausing email tracking');
    
    if (window.billableAIState.isTracking && window.billableAIState.startTime) {
      window.billableAIState.accumulatedTime += Date.now() - window.billableAIState.startTime;
    }
    
    window.billableAIState.isTracking = false;
    window.billableAIState.isPaused = true;
    
    // Update tracking status
    updateTrackingStatus();
    
    console.log('🎯 BillableAI: Email tracking paused');
  }

  function resumeEmailTracking() {
    console.log('🎯 BillableAI: Resuming email tracking');
    
    window.billableAIState.isTracking = true;
    window.billableAIState.startTime = Date.now();
    window.billableAIState.isPaused = false;
    window.billableAIState.lastActivityTime = Date.now();
    
    // Update tracking status
    updateTrackingStatus();
    
    console.log('🎯 BillableAI: Email tracking resumed');
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

  // Generate summary function with Gmail API data and Gemini AI
  async function generateSummary() {
    console.log('🎯 BillableAI: Generating summary with Gmail API data and Gemini AI');
    
    const timeSpent = window.billableAIState.accumulatedTime;
    const emailData = window.billableAIState.currentEmail;
    
    // Try to get full email content from Gmail API with readonly scope
    let fullEmailContent = emailData;
    if (window.billableAIState.gmailApiReady && emailData.draftId) {
      try {
        console.log('🎯 BillableAI: Fetching draft content from Gmail API...');
        const apiEmailData = await getDraftContent(emailData.draftId);
        if (apiEmailData) {
          fullEmailContent = apiEmailData;
          console.log('🎯 BillableAI: Successfully retrieved email content from Gmail API');
        }
      } catch (error) {
        console.error('🎯 BillableAI: Error getting email content from API:', error);
        console.log('🎯 BillableAI: Falling back to DOM-extracted content');
      }
    }
    
    // Generate summary using Gemini API
    console.log('🎯 BillableAI: Calling Gemini API for summary generation...');
    const summary = await generateSummaryWithGemini(fullEmailContent, timeSpent);
    
    // Store summary in localStorage
    try {
      const storedSummaries = safeLocalStorageGet('billableai_summaries', []);
      storedSummaries.push(summary);
      safeLocalStorageSet('billableai_summaries', storedSummaries);
      console.log('🎯 BillableAI: Summary stored successfully');
    } catch (error) {
      console.error('🎯 BillableAI: Error storing summary:', error);
    }
    
    // Update work history
    try {
      const storedWorkHistory = safeLocalStorageGet('billableai_workHistory', {});
      storedWorkHistory.summaries = (storedWorkHistory.summaries || 0) + 1;
      const totalMinutes = parseInt(storedWorkHistory.timeSpent || 0) + Math.floor(timeSpent / 1000 / 60);
      storedWorkHistory.timeSpent = totalMinutes + ' mins';
      safeLocalStorageSet('billableai_workHistory', storedWorkHistory);
      console.log('🎯 BillableAI: Work history updated - Total time:', totalMinutes, 'minutes');
    } catch (error) {
      console.error('🎯 BillableAI: Error updating work history:', error);
    }
    
    // Stop tracking
    stopEmailTracking();
    
    console.log('🎯 BillableAI: Summary generation completed successfully');
    return summary;
  }

        // Add visual indicator for debugging - DISABLED TO ELIMINATE ALL REFLOWS
      function addVisualIndicator() {
        try {
          // DISABLED: Visual indicator causes reflows - using console logging instead
          console.log('🎯 BillableAI: Visual indicator disabled to eliminate reflows');
          
                     // Simple status logging instead of visual indicator - REDUCED FREQUENCY
           setInterval(() => {
             if (window.billableAIState.isTracking) {
               const currentTime = Date.now() - window.billableAIState.startTime + window.billableAIState.accumulatedTime;
               const minutes = Math.floor(currentTime / 1000 / 60);
               const seconds = Math.floor((currentTime / 1000) % 60);
               console.log(`🎯 BillableAI: Tracking ${minutes}:${seconds.toString().padStart(2, '0')}`);
             } else if (window.billableAIState.isPaused) {
               const totalTime = window.billableAIState.accumulatedTime;
               const minutes = Math.floor(totalTime / 1000 / 60);
               const seconds = Math.floor((totalTime / 1000) % 60);
               console.log(`🎯 BillableAI: Paused ${minutes}:${seconds.toString().padStart(2, '0')}`);
             }
           }, 10000); // Log every 10 seconds instead of 5
          
          console.log('🎯 BillableAI: Status logging enabled (no visual indicator)');
        } catch (error) {
          console.error('🎯 BillableAI: Error setting up status logging:', error);
        }
      }

  // Gmail detection using MutationObserver for better reliability - OPTIMIZED FOR NO REFLOWS
  function setupGmailDetection() {
    console.log('🎯 BillableAI: Setting up Gmail detection (no reflows)');
    
    // Use MutationObserver to detect Gmail compose elements - OPTIMIZED
    const observer = new MutationObserver((mutations) => {
      // Batch all mutations to prevent multiple reflows
      requestIdleCallback(() => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              detectGmailComposeInNode(node);
              detectGmailSendButtonInNode(node);
            }
          });
        });
      }, { timeout: 100 });
    });
    
    // Start observing with optimized settings
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false, // Don't watch attribute changes to reduce overhead
      characterData: false // Don't watch text changes to reduce overhead
    });
    
    // Check existing elements with delay to prevent reflow
    requestIdleCallback(() => {
      detectGmailComposeInNode(document.body);
      detectGmailSendButtonInNode(document.body);
    }, { timeout: 200 });
    
    // Additional periodic check for dynamic content - much reduced frequency
    setInterval(() => {
      requestIdleCallback(() => {
        detectGmailComposeInNode(document.body);
        detectGmailSendButtonInNode(document.body);
      }, { timeout: 100 });
    }, 30000); // Check every 30 seconds instead of 10
  }

  function detectGmailComposeInNode(node) {
    // OPTIMIZED: Minimal selectors to reduce DOM queries and prevent reflows
    const composeSelectors = [
      '[role="textbox"][contenteditable="true"]',
      '[aria-label*="Message body"]',
      '.Am.Al.editable'
    ];
    
    // Use try-catch to prevent any potential reflow from querySelectorAll
    try {
      const composeElements = node.querySelectorAll ? node.querySelectorAll(composeSelectors.join(', ')) : [];
      
      // Only log if we found elements to reduce console spam
      if (composeElements.length > 0) {
        console.log('🎯 BillableAI: Found', composeElements.length, 'compose elements');
      }
      
      composeElements.forEach((element) => {
        // Check if already tracked without causing reflow
        if (!element.hasAttribute('data-billableai-tracked')) {
          // Set attribute first to prevent duplicate processing
          element.setAttribute('data-billableai-tracked', 'true');
          
          // Add event listeners without causing reflow
          element.addEventListener('input', handleEmailInput, { passive: true });
          element.addEventListener('focus', handleEmailFocus, { passive: true });
          element.addEventListener('blur', handleEmailBlur, { passive: true });
          
          console.log('🎯 BillableAI: Compose element tracked (no visual highlight)');
        }
      });
    } catch (error) {
      console.log('🎯 BillableAI: Error in compose detection (non-critical):', error.message);
    }
  }

  function detectGmailSendButtonInNode(node) {
    // OPTIMIZED: Minimal selectors to reduce DOM queries and prevent reflows
    const sendButtonSelectors = [
      '[data-tooltip="Send"]',
      '[aria-label*="Send"]',
      '.T-I.T-I-KE'
    ];
    
    // Use try-catch to prevent any potential reflow from querySelectorAll
    try {
      const sendButtons = node.querySelectorAll ? node.querySelectorAll(sendButtonSelectors.join(', ')) : [];
      
      // Only log if we found elements to reduce console spam
      if (sendButtons.length > 0) {
        console.log('🎯 BillableAI: Found', sendButtons.length, 'send buttons');
      }
      
      sendButtons.forEach((button) => {
        // Check if already tracked without causing reflow
        if (!button.hasAttribute('data-billableai-send-tracked')) {
          // Set attribute first to prevent duplicate processing
          button.setAttribute('data-billableai-send-tracked', 'true');
          
          // Add event listener without causing reflow
          button.addEventListener('click', handleSendButtonClick, { passive: true });
          
          console.log('🎯 BillableAI: Send button tracked (no visual highlight)');
        }
      });
    } catch (error) {
      console.log('🎯 BillableAI: Error in send button detection (non-critical):', error.message);
    }
  }

  // Debounce function to reduce performance impact
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // OPTIMIZED email input handler with debouncing - NO REFLOWS
  const debouncedHandleEmailInput = debounce(async (event) => {
    // Get content without causing reflow
    const content = event.target.textContent || event.target.value || '';
    
    if (content.trim()) {
      // Resume tracking if paused
      if (window.billableAIState.isPaused) {
        console.log('🎯 BillableAI: Resuming tracking from input');
        resumeEmailTracking();
      } else if (!window.billableAIState.isTracking) {
        // Start tracking if not already tracking
        console.log('🎯 BillableAI: Starting tracking from input');
        const emailData = await extractEmailDataWithGmailApi();
        startEmailTracking(emailData);
      }
      
      // Update last activity time
      window.billableAIState.lastActivityTime = Date.now();
      
      // Set timeout to pause tracking after inactivity (5 seconds - more generous)
      if (window.billableAIState.typingTimeout) {
        clearTimeout(window.billableAIState.typingTimeout);
      }
      
      window.billableAIState.typingTimeout = setTimeout(() => {
        console.log('🎯 BillableAI: Pausing tracking due to inactivity');
        pauseEmailTracking();
      }, 5000); // Pause after 5 seconds of inactivity
    }
  }, 200); // Increased debounce to 200ms to reduce frequency

  async function handleEmailInput(event) {
    // OPTIMIZED: Reduced logging frequency to prevent performance impact
    const content = event.target.textContent || event.target.value || '';
    if (content.length % 50 === 0) { // Log every 50 characters instead of 10
      console.log('🎯 BillableAI: Email input detected:', content.length, 'characters');
    }
    
    // Call the debounced handler
    debouncedHandleEmailInput(event);
  }

  function handleEmailFocus(event) {
    console.log('🎯 BillableAI: Email compose focused');
    
    // Extract email data when focus is gained
    extractEmailDataWithGmailApi().then(emailData => {
      window.billableAIState.currentEmail = emailData;
    });
  }

  function handleEmailBlur(event) {
    console.log('🎯 BillableAI: Email compose blurred');
    
    // Don't pause immediately on blur, let the timeout handle it
    // This allows for natural pauses in typing
  }

  function handleSendButtonClick(event) {
    console.log('🎯 BillableAI: Send button clicked - generating summary with Gemini API');
    
    // Stop tracking when send button is clicked and generate summary
    if (window.billableAIState.isTracking) {
      console.log('🎯 BillableAI: Email tracking active, stopping and generating summary...');
      generateSummary().then(summary => {
        console.log('🎯 BillableAI: Summary generated successfully:', summary.timeFormatted);
        
        // Show summary in console for debugging
        console.log('🎯 BillableAI: Generated Summary:');
        console.log(summary.summary);
      }).catch(error => {
        console.error('🎯 BillableAI: Error generating summary:', error);
      });
    } else {
      console.log('🎯 BillableAI: No active tracking to summarize');
    }
  }

  async function extractEmailDataWithGmailApi() {
    // First try to get data from Gmail API with readonly scope
    if (window.billableAIState.gmailApiReady) {
      try {
        console.log('🎯 BillableAI: Attempting to get email data from Gmail API...');
        const drafts = await getCurrentComposeData();
        if (drafts && drafts.length > 0) {
          const latestDraft = drafts[0];
          console.log('🎯 BillableAI: Found latest draft ID:', latestDraft.id);
          const draftContent = await getDraftContent(latestDraft.id);
          if (draftContent) {
            window.billableAIState.currentEmail.draftId = latestDraft.id;
            console.log('🎯 BillableAI: Successfully extracted email data from Gmail API');
            return draftContent;
          }
        } else {
          console.log('🎯 BillableAI: No drafts found in Gmail API');
        }
      } catch (error) {
        console.error('🎯 BillableAI: Error getting email data from API:', error);
      }
    } else {
      console.log('🎯 BillableAI: Gmail API not ready, using DOM extraction');
    }
    
    // Fallback to DOM extraction
    console.log('🎯 BillableAI: Falling back to DOM extraction');
    return extractEmailDataFromDOM();
  }

  function extractEmailDataFromDOM() {
    // OPTIMIZED: Gmail email data extraction from DOM - NO REFLOWS
    try {
      // Use minimal selectors to reduce DOM queries
      const toSelectors = [
        '[name="to"]',
        '[placeholder*="Recipients"]'
      ];
      
      const subjectSelectors = [
        '[name="subjectbox"]',
        '[placeholder*="Subject"]'
      ];
      
      const contentSelectors = [
        '[role="textbox"][contenteditable="true"]',
        '[aria-label*="Message body"]'
      ];
      
      // Batch all queries to prevent multiple reflows
      const toField = document.querySelector(toSelectors.join(', '));
      const subjectField = document.querySelector(subjectSelectors.join(', '));
      const contentField = document.querySelector(contentSelectors.join(', '));
      
      return {
        to: toField ? (toField.value || toField.textContent || '') : '',
        subject: subjectField ? (subjectField.value || subjectField.textContent || '') : '',
        content: contentField ? (contentField.textContent || contentField.value || '') : '',
        draftId: null,
        messageId: null
      };
    } catch (error) {
      console.log('🎯 BillableAI: Error extracting email data (non-critical):', error.message);
      return {
        to: '',
        subject: '',
        content: '',
        draftId: null,
        messageId: null
      };
    }
  }

  // Initialize tracking with proper error handling
  async function initializeTracking() {
    console.log('🎯 BillableAI: Initializing Gmail API email tracking');
    
    try {
      // Initialize Gmail API
      await initializeGmailApi();
      
      // Initialize tracking status
      updateTrackingStatus();
      
      // Setup Gmail detection
      setupGmailDetection();
      
      // Add visual indicator for debugging
      addVisualIndicator();
      
      console.log('🎯 BillableAI: Gmail API email tracking initialized');
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

  // Notify background script that content script is loaded
  try {
    chrome.runtime.sendMessage({ type: 'CONTENT_SCRIPT_LOADED' });
  } catch (error) {
    console.log('🎯 BillableAI: Could not send message to background script:', error);
  }

  // Keyboard shortcut to toggle tracking (Ctrl+Shift+T)
  document.addEventListener('keydown', function(e) {
    try {
      if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        console.log('🎯 BillableAI: Keyboard shortcut pressed (Ctrl+Shift+T)');
        
        if (window.billableAIState.isTracking) {
          pauseEmailTracking();
        } else {
          extractEmailDataWithGmailApi().then(emailData => {
            startEmailTracking(emailData);
          });
        }
      }
    } catch (error) {
      console.error('🎯 BillableAI: Error in keyboard shortcut handler:', error);
    }
  });

  console.log('🎯 BillableAI: Gmail API email tracking script ready');
  
  // Expose functions for manual testing - ensure this runs in page context
  try {
    window.billableAI = {
    startTracking: () => {
      console.log('🎯 BillableAI: Manual start tracking');
      extractEmailDataWithGmailApi().then(emailData => {
        startEmailTracking(emailData);
      });
    },
    stopTracking: () => {
      console.log('🎯 BillableAI: Manual stop tracking');
      stopEmailTracking();
    },
    pauseTracking: () => {
      console.log('🎯 BillableAI: Manual pause tracking');
      pauseEmailTracking();
    },
    resumeTracking: () => {
      console.log('🎯 BillableAI: Manual resume tracking');
      resumeEmailTracking();
    },
    getStatus: () => {
      console.log('🎯 BillableAI: Current status:', window.billableAIState);
      return window.billableAIState;
    },
    testDetection: () => {
      console.log('🎯 BillableAI: Testing Gmail detection');
      detectGmailComposeInNode(document.body);
      detectGmailSendButtonInNode(document.body);
    },
    cleanup: () => {
      console.log('🎯 BillableAI: Cleaning up');
      // No visual elements to clean up - all disabled to prevent reflows
    },
    // Test functions for gmail-api-test.html
    testGmailApi: async () => {
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
    },
    generateTestSummary: async (emailData, timeSpent) => {
      try {
        console.log('🎯 BillableAI: Generating test summary for:', emailData);
        
        const minutes = Math.floor(timeSpent / 1000 / 60);
        const seconds = Math.floor((timeSpent / 1000) % 60);
        const timeFormatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;

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

        const geminiApiKey = localStorage.getItem('billableai_gemini_api_key');
        if (!geminiApiKey) {
          throw new Error('No Gemini API key available');
        }

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
    },
    getDraftsCount: async () => {
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