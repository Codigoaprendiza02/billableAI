// Gmail Notification Content Script
// Tracks email composition and provides notification interface

console.log('🎯 BillableAI: Gmail notification content script loaded');

// Global state for notification
window.billableAINotificationState = {
  isVisible: false,
  isTracking: false,
  startTime: null,
  totalTime: 0,
  lastActivityTime: null,
  emailData: null,
  debounceTimer: null,
  timerInterval: null,
  composeCheckInterval: null // Added for compose window closure observation
};

// Initialize the notification system
function initializeNotificationSystem() {
  console.log('🎯 BillableAI: Initializing notification system');
  
  // Create notification container
  const notificationContainer = document.createElement('div');
  notificationContainer.id = 'billableai-notification-container';
  notificationContainer.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    display: none;
    font-family: 'Google Sans', Arial, sans-serif;
  `;
  
  document.body.appendChild(notificationContainer);
  
  // Start observing Gmail compose button
  observeComposeButton();
  
  // Also check for existing compose windows (in case page was loaded with compose already open)
  setTimeout(() => {
    checkForExistingComposeWindows();
  }, 2000);
}

// Check for existing compose windows
function checkForExistingComposeWindows() {
  console.log('🎯 BillableAI: Checking for existing compose windows');
  
  // Look for compose windows that might already be open
  const composeWindows = document.querySelectorAll('[role="dialog"] .Am.Al.editable, .Am.Al.editable');
  composeWindows.forEach(window => {
    if (!window.hasAttribute('data-billableai-observed')) {
      console.log('🎯 BillableAI: Found existing compose window');
      window.setAttribute('data-billableai-observed', 'true');
      startTracking(window);
    }
  });
}

// Observe Gmail compose button with multiple selectors
function observeComposeButton() {
  console.log('🎯 BillableAI: Starting compose button observation');
  
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Look for compose button with multiple selectors
          const composeSelectors = [
            '[data-tooltip="Compose"]',
            '[aria-label="Compose"]',
            '.T-I.T-I-KE',
            '[role="button"][aria-label*="Compose"]',
            '[role="button"][data-tooltip*="Compose"]',
            'div[role="button"][tabindex="0"]:has([aria-label*="Compose"])'
          ];
          
          composeSelectors.forEach(selector => {
            try {
              const composeButtons = node.querySelectorAll ? node.querySelectorAll(selector) : [];
              composeButtons.forEach(button => {
                if (!button.hasAttribute('data-billableai-observed')) {
                  button.setAttribute('data-billableai-observed', 'true');
                  button.addEventListener('click', handleComposeClick);
                  console.log('🎯 BillableAI: Compose button observed with selector:', selector);
                }
              });
            } catch (error) {
              console.log('🎯 BillableAI: Error with selector:', selector, error);
            }
          });
        }
      });
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Handle compose button click
function handleComposeClick() {
  console.log('🎯 BillableAI: Compose button clicked');
  
  // Wait for compose window to appear
  setTimeout(() => {
    observeComposeWindow();
  }, 1000);
}

// Observe compose window with multiple selectors
function observeComposeWindow() {
  console.log('🎯 BillableAI: Starting compose window observation');
  
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Look for compose window with multiple selectors
          const composeWindowSelectors = [
            '.Am.Al.editable',
            '[role="dialog"] .Am.Al.editable',
            '[role="dialog"] [contenteditable="true"]',
            '[contenteditable="true"]',
            '[role="textbox"]',
            'div[role="dialog"] div[contenteditable]'
          ];
          
          composeWindowSelectors.forEach(selector => {
            try {
              const composeWindows = node.querySelectorAll ? node.querySelectorAll(selector) : [];
              composeWindows.forEach(window => {
                if (!window.hasAttribute('data-billableai-observed')) {
                  console.log('🎯 BillableAI: Compose window observed with selector:', selector);
                  window.setAttribute('data-billableai-observed', 'true');
                  startTracking(window);
                }
              });
            } catch (error) {
              console.log('🎯 BillableAI: Error with compose window selector:', selector, error);
            }
          });
        }
      });
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Start tracking email composition
function startTracking(composeWindow) {
  console.log('🎯 BillableAI: Starting email tracking');
  console.log('🎯 BillableAI: Compose window element:', composeWindow);
  
  window.billableAINotificationState.isTracking = true;
  window.billableAINotificationState.startTime = Date.now();
  window.billableAINotificationState.lastActivityTime = Date.now();
  window.billableAINotificationState.totalTime = 0;
  
  // Track typing in subject and body with multiple selectors
  const subjectSelectors = [
    'input[name="subjectbox"]',
    '[name="subjectbox"]',
    'input[placeholder*="Subject"]',
    '[role="textbox"][aria-label*="Subject"]'
  ];
  
  const bodySelectors = [
    '.Am.Al.editable',
    '[contenteditable="true"]',
    '[role="textbox"]',
    'div[contenteditable]'
  ];
  
  // Add event listeners to subject field
  subjectSelectors.forEach(selector => {
    try {
      const subjectField = composeWindow.querySelector(selector) || document.querySelector(selector);
      if (subjectField) {
        subjectField.addEventListener('input', handleTyping);
        subjectField.addEventListener('keydown', handleTyping);
        subjectField.addEventListener('focus', resumeTracking);
        console.log('🎯 BillableAI: Subject field event listeners added');
      }
    } catch (error) {
      console.log('🎯 BillableAI: Error with subject selector:', selector, error);
    }
  });
  
  // Add event listeners to body field
  bodySelectors.forEach(selector => {
    try {
      const bodyField = composeWindow.querySelector(selector) || document.querySelector(selector);
      if (bodyField) {
        bodyField.addEventListener('input', handleTyping);
        bodyField.addEventListener('keydown', handleTyping);
        bodyField.addEventListener('focus', resumeTracking);
        console.log('🎯 BillableAI: Body field event listeners added');
      }
    } catch (error) {
      console.log('🎯 BillableAI: Error with body selector:', selector, error);
    }
  });
  
  // Show notification
  showNotification();
  
  // Start timer update interval - update every second
  window.billableAINotificationState.timerInterval = setInterval(() => {
    if (window.billableAINotificationState.isTracking) {
      window.billableAINotificationState.totalTime += 1000; // Add 1 second
      updateNotificationTimer();
    }
  }, 1000); // Update every second
  
  // Observe send button
  observeSendButton(composeWindow);
  
  // Also observe compose window for closure (fallback for send detection)
  observeComposeWindowClosure(composeWindow);
}

// Handle typing activity
function handleTyping() {
  if (!window.billableAINotificationState.isTracking) return;
  
  const now = Date.now();
  window.billableAINotificationState.lastActivityTime = now;
  
  // Clear existing debounce timer
  if (window.billableAINotificationState.debounceTimer) {
    clearTimeout(window.billableAINotificationState.debounceTimer);
  }
  
  // Set new debounce timer
  window.billableAINotificationState.debounceTimer = setTimeout(() => {
    pauseTracking();
  }, 3000); // Pause after 3 seconds of inactivity
  
  // Update notification timer immediately when typing
  updateNotificationTimer();
}

// Update notification timer
function updateNotificationTimer() {
  if (!window.billableAINotificationState.isTracking) return;
  
  const elapsedTime = window.billableAINotificationState.totalTime;
  const minutes = Math.floor(elapsedTime / 60000);
  const seconds = Math.floor((elapsedTime % 60000) / 1000);
  const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  
  const container = document.getElementById('billableai-notification-container');
  if (container && window.billableAINotificationState.isVisible) {
    const timerElement = container.querySelector('#billableai-timer');
    if (timerElement) {
      timerElement.textContent = `⏱️ ${timeString}`;
    }
  }
}

// Pause tracking
function pauseTracking() {
  if (!window.billableAINotificationState.isTracking) return;
  
  const now = Date.now();
  const timeSinceLastActivity = now - window.billableAINotificationState.lastActivityTime;
  
  if (timeSinceLastActivity >= 3000) {
    console.log('🎯 BillableAI: Tracking paused due to inactivity');
  }
}

// Resume tracking
function resumeTracking() {
  if (!window.billableAINotificationState.isTracking) return;
  
  window.billableAINotificationState.lastActivityTime = Date.now();
  console.log('🎯 BillableAI: Tracking resumed');
}

// Observe compose window closure as fallback for send detection
function observeComposeWindowClosure(composeWindow) {
  console.log('🎯 BillableAI: Observing compose window for closure');
  
  const dialog = composeWindow.closest('[role="dialog"]');
  if (!dialog) return;
  
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        // Check if the compose window is being removed
        const removedNodes = Array.from(mutation.removedNodes);
        const isComposeWindowRemoved = removedNodes.some(node => 
          node === dialog || 
          (node.nodeType === Node.ELEMENT_NODE && node.contains(dialog))
        );
        
        if (isComposeWindowRemoved && window.billableAINotificationState.isTracking) {
          console.log('🎯 BillableAI: Compose window closed, stopping tracking');
          handleSendClick(); // Use the same handler as send button
        }
      }
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Also check periodically if compose window still exists
  const checkInterval = setInterval(() => {
    if (!document.contains(dialog) && window.billableAINotificationState.isTracking) {
      console.log('🎯 BillableAI: Compose window no longer exists, stopping tracking');
      clearInterval(checkInterval);
      handleSendClick();
    }
  }, 2000); // Check every 2 seconds
  
  // Store the check interval for cleanup
  window.billableAINotificationState.composeCheckInterval = checkInterval;
}

// Observe send button
function observeSendButton(composeWindow) {
  console.log('🎯 BillableAI: Starting send button observation');
  
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Look for send button with multiple comprehensive selectors
          const sendButtonSelectors = [
            '[data-tooltip="Send"]',
            '[aria-label="Send"]',
            '.T-I.T-I-KE.L3',
            '[role="button"][aria-label*="Send"]',
            '[role="button"][data-tooltip*="Send"]',
            'div[role="button"][tabindex="0"]:has([aria-label*="Send"])',
            'button[aria-label*="Send"]',
            'button[data-tooltip*="Send"]',
            '.T-I.T-I-KE[role="button"]',
            '[data-tooltip="Send (Ctrl-Enter)"]',
            '[aria-label="Send (Ctrl-Enter)"]'
          ];
          
          sendButtonSelectors.forEach(selector => {
            try {
              const sendButtons = node.querySelectorAll ? node.querySelectorAll(selector) : [];
              sendButtons.forEach(button => {
                if (!button.hasAttribute('data-billableai-observed')) {
                  button.setAttribute('data-billableai-observed', 'true');
                  button.addEventListener('click', handleSendClick);
                  console.log('🎯 BillableAI: Send button observed with selector:', selector);
                }
              });
            } catch (error) {
              console.log('🎯 BillableAI: Error with send button selector:', selector, error);
            }
          });
        }
      });
    });
  });
  
  observer.observe(composeWindow.closest('[role="dialog"]') || document.body, {
    childList: true,
    subtree: true
  });
  
  // Also check for existing send buttons immediately
  setTimeout(() => {
    checkForExistingSendButtons(composeWindow);
  }, 1000);
}

// Check for existing send buttons
function checkForExistingSendButtons(composeWindow) {
  console.log('🎯 BillableAI: Checking for existing send buttons');
  
  const sendButtonSelectors = [
    '[data-tooltip="Send"]',
    '[aria-label="Send"]',
    '.T-I.T-I-KE.L3',
    '[role="button"][aria-label*="Send"]',
    '[role="button"][data-tooltip*="Send"]',
    'button[aria-label*="Send"]',
    'button[data-tooltip*="Send"]',
    '.T-I.T-I-KE[role="button"]',
    '[data-tooltip="Send (Ctrl-Enter)"]',
    '[aria-label="Send (Ctrl-Enter)"]'
  ];
  
  const dialog = composeWindow.closest('[role="dialog"]') || document.body;
  
  sendButtonSelectors.forEach(selector => {
    try {
      const sendButtons = dialog.querySelectorAll(selector);
      sendButtons.forEach(button => {
        if (!button.hasAttribute('data-billableai-observed')) {
          button.setAttribute('data-billableai-observed', 'true');
          button.addEventListener('click', handleSendClick);
          console.log('🎯 BillableAI: Existing send button found with selector:', selector);
        }
      });
    } catch (error) {
      console.log('🎯 BillableAI: Error checking existing send buttons with selector:', selector, error);
    }
  });
}

async function handleSendClick() {
  console.log('🎯 BillableAI: Send button clicked');
  
  if (!window.billableAINotificationState.isTracking) {
    console.log('🎯 BillableAI: Not currently tracking, ignoring send click');
    return;
  }
  
  console.log('🎯 BillableAI: Stopping tracking due to send button click');
  
  // Calculate final time BEFORE stopping tracking
  const now = Date.now();
  const finalTime = window.billableAINotificationState.totalTime;
  
  console.log('🎯 BillableAI: Final time calculated:', finalTime, 'ms');
  
  // Capture email data BEFORE clearing timers
  console.log('🎯 BillableAI: Capturing email data before clearing timers...');
  const emailData = captureEmailData();
  
  console.log('🎯 BillableAI: Captured email data:', emailData);
  
  if (!emailData) {
    console.log('🎯 BillableAI: Failed to capture email data, but continuing with timer data');
  } else {
    console.log('🎯 BillableAI: Successfully captured email data with fields:', {
      subject: emailData.subject,
      to: emailData.to,
      cc: emailData.cc,
      bcc: emailData.bcc,
      bodyLength: emailData.body?.length || 0,
      timestamp: emailData.timestamp
    });
  }
  
  // Stop tracking AFTER capturing data
  window.billableAINotificationState.isTracking = false;
  
  // Clear timer interval
  if (window.billableAINotificationState.timerInterval) {
    clearInterval(window.billableAINotificationState.timerInterval);
    window.billableAINotificationState.timerInterval = null;
    console.log('🎯 BillableAI: Timer interval cleared');
  }
  
  // Clear compose window closure interval
  if (window.billableAINotificationState.composeCheckInterval) {
    clearInterval(window.billableAINotificationState.composeCheckInterval);
    window.billableAINotificationState.composeCheckInterval = null;
    console.log('🎯 BillableAI: Compose window closure interval cleared');
  }
  
  // Store data for assistant
  console.log('🎯 BillableAI: About to store email data for assistant...');
  await storeEmailDataForAssistant(emailData, finalTime);
  console.log('🎯 BillableAI: Email data storage completed');
  
  // Close notification
  window.billableAINotificationState.isVisible = false;
  updateNotificationComponent();
  
  // Show "summary generated" message
  showSummaryGeneratedMessage();
  
  console.log('🎯 BillableAI: Email data captured and stored', { emailData, finalTime });
}

// Capture email data
function captureEmailData() {
  console.log('🎯 BillableAI: Capturing email data...');
  
  // Try multiple selectors for compose window
  const composeWindowSelectors = [
    '.Am.Al.editable',
    '[role="dialog"] .Am.Al.editable',
    '[role="dialog"] [contenteditable="true"]',
    '[contenteditable="true"]',
    '[role="textbox"]'
  ];
  
  let composeWindow = null;
  for (const selector of composeWindowSelectors) {
    composeWindow = document.querySelector(selector);
    if (composeWindow) {
      console.log('🎯 BillableAI: Found compose window with selector:', selector);
      break;
    }
  }
  
  if (!composeWindow) {
    console.log('🎯 BillableAI: No compose window found');
    return null;
  }
  
  const dialog = composeWindow.closest('[role="dialog"]');
  if (!dialog) {
    console.log('🎯 BillableAI: No dialog found for compose window');
    return null;
  }
  
  // Get subject with multiple selectors
  const subjectSelectors = [
    'input[name="subjectbox"]',
    '[name="subjectbox"]',
    'input[placeholder*="Subject"]',
    '[role="textbox"][aria-label*="Subject"]',
    'input[aria-label*="Subject"]'
  ];
  
  let subject = '';
  for (const selector of subjectSelectors) {
    const subjectField = dialog.querySelector(selector);
    if (subjectField) {
      subject = subjectField.value || '';
      console.log('🎯 BillableAI: Found subject with selector:', selector, 'Value:', subject);
      break;
    }
  }
  
  // Get body content
  const bodySelectors = [
    '.Am.Al.editable',
    '[contenteditable="true"]',
    '[role="textbox"]',
    'div[contenteditable]'
  ];
  
  let body = '';
  for (const selector of bodySelectors) {
    const bodyField = dialog.querySelector(selector);
    if (bodyField) {
      body = bodyField.textContent || bodyField.innerText || '';
      console.log('🎯 BillableAI: Found body with selector:', selector, 'Length:', body.length);
      break;
    }
  }
  
  // Get TO recipients with multiple selectors
  const toSelectors = [
    'input[name="to"]',
    '[name="to"]',
    'input[placeholder*="Recipients"]',
    '[role="textbox"][aria-label*="To"]',
    'input[aria-label*="To"]'
  ];
  
  let to = '';
  for (const selector of toSelectors) {
    const toField = dialog.querySelector(selector);
    if (toField) {
      to = toField.value || '';
      console.log('🎯 BillableAI: Found TO recipients with selector:', selector, 'Value:', to);
      break;
    }
  }
  
  // Get CC recipients with multiple selectors
  const ccSelectors = [
    'input[name="cc"]',
    '[name="cc"]',
    'input[placeholder*="Cc"]',
    '[role="textbox"][aria-label*="Cc"]',
    'input[aria-label*="Cc"]'
  ];
  
  let cc = '';
  for (const selector of ccSelectors) {
    const ccField = dialog.querySelector(selector);
    if (ccField) {
      cc = ccField.value || '';
      console.log('🎯 BillableAI: Found CC recipients with selector:', selector, 'Value:', cc);
      break;
    }
  }
  
  // Get BCC recipients with multiple selectors
  const bccSelectors = [
    'input[name="bcc"]',
    '[name="bcc"]',
    'input[placeholder*="Bcc"]',
    '[role="textbox"][aria-label*="Bcc"]',
    'input[aria-label*="Bcc"]'
  ];
  
  let bcc = '';
  for (const selector of bccSelectors) {
    const bccField = dialog.querySelector(selector);
    if (bccField) {
      bcc = bccField.value || '';
      console.log('🎯 BillableAI: Found BCC recipients with selector:', selector, 'Value:', bcc);
      break;
    }
  }
  
  const emailData = {
    subject: subject.trim(),
    body: body.trim(),
    to: to.trim(),
    cc: cc.trim(),
    bcc: bcc.trim(),
    timestamp: new Date().toISOString()
  };
  
  console.log('🎯 BillableAI: Captured complete email data:', emailData);
  return emailData;
}

// Store email data for assistant
async function storeEmailDataForAssistant(emailData, timeSpent) {
  console.log('🎯 BillableAI: Storing email data for assistant...');
  console.log('🎯 BillableAI: Email data:', emailData);
  console.log('🎯 BillableAI: Time spent:', timeSpent);
  
  if (!emailData) {
    console.log('🎯 BillableAI: No email data to store');
    return;
  }
  
  const summaryData = {
    emailData,
    timeSpent,
    timestamp: Date.now(),
    autoProcess: true
  };
  
  console.log('🎯 BillableAI: Summary data to store:', summaryData);
  
  try {
    // Send message to background script to store data (primary method)
    chrome.runtime.sendMessage({
      type: 'EMAIL_DATA_STORED',
      data: {
        emailData: emailData,
        timeSpent: timeSpent,
        autoProcess: true,
        timestamp: Date.now()
      }
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.log('🎯 BillableAI: Error sending message to background script:', chrome.runtime.lastError);
        // Fallback to direct storage
        fallbackStorage(summaryData);
      } else if (response && response.success) {
        console.log('🎯 BillableAI: Email data stored via background script successfully');
      } else {
        console.log('🎯 BillableAI: Background script storage failed, using fallback');
        fallbackStorage(summaryData);
      }
    });
    
    // Also store in localStorage for local verification
    localStorage.setItem('billableAI_emailSummary', JSON.stringify(summaryData));
    console.log('🎯 BillableAI: Email data also stored in localStorage for verification');
    
    // Verify storage
    const storedData = localStorage.getItem('billableAI_emailSummary');
    console.log('🎯 BillableAI: Verification - stored data:', storedData);
    
    if (storedData) {
      const parsed = JSON.parse(storedData);
      console.log('🎯 BillableAI: Verification - parsed data:', parsed);
      console.log('🎯 BillableAI: Verification - email subject:', parsed.emailData?.subject);
      console.log('🎯 BillableAI: Verification - email body length:', parsed.emailData?.body?.length);
    }
    
  } catch (error) {
    console.log('🎯 BillableAI: Error storing email data:', error);
    // Fallback to direct storage
    fallbackStorage(summaryData);
  }
}

// Fallback storage function
async function fallbackStorage(summaryData) {
  try {
    console.log('🎯 BillableAI: Using fallback storage method');
    
    // Store in chrome.storage.local as fallback
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({ 'billableAI_emailSummary': summaryData });
      console.log('🎯 BillableAI: Email data stored in chrome.storage.local via fallback');
    } else {
      console.log('🎯 BillableAI: chrome.storage.local not available in fallback');
    }
    
    // Store in localStorage as fallback
    localStorage.setItem('billableAI_emailSummary', JSON.stringify(summaryData));
    console.log('🎯 BillableAI: Email data stored in localStorage via fallback');
    
  } catch (error) {
    console.log('🎯 BillableAI: Error in fallback storage:', error);
  }
}

// Show notification
function showNotification() {
  console.log('🎯 BillableAI: Showing notification');
  window.billableAINotificationState.isVisible = true;
  updateNotificationComponent();
}

// Update notification component
function updateNotificationComponent() {
  console.log('🎯 BillableAI: Updating notification component');
  const container = document.getElementById('billableai-notification-container');
  if (!container) {
    console.log('🎯 BillableAI: Notification container not found');
    return;
  }
  
  if (window.billableAINotificationState.isVisible) {
    // Calculate elapsed time
    const elapsedTime = window.billableAINotificationState.totalTime;
    const minutes = Math.floor(elapsedTime / 60000);
    const seconds = Math.floor((elapsedTime % 60000) / 1000);
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    container.style.display = 'block';
    container.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        max-width: 200px;
        font-size: 12px;
        line-height: 1.3;
        font-family: 'Google Sans', Arial, sans-serif;
      ">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div id="billableai-timer" style="font-weight: 600; font-size: 14px;">⏱️ ${timeString}</div>
            <div style="opacity: 0.8; font-size: 11px;">Tracking email time</div>
          </div>
          <button id="billableai-notification-close-btn" style="
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            cursor: pointer;
            font-size: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-left: 8px;
          ">×</button>
        </div>
      </div>
    `;
    
    setupNotificationEventListeners(container);
  } else {
    container.style.display = 'none';
  }
}

// Setup notification event listeners
function setupNotificationEventListeners(notification) {
  const closeBtn = notification.querySelector('#billableai-notification-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      window.billableAINotificationState.isVisible = false;
      updateNotificationComponent();
    });
  }
}

// Open assistant with summary
async function openAssistantWithSummary() {
  console.log('🎯 BillableAI: Opening assistant with summary');
  
  // Store current data for assistant
  const emailData = captureEmailData();
  if (emailData) {
    await storeEmailDataForAssistant(emailData, window.billableAINotificationState.totalTime);
  }
  
  // Show user guidance
  showUserGuidanceNotification();
  
  // Close current notification
  window.billableAINotificationState.isVisible = false;
  updateNotificationComponent();
}

// Show user guidance notification
function showUserGuidanceNotification() {
  const container = document.getElementById('billableai-notification-container');
  if (!container) return;
  
  container.style.display = 'block';
  container.innerHTML = `
    <div style="
      background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
      color: white;
      padding: 16px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      max-width: 320px;
      font-size: 14px;
      line-height: 1.4;
    ">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
        <div style="font-weight: 600; font-size: 16px;">🎯 Ready for Summary</div>
        <button id="billableai-guidance-close-btn" style="
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          cursor: pointer;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">×</button>
      </div>
      <div style="margin-bottom: 12px; opacity: 0.9;">
        Click the BillableAI extension icon to view your summary and generate billable time.
      </div>
    </div>
  `;
  
  const closeBtn = container.querySelector('#billableai-guidance-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      container.style.display = 'none';
    });
  }
}

// Show "summary generated" message
function showSummaryGeneratedMessage() {
  const container = document.getElementById('billableai-notification-container');
  if (!container) return;
  
  container.style.display = 'block';
  container.innerHTML = `
    <div style="
      background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
      color: white;
      padding: 16px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      max-width: 320px;
      font-size: 14px;
      line-height: 1.4;
    ">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
        <div style="font-weight: 600; font-size: 16px;">✅ Summary Generated</div>
        <button id="billableai-summary-close-btn" style="
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          cursor: pointer;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">×</button>
      </div>
      <div style="margin-bottom: 12px; opacity: 0.9;">
        Click extension icon to get the summary
      </div>
    </div>
  `;
  
  const closeBtn = container.querySelector('#billableai-summary-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      container.style.display = 'none';
    });
  }
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    container.style.display = 'none';
  }, 5000);
}

// Global functions for external access
window.billableAI = {
  openAssistant: async () => {
    console.log('🎯 BillableAI: Opening assistant');
    
    // Store current data
    const emailData = captureEmailData();
    if (emailData) {
      await storeEmailDataForAssistant(emailData, window.billableAINotificationState.totalTime);
    }
    
    // Show user guidance
    showUserGuidanceNotification();
    
    // Close current notification
    window.billableAINotificationState.isVisible = false;
    updateNotificationComponent();
  },
  
  getState: () => {
    return window.billableAINotificationState;
  },

  // Manual stop for debugging
  stopTracking: () => {
    console.log('🎯 BillableAI: Debug - Manually stopping tracking');
    window.billableAINotificationState.isTracking = false;
    if (window.billableAINotificationState.timerInterval) {
      clearInterval(window.billableAINotificationState.timerInterval);
      window.billableAINotificationState.timerInterval = null;
    }
    if (window.billableAINotificationState.composeCheckInterval) {
      clearInterval(window.billableAINotificationState.composeCheckInterval);
      window.billableAINotificationState.composeCheckInterval = null;
    }
    window.billableAINotificationState.isVisible = false;
    updateNotificationComponent();
    console.log('🎯 BillableAI: Debug - Tracking stopped');
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeNotificationSystem);
} else {
  initializeNotificationSystem();
}

// Debug function to check notification status
window.billableAIDebug = {
  checkStatus: () => {
    console.log('🎯 BillableAI: Debug - Current state:', window.billableAINotificationState);
    console.log('🎯 BillableAI: Debug - Notification container:', document.getElementById('billableai-notification-container'));
    console.log('🎯 BillableAI: Debug - Is tracking:', window.billableAINotificationState.isTracking);
    console.log('🎯 BillableAI: Debug - Is visible:', window.billableAINotificationState.isVisible);
    console.log('🎯 BillableAI: Debug - Total time:', window.billableAINotificationState.totalTime);
    console.log('🎯 BillableAI: Debug - Timer interval:', window.billableAINotificationState.timerInterval);
    console.log('🎯 BillableAI: Debug - Compose check interval:', window.billableAINotificationState.composeCheckInterval);
  },
  
  forceShowNotification: () => {
    console.log('🎯 BillableAI: Debug - Forcing notification to show');
    window.billableAINotificationState.isVisible = true;
    window.billableAINotificationState.isTracking = true;
    window.billableAINotificationState.totalTime = 30000; // 30 seconds
    updateNotificationComponent();
  },
  
  testNotification: () => {
    console.log('🎯 BillableAI: Debug - Testing notification');
    const container = document.getElementById('billableai-notification-container');
    if (container) {
      container.style.display = 'block';
      container.innerHTML = `
        <div style="
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px 16px;
          border-radius: 8px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
          max-width: 200px;
          font-size: 12px;
          line-height: 1.3;
          font-family: 'Google Sans', Arial, sans-serif;
        ">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div id="billableai-timer" style="font-weight: 600; font-size: 14px;">⏱️ 0:30</div>
              <div style="opacity: 0.8; font-size: 11px;">Test notification</div>
            </div>
            <button id="billableai-test-close-btn" style="
              background: rgba(255, 255, 255, 0.2);
              border: none;
              color: white;
              border-radius: 50%;
              width: 20px;
              height: 20px;
              cursor: pointer;
              font-size: 10px;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-left: 8px;
            ">×</button>
          </div>
        </div>
      `;
      
      const closeBtn = container.querySelector('#billableai-test-close-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          container.style.display = 'none';
        });
      }
      
      setTimeout(() => {
        container.style.display = 'none';
      }, 5000);
    }
  },
  
  testTimerUpdate: () => {
    console.log('🎯 BillableAI: Debug - Testing timer update');
    if (window.billableAINotificationState.isTracking) {
      window.billableAINotificationState.totalTime += 5000; // Add 5 seconds
      updateNotificationTimer();
      console.log('🎯 BillableAI: Debug - Timer updated, total time:', window.billableAINotificationState.totalTime);
    } else {
      console.log('🎯 BillableAI: Debug - Not currently tracking');
    }
  },
  
  startTracking: () => {
    console.log('🎯 BillableAI: Debug - Manually starting tracking');
    window.billableAINotificationState.isTracking = true;
    window.billableAINotificationState.startTime = Date.now();
    window.billableAINotificationState.lastActivityTime = Date.now();
    window.billableAINotificationState.totalTime = 0;
    showNotification();
    
    // Start timer interval
    window.billableAINotificationState.timerInterval = setInterval(() => {
      if (window.billableAINotificationState.isTracking) {
        window.billableAINotificationState.totalTime += 1000;
        updateNotificationTimer();
      }
    }, 1000);
    
    console.log('🎯 BillableAI: Debug - Manual tracking started');
  },
  
  stopTracking: () => {
    console.log('🎯 BillableAI: Debug - Stopping tracking');
    window.billableAINotificationState.isTracking = false;
    if (window.billableAINotificationState.timerInterval) {
      clearInterval(window.billableAINotificationState.timerInterval);
      window.billableAINotificationState.timerInterval = null;
    }
    if (window.billableAINotificationState.composeCheckInterval) {
      clearInterval(window.billableAINotificationState.composeCheckInterval);
      window.billableAINotificationState.composeCheckInterval = null;
    }
    window.billableAINotificationState.isVisible = false;
    updateNotificationComponent();
    console.log('🎯 BillableAI: Debug - Tracking stopped');
  },
  
  testSendButtonDetection: () => {
    console.log('🎯 BillableAI: Debug - Testing send button detection');
    const sendButtonSelectors = [
      '[data-tooltip="Send"]',
      '[aria-label="Send"]',
      '.T-I.T-I-KE.L3',
      '[role="button"][aria-label*="Send"]',
      '[role="button"][data-tooltip*="Send"]',
      'button[aria-label*="Send"]',
      'button[data-tooltip*="Send"]',
      '.T-I.T-I-KE[role="button"]',
      '[data-tooltip="Send (Ctrl-Enter)"]',
      '[aria-label="Send (Ctrl-Enter)"]'
    ];
    
    sendButtonSelectors.forEach(selector => {
      try {
        const sendButtons = document.querySelectorAll(selector);
        console.log(`🎯 BillableAI: Debug - Found ${sendButtons.length} send buttons with selector: ${selector}`);
        sendButtons.forEach((button, index) => {
          console.log(`🎯 BillableAI: Debug - Send button ${index + 1}:`, button);
          console.log(`🎯 BillableAI: Debug - Button text:`, button.textContent);
          console.log(`🎯 BillableAI: Debug - Button aria-label:`, button.getAttribute('aria-label'));
          console.log(`🎯 BillableAI: Debug - Button data-tooltip:`, button.getAttribute('data-tooltip'));
        });
      } catch (error) {
        console.log('🎯 BillableAI: Debug - Error with send button selector:', selector, error);
      }
    });
  },
  
  simulateSendClick: () => {
    console.log('🎯 BillableAI: Debug - Simulating send button click');
    handleSendClick();
  },
  
  // New debug function to test email data storage
  testEmailDataStorage: () => {
    console.log('🎯 BillableAI: Debug - Testing email data storage');
    
    // Create test email data
    const testEmailData = {
      subject: 'Test Email Subject',
      body: 'This is a test email body for testing the email data storage functionality. It contains multiple sentences to simulate a real email.',
      to: 'test@example.com',
      timestamp: new Date().toISOString()
    };
    
    const testTimeSpent = 120000; // 2 minutes
    
    console.log('🎯 BillableAI: Debug - Test email data:', testEmailData);
    console.log('🎯 BillableAI: Debug - Test time spent:', testTimeSpent);
    
    // Store the test data
    storeEmailDataForAssistant(testEmailData, testTimeSpent);
    
    // Verify storage
    setTimeout(() => {
      const storedData = localStorage.getItem('billableAI_emailSummary');
      if (storedData) {
        const parsed = JSON.parse(storedData);
        console.log('🎯 BillableAI: Debug - Verification successful:', parsed);
        console.log('🎯 BillableAI: Debug - Email subject:', parsed.emailData?.subject);
        console.log('🎯 BillableAI: Debug - Email body:', parsed.emailData?.body);
        console.log('🎯 BillableAI: Debug - Time spent:', parsed.timeSpent);
      } else {
        console.log('🎯 BillableAI: Debug - No data found in localStorage');
      }
    }, 100);
  },
  
  // Debug function to check current localStorage
  checkLocalStorage: () => {
    console.log('🎯 BillableAI: Debug - Checking localStorage');
    const storedData = localStorage.getItem('billableAI_emailSummary');
    if (storedData) {
      const parsed = JSON.parse(storedData);
      console.log('🎯 BillableAI: Debug - Current stored data:', parsed);
      console.log('🎯 BillableAI: Debug - Email subject:', parsed.emailData?.subject);
      console.log('🎯 BillableAI: Debug - Email body length:', parsed.emailData?.body?.length);
      console.log('🎯 BillableAI: Debug - Time spent:', parsed.timeSpent);
      console.log('🎯 BillableAI: Debug - Auto process:', parsed.autoProcess);
    } else {
      console.log('🎯 BillableAI: Debug - No email data found in localStorage');
    }
    
    // Also check chrome.storage.local
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['billableAI_emailSummary'], (result) => {
        if (result.billableAI_emailSummary) {
          console.log('🎯 BillableAI: Debug - Found data in chrome.storage.local:', result.billableAI_emailSummary);
        } else {
          console.log('🎯 BillableAI: Debug - No email data found in chrome.storage.local');
        }
      });
    }
  },
  
  // Debug function to clear localStorage
  clearLocalStorage: () => {
    console.log('🎯 BillableAI: Debug - Clearing localStorage');
    localStorage.removeItem('billableAI_emailSummary');
    console.log('🎯 BillableAI: Debug - localStorage cleared');
    
    // Also clear chrome.storage.local
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.remove(['billableAI_emailSummary'], () => {
        console.log('🎯 BillableAI: Debug - chrome.storage.local cleared');
      });
    }
  }
};

// Initialize the notification system
initializeNotificationSystem();

// Log initialization
console.log('🎯 BillableAI: Gmail notification script loaded and ready');
console.log('🎯 BillableAI: Debug functions available at window.billableAIDebug');
console.log('🎯 BillableAI: Use window.billableAIDebug.checkStatus() to check current state');
console.log('🎯 BillableAI: Use window.billableAIDebug.testNotification() to test notification'); 