// BillableAI Extension - Enhanced Background Script
// Handles extension lifecycle and communication with Gmail API integration

console.log('🎯 BillableAI: Enhanced background script loaded');

// Keep the service worker alive by handling lifecycle events
chrome.runtime.onStartup.addListener(() => {
  console.log('🎯 BillableAI: Extension startup');
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('🎯 BillableAI: Extension installed/updated');
});

// Handle service worker activation
self.addEventListener('activate', (event) => {
  console.log('🎯 BillableAI: Service worker activated');
  event.waitUntil(self.clients.claim());
});

// Handle service worker installation
self.addEventListener('install', (event) => {
  console.log('🎯 BillableAI: Service worker installed');
  event.waitUntil(self.skipWaiting());
});

// Keep service worker alive with periodic activity
let keepAliveInterval = null;

function startKeepAlive() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
  }
  
  keepAliveInterval = setInterval(() => {
    console.log('🎯 BillableAI: Service worker keep-alive ping');
    // This keeps the service worker active
  }, 30000); // Every 30 seconds
}

function stopKeepAlive() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
}

// Start keep-alive when service worker loads
startKeepAlive();

// Enhanced message handling for Gmail API integration
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('🎯 BillableAI: Message received:', request);
  
  // Restart keep-alive on any message
  startKeepAlive();
  
  if (request.type === 'CONTENT_SCRIPT_LOADED') {
    console.log('🎯 BillableAI: Content script loaded on Gmail page');
    sendResponse({ success: true });
  } else if (request.type === 'TRACKING_STARTED') {
    console.log('🎯 BillableAI: Email tracking started', {
      sessionId: request.sessionId,
      draftId: request.draftId
    });
    sendResponse({ success: true });
  } else if (request.type === 'TRACKING_STOPPED') {
    console.log('🎯 BillableAI: Email tracking stopped', {
      sessionId: request.sessionId,
      billingSummary: request.billingSummary
    });
    sendResponse({ success: true });
  } else if (request.type === 'EMAIL_DATA_STORED') {
    console.log('🎯 BillableAI: Email data stored from Gmail content script', request.data);
    
    // Store the email data in chrome.storage.local for cross-context access
    chrome.storage.local.set({ 
      'billableAI_emailSummary': {
        emailData: request.data.emailData,
        timeSpent: request.data.timeSpent,
        autoProcess: true,
        timestamp: Date.now()
      }
    }, () => {
      console.log('🎯 BillableAI: Email data stored in chrome.storage.local for Assistant access');
      
      // Notify any open popup/assistant about the new data
      chrome.runtime.sendMessage({
        type: 'EMAIL_DATA_AVAILABLE',
        data: request.data
      }).catch(error => {
        console.log('🎯 BillableAI: No popup listening for email data (normal if popup closed)');
      });
      
      sendResponse({ success: true });
    });
    
    return true; // Keep the message channel open for async response
  } else if (request.type === 'GET_EMAIL_DATA') {
    console.log('🎯 BillableAI: Assistant requesting email data');
    
    // Retrieve email data from chrome.storage.local
    chrome.storage.local.get(['billableAI_emailSummary'], (result) => {
      if (result.billableAI_emailSummary) {
        console.log('🎯 BillableAI: Found email data for Assistant:', result.billableAI_emailSummary);
        sendResponse({ 
          success: true, 
          data: result.billableAI_emailSummary 
        });
      } else {
        console.log('🎯 BillableAI: No email data found for Assistant');
        sendResponse({ 
          success: false, 
          error: 'No email data available' 
        });
      }
    });
    
    return true; // Keep the message channel open for async response
  } else if (request.type === 'CLEAR_EMAIL_DATA') {
    console.log('🎯 BillableAI: Clearing email data after processing');
    
    // Clear email data from chrome.storage.local
    chrome.storage.local.remove(['billableAI_emailSummary'], () => {
      console.log('🎯 BillableAI: Email data cleared from chrome.storage.local');
      sendResponse({ success: true });
    });
    
    return true; // Keep the message channel open for async response
  } else if (request.type === 'ONE_CLICK_BILLING') {
    console.log('🎯 BillableAI: One-click billing requested');
    handleOneClickBilling(request.data).then(result => {
      sendResponse({ success: true, result });
    }).catch(error => {
      console.error('🎯 BillableAI: One-click billing error:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep the message channel open for async response
  } else if (request.type === 'TEST_COMMUNICATION') {
    console.log('🎯 BillableAI: Test communication received:', request.data);
    sendResponse({ success: true, message: 'Enhanced background service worker is responding!' });
  } else if (request.type === 'PING') {
    console.log('🎯 BillableAI: Ping received from content script');
    sendResponse({ success: true, timestamp: Date.now() });
  } else if (request.type === 'KEEP_ALIVE') {
    console.log('🎯 BillableAI: Keep-alive ping received');
    sendResponse({ success: true, timestamp: Date.now() });
  } else if (request.type === 'OPEN_ASSISTANT') {
    console.log('🎯 BillableAI: Open assistant requested');
    
    // Handle the request asynchronously
    handleOpenAssistant(request.data)
      .then(result => {
        try {
          sendResponse({ success: true, result });
        } catch (responseError) {
          console.error('🎯 BillableAI: Send response error:', responseError);
        }
      })
      .catch(error => {
        console.error('🎯 BillableAI: Open assistant error:', error);
        try {
          sendResponse({ success: false, error: error.message });
        } catch (responseError) {
          console.error('🎯 BillableAI: Send error response failed:', responseError);
        }
      });
    
    return true; // Keep the message channel open for async response
  } else if (request.type === 'OPEN_ASSISTANT_WITH_SUMMARY') {
    console.log('🎯 BillableAI: Open assistant with summary requested');
    
    // Handle the request asynchronously
    handleOpenAssistantWithSummary(request.data)
      .then(result => {
        try {
          sendResponse({ success: true, result });
        } catch (responseError) {
          console.error('🎯 BillableAI: Send response error:', responseError);
        }
      })
      .catch(error => {
        console.error('🎯 BillableAI: Open assistant with summary error:', error);
        try {
          sendResponse({ success: false, error: error.message });
        } catch (responseError) {
          console.error('🎯 BillableAI: Send error response failed:', responseError);
        }
      });
    
    return true; // Keep the message channel open for async response
  } else if (request.type === 'INJECT_CONTENT_SCRIPT') {
    console.log('🎯 BillableAI: Manual content script injection requested');
    
    // Get the current active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        // Check if it's a Gmail page - if so, don't inject old script
        if (tabs[0].url && tabs[0].url.includes('mail.google.com')) {
          console.log('🎯 BillableAI: Gmail page detected - content script handled by manifest');
          sendResponse({ success: true, message: 'Gmail content script handled by manifest' });
        } else {
          // For non-Gmail pages, inject the appropriate script
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            files: ['tracking-script-enhanced.js']
          }).then(() => {
            console.log('🎯 BillableAI: Content script manually injected');
            sendResponse({ success: true });
          }).catch((error) => {
            console.error('🎯 BillableAI: Failed to inject content script:', error);
            sendResponse({ success: false, error: error.message });
          });
        }
      } else {
        console.error('🎯 BillableAI: No active tab found');
        sendResponse({ success: false, error: 'No active tab' });
      }
    });
    
    return true; // Keep the message channel open for async response
  } else if (request.type === 'GET_GMAIL_TOKEN') {
    console.log('🎯 BillableAI: Gmail token request received');
    handleGmailTokenRequest().then(token => {
      sendResponse({ success: true, token });
    }).catch(error => {
      console.error('🎯 BillableAI: Gmail token error:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep the message channel open for async response
  } else {
    console.log('🎯 BillableAI: Unknown message type:', request.type);
    sendResponse({ success: true });
  }
});

// Handle one-click billing from background script
async function handleOneClickBilling(data) {
  try {
    console.log('🎯 BillableAI: Processing one-click billing:', data);
    
    // Get the current active tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs[0]) {
      throw new Error('No active tab found');
    }
    
    // Execute one-click billing in the content script
    const results = await chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: () => {
        if (window.billableAI && window.billableAI.oneClickBilling) {
          return window.billableAI.oneClickBilling();
        } else {
          throw new Error('BillableAI not available in content script');
        }
      }
    });
    
    const result = results[0]?.result;
    console.log('🎯 BillableAI: One-click billing result:', result);
    
    return result;
    
  } catch (error) {
    console.error('🎯 BillableAI: One-click billing error:', error);
    throw error;
  }
}

// Handle Gmail token requests
async function handleGmailTokenRequest() {
  try {
    console.log('🎯 BillableAI: Getting Gmail token...');
    
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: false }, (token) => {
        if (chrome.runtime.lastError) {
          console.error('🎯 BillableAI: Gmail token error:', chrome.runtime.lastError);
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          console.log('🎯 BillableAI: Gmail token obtained successfully');
          resolve(token);
        }
      });
    });
    
  } catch (error) {
    console.error('🎯 BillableAI: Gmail token request error:', error);
    throw error;
  }
}

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log('🎯 BillableAI: Extension startup - starting keep-alive');
  startKeepAlive();
});

// Handle extension installation/update
chrome.runtime.onInstalled.addListener((details) => {
  console.log('🎯 BillableAI: Extension installed/updated:', details.reason);
  startKeepAlive();
});

// Handle when service worker is about to be terminated
self.addEventListener('beforeunload', () => {
  console.log('🎯 BillableAI: Service worker about to be terminated');
  stopKeepAlive();
});

// Handle when service worker is terminated
self.addEventListener('unload', () => {
  console.log('🎯 BillableAI: Service worker terminated');
  stopKeepAlive();
});

// Enhanced tab management for Gmail
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('mail.google.com')) {
    console.log('🎯 BillableAI: Gmail tab updated - content script handled by manifest');
  }
});

// Handle tab activation for Gmail
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab.url && tab.url.includes('mail.google.com')) {
      console.log('🎯 BillableAI: Gmail tab activated - content script handled by manifest');
    }
  });
});

// Handle messages from popup/assistant to content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'ONE_CLICK_BILLING') {
    console.log('🎯 BillableAI: One-click billing requested from popup/assistant');
    
    // Forward to content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url && tabs[0].url.includes('mail.google.com')) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'ONE_CLICK_BILLING' }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('🎯 BillableAI: Error sending message to content script:', chrome.runtime.lastError);
            sendResponse({ success: false, error: 'Content script not responding' });
          } else {
            console.log('🎯 BillableAI: One-click billing forwarded to content script');
            sendResponse({ success: true });
          }
        });
      } else {
        console.error('🎯 BillableAI: Gmail not open');
        sendResponse({ success: false, error: 'Gmail not open' });
      }
    });
    
    return true; // Keep the message channel open for async response
  }
});

async function handleOpenAssistant(data) {
  try {
    console.log('🎯 BillableAI: Handling open assistant request', data);
    
    // Store the summary data for the assistant
    const assistantData = {
      summary: data.summary,
      timeSpent: data.timeSpent,
      emailData: data.emailData,
      timestamp: Date.now()
    };
    
    // Store in chrome.storage.local for the assistant to access
    await chrome.storage.local.set({ 
      'billableai_assistant_data': assistantData 
    });
    
    // Store navigation intent in chrome.storage.local (primary method)
    await chrome.storage.local.set({ 'billableai_navigate_to_assistant': true });
    
    // Also store in localStorage as fallback
    try {
      localStorage.setItem('billableai_assistant_data', JSON.stringify(assistantData));
      localStorage.setItem('billableai_navigate_to_assistant', 'true');
    } catch (localStorageError) {
      console.log('🎯 BillableAI: localStorage fallback failed:', localStorageError.message);
    }
    
    // Try to send message to popup (but don't rely on it)
    try {
      chrome.runtime.sendMessage({
        type: 'NAVIGATE_TO_ASSISTANT',
        data: assistantData
      });
    } catch (messageError) {
      console.log('🎯 BillableAI: Message sending failed, using storage fallback:', messageError.message);
    }
    
    // Try to open popup programmatically (this may not work from service worker)
    try {
      // Get the current active tab
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]) {
        // Inject a script to open the popup
        await chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: () => {
            // Try to trigger popup opening
            if (typeof chrome !== 'undefined' && chrome.action) {
              chrome.action.openPopup();
            }
          }
        });
      }
    } catch (popupError) {
      console.log('🎯 BillableAI: Popup opening failed, using storage method:', popupError.message);
    }
    
    return {
      success: true,
      message: 'Assistant data stored, popup should open automatically'
    };
  } catch (error) {
    console.error('🎯 BillableAI: Open assistant error:', error);
    throw error;
  }
}

async function handleOpenAssistantWithSummary(data) {
  try {
    console.log('🎯 BillableAI: Handling open assistant with summary request', data);
    
    const { emailSummary, message } = data;
    
    // Store the email summary data for the assistant
    const assistantData = {
      emailData: emailSummary.emailData,
      timeSpent: emailSummary.timeSpent,
      sessionId: emailSummary.sessionId,
      draftId: emailSummary.draftId,
      timestamp: emailSummary.timestamp,
      type: 'gmail_compose_summary',
      autoMessage: message || 'Generate billable summary for the email'
    };
    
    // Store in chrome.storage.local for the assistant to access
    await chrome.storage.local.set({ 
      'billableai_assistant_data': assistantData,
      'billableai_auto_message': message || 'Generate billable summary for the email'
    });
    
    // Store navigation intent in chrome.storage.local (primary method)
    await chrome.storage.local.set({ 
      'billableai_navigate_to_assistant': true,
      'billableai_auto_open_assistant': true
    });
    
    // Also store in localStorage as fallback
    try {
      localStorage.setItem('billableai_assistant_data', JSON.stringify(assistantData));
      localStorage.setItem('billableai_auto_message', message || 'Generate billable summary for the email');
      localStorage.setItem('billableai_navigate_to_assistant', 'true');
      localStorage.setItem('billableai_auto_open_assistant', 'true');
    } catch (localStorageError) {
      console.log('🎯 BillableAI: localStorage fallback failed:', localStorageError.message);
    }
    
    // Try to send message to popup (but don't rely on it)
    try {
      chrome.runtime.sendMessage({
        type: 'NAVIGATE_TO_ASSISTANT_WITH_SUMMARY',
        data: assistantData
      });
    } catch (messageError) {
      console.log('🎯 BillableAI: Message sending failed, using storage fallback:', messageError.message);
    }
    
    // Try to open popup programmatically (this may not work from service worker)
    try {
      // Get the current active tab
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]) {
        // Inject a script to open the popup
        await chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: () => {
            // Try to trigger popup opening
            if (typeof chrome !== 'undefined' && chrome.action) {
              chrome.action.openPopup();
            }
          }
        });
      }
    } catch (popupError) {
      console.log('🎯 BillableAI: Popup opening failed, using storage method:', popupError.message);
    }
    
    return {
      success: true,
      message: 'Assistant with summary data stored, popup should open automatically'
    };
  } catch (error) {
    console.error('🎯 BillableAI: Open assistant with summary error:', error);
    throw error;
  }
}

console.log('🎯 BillableAI: Enhanced background script initialization complete'); 