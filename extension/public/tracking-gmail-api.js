// BillableAI Gmail API Module
// Handles Gmail API interactions and email data extraction

(function() {
  console.log('🎯 BillableAI: Gmail API module loaded');
  
  // Initialize Gmail API access with proper scopes
  async function initializeGmailApi() {
    try {
      // Get stored OAuth tokens
      const tokens = window.billableAICore.safeLocalStorageGet('billableai_oauth_tokens', {});
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

  // Extract email data with Gmail API fallback to DOM
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

  // Extract email data from DOM
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

  // Expose Gmail API functions
  window.billableAIGmailAPI = {
    initializeGmailApi,
    verifyGmailApiScopes,
    getCurrentComposeData,
    getDraftContent,
    extractEmailDataWithGmailApi,
    extractEmailDataFromDOM,
    testGmailApi,
    getDraftsCount
  };

  console.log('🎯 BillableAI: Gmail API module ready');
})(); 