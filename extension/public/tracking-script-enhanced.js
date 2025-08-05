// BillableAI Enhanced Tracking Script - ENHANCED VERSION
// Enhanced version with improved email capture, notification system, and assistant integration

(function() {
  console.log('🎯 BillableAI: Enhanced tracking script starting... (ENHANCED VERSION)');
  
  // Initialize BillableAI state
  window.billableAIState = {
    isTracking: false,
    startTime: null,
    sessionStartTime: null,
    isPaused: false,
    sessionId: null,
    draftId: null,
    currentEmail: null,
    accumulatedTime: 0,
    lastActivityTime: null,
    userId: 'test_user_123',
    backendUrl: 'http://localhost:3001/api',
    authToken: 'mock_token',
    backendTracking: false,
    gmailApiReady: false,
    trackingNotification: null,
    trackingTimerInterval: null,
    // Enhanced timer state
    timerState: {
      isActive: false,
      startTime: null,
      pausedTime: 0,
      lastPauseTime: null
    },
    // Enhanced email tracking
    emailTracking: {
      isComposing: false,
      composeStartTime: null,
      lastTypingTime: null,
      emailData: null,
      sendButtonDetected: false
    }
  };

  // Check if extension context is valid
  function isExtensionContextValid() {
    return typeof chrome !== 'undefined' && 
           chrome.runtime && 
           chrome.runtime.id && 
           !chrome.runtime.lastError;
  }

  // Enhanced formatTime function (moved to global scope)
  function formatTime(milliseconds) {
    if (!milliseconds || milliseconds < 0) return '0:00';
    
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  // Safe localStorage functions
  function safeLocalStorageSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.log('🎯 BillableAI: localStorage set error:', error.message);
      return false;
    }
  }

  function safeLocalStorageGet(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.log('🎯 BillableAI: localStorage get error:', error.message);
      return defaultValue;
    }
  }

  // Get current elapsed time
  function getCurrentElapsedTime() {
    if (!window.billableAIState.isTracking || !window.billableAIState.startTime) {
      return 0;
    }
    
    const now = Date.now();
    const elapsed = now - window.billableAIState.startTime;
    return Math.max(0, elapsed);
  }

  // Pause timer
  function pauseTimer() {
    if (window.billableAIState.isTracking && !window.billableAIState.isPaused) {
      window.billableAIState.isPaused = true;
      window.billableAIState.accumulatedTime = getCurrentElapsedTime();
      console.log('🎯 BillableAI: Timer paused');
    }
  }

  // Resume timer
  function resumeTimer() {
    if (window.billableAIState.isTracking && window.billableAIState.isPaused) {
      window.billableAIState.isPaused = false;
      window.billableAIState.startTime = Date.now() - window.billableAIState.accumulatedTime;
      console.log('🎯 BillableAI: Timer resumed');
    }
  }

  // Update tracking status
  function updateTrackingStatus() {
    if (!window.billableAIState.isTracking) return;
    
    const elapsed = getCurrentElapsedTime();
    const formattedTime = formatTime(elapsed);
    
    // Update notification if exists
    if (window.billableAIState.trackingNotification) {
      const timeElement = window.billableAIState.trackingNotification.querySelector('.tracking-time');
      if (timeElement) {
        timeElement.textContent = formattedTime;
      }
    }
    
    // Store current time in localStorage
    safeLocalStorageSet('billableai_current_time', elapsed);
  }

  // Start email tracking
  async function startEmailTracking(emailData = {}) {
    try {
      console.log('🎯 BillableAI: Starting email tracking');
      
      // Initialize tracking state
      window.billableAIState.isTracking = true;
      window.billableAIState.startTime = Date.now();
      window.billableAIState.sessionId = 'session_' + Date.now();
      window.billableAIState.draftId = 'draft_' + Date.now();
      window.billableAIState.currentEmail = emailData;
      window.billableAIState.isPaused = false;
      window.billableAIState.accumulatedTime = 0;
      
      // Start timer interval
      window.billableAIState.trackingTimerInterval = setInterval(updateTrackingStatus, 1000);
      
      // Show tracking notification
      showTrackingNotification();
      
      console.log('🎯 BillableAI: Email tracking started');
      return { success: true, sessionId: window.billableAIState.sessionId };
    } catch (error) {
      console.error('🎯 BillableAI: Error starting email tracking:', error);
      return { success: false, error: error.message };
    }
  }

  // Stop email tracking
  async function stopEmailTracking() {
    try {
      console.log('🎯 BillableAI: Stopping email tracking');
      
      if (!window.billableAIState.isTracking) {
        return { success: false, error: 'Not currently tracking' };
      }
      
      // Calculate total time spent
      const totalTime = getCurrentElapsedTime();
      const formattedTime = formatTime(totalTime);
      
      // Stop tracking
      window.billableAIState.isTracking = false;
      window.billableAIState.isPaused = false;
      
      // Clear timer interval
      if (window.billableAIState.trackingTimerInterval) {
        clearInterval(window.billableAIState.trackingTimerInterval);
        window.billableAIState.trackingTimerInterval = null;
      }
      
      // Remove tracking notification
      removeTrackingNotification();
      
      // Create billing entry
      const billingEntry = {
        type: 'email_composition',
        timeSpent: totalTime,
        formattedTime: formattedTime,
        sessionId: window.billableAIState.sessionId,
        draftId: window.billableAIState.draftId,
        emailData: window.billableAIState.currentEmail,
        timestamp: Date.now(),
        summary: `Email composition completed in ${formattedTime}`
      };
      
      // Store billing entry
      const summaries = safeLocalStorageGet('billableai_summaries', []);
      summaries.push(billingEntry);
      safeLocalStorageSet('billableai_summaries', summaries);
      
      console.log('🎯 BillableAI: Email tracking stopped, time spent:', formattedTime);
      
      return {
        success: true,
        timeSpent: totalTime,
        formattedTime: formattedTime,
        billingEntry: billingEntry
      };
    } catch (error) {
      console.error('🎯 BillableAI: Error stopping email tracking:', error);
      return { success: false, error: error.message };
    }
  }

  // Show tracking notification
  function showTrackingNotification() {
    try {
      // Remove existing notification
      removeTrackingNotification();
      
      // Create tracking notification
      const notification = document.createElement('div');
      notification.id = 'billableai-tracking-notification';
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 8px;
      `;
      
      notification.innerHTML = `
        <div style="font-size: 16px;">⏱️</div>
        <div>
          <div style="font-weight: 600;">Tracking Email Composition</div>
          <div class="tracking-time" style="font-size: 12px; opacity: 0.9;">0:00</div>
        </div>
      `;
      
      document.body.appendChild(notification);
      window.billableAIState.trackingNotification = notification;
      
      console.log('🎯 BillableAI: Tracking notification displayed');
    } catch (error) {
      console.error('🎯 BillableAI: Error showing tracking notification:', error);
    }
  }

  // Remove tracking notification
  function removeTrackingNotification() {
    const notification = document.getElementById('billableai-tracking-notification');
    if (notification) {
      notification.remove();
      window.billableAIState.trackingNotification = null;
    }
  }

  // Setup Gmail compose detection
  function setupGmailComposeDetection() {
    try {
      // Monitor for compose window opening
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check if compose window is opened
              const composeWindow = node.querySelector && (
                node.querySelector('[role="dialog"]') ||
                node.querySelector('.Am.Al.editable') ||
                node.querySelector('[data-tooltip="Compose"]')
              );
              
              if (composeWindow && !window.billableAIState.isTracking) {
                console.log('🎯 BillableAI: Compose window detected, starting tracking');
                startComposeTracking();
              }
            }
          });
        });
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      console.log('🎯 BillableAI: Gmail compose detection setup complete');
    } catch (error) {
      console.error('🎯 BillableAI: Gmail compose detection setup error:', error);
    }
  }

  // Start compose tracking
  function startComposeTracking() {
    try {
      // Wait a moment for compose window to fully load
      setTimeout(() => {
        const composeWindow = document.querySelector('[role="dialog"]') || 
                            document.querySelector('.Am.Al.editable');
        
        if (composeWindow) {
          console.log('🎯 BillableAI: Starting compose tracking');
          
          // Start email tracking
          startEmailTracking();
          
          // Setup typing detection
          const contentField = composeWindow.querySelector('[role="textbox"]') ||
                             composeWindow.querySelector('.Am.Al.editable') ||
                             composeWindow.querySelector('[contenteditable="true"]');
          
          if (contentField) {
            setupTypingDetection(contentField);
          }
        }
      }, 500);
    } catch (error) {
      console.error('🎯 BillableAI: Error starting compose tracking:', error);
    }
  }

  // Setup typing detection
  function setupTypingDetection(contentField) {
    try {
      const handleTyping = () => {
        if (window.billableAIState.isTracking && window.billableAIState.isPaused) {
          resumeTimer();
        }
        window.billableAIState.lastActivityTime = Date.now();
      };
      
      contentField.addEventListener('input', handleTyping);
      contentField.addEventListener('keydown', handleTyping);
      contentField.addEventListener('paste', handleTyping);
      
      console.log('🎯 BillableAI: Typing detection setup complete');
    } catch (error) {
      console.error('🎯 BillableAI: Typing detection setup error:', error);
    }
  }

  // Setup Gmail compose detection
  function setupGmailComposeDetection() {
    try {
      // Monitor for compose window opening
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check if compose window is opened
              const composeWindow = node.querySelector && (
                node.querySelector('[role="dialog"]') ||
                node.querySelector('.Am.Al.editable') ||
                node.querySelector('[data-tooltip="Compose"]')
              );
              
              if (composeWindow && !window.billableAIState.isTracking) {
                console.log('🎯 BillableAI: Compose window detected, starting tracking');
                startComposeTracking();
              }
            }
          });
        });
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      console.log('🎯 BillableAI: Gmail compose detection setup complete');
    } catch (error) {
      console.error('🎯 BillableAI: Gmail compose detection setup error:', error);
    }
  }

  // Start compose tracking
  function startComposeTracking() {
    try {
      // Wait a moment for compose window to fully load
      setTimeout(() => {
        const composeWindow = document.querySelector('[role="dialog"]') || 
                            document.querySelector('.Am.Al.editable');
        
        if (composeWindow) {
          console.log('🎯 BillableAI: Starting compose tracking');
          
          // Start email tracking
          startEmailTracking();
          
          // Setup typing detection
          const contentField = composeWindow.querySelector('[role="textbox"]') ||
                             composeWindow.querySelector('.Am.Al.editable') ||
                             composeWindow.querySelector('[contenteditable="true"]');
          
          if (contentField) {
            setupTypingDetection(contentField);
          }
        }
      }, 500);
    } catch (error) {
      console.error('🎯 BillableAI: Error starting compose tracking:', error);
    }
  }

  // Setup typing detection
  function setupTypingDetection(contentField) {
    try {
      const handleTyping = () => {
        if (window.billableAIState.isTracking && window.billableAIState.isPaused) {
          resumeTimer();
        }
        window.billableAIState.lastActivityTime = Date.now();
      };
      
      contentField.addEventListener('input', handleTyping);
      contentField.addEventListener('keydown', handleTyping);
      contentField.addEventListener('paste', handleTyping);
      
      console.log('🎯 BillableAI: Typing detection setup complete');
    } catch (error) {
      console.error('🎯 BillableAI: Typing detection setup error:', error);
    }
  }

  // Initialize tracking
  function initializeTracking() {
    try {
      console.log('🎯 BillableAI: Initializing tracking system...');
      
      // Setup Gmail compose detection
      setupGmailComposeDetection();
      
      // Setup enhanced send button detection
      setupEnhancedSendButtonDetection();
      
      console.log('🎯 BillableAI: Tracking system initialization complete');
    } catch (error) {
      console.error('🎯 BillableAI: Tracking initialization error:', error);
    }
  }

  // Enhanced email data capture
  async function captureEnhancedEmailData() {
    try {
      // Wait for Gmail to process the send action
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const currentEmail = window.billableAIState.currentEmail || {};
      let emailData = {
        to: currentEmail.to || '',
        subject: currentEmail.subject || '',
        content: currentEmail.content || '',
        timestamp: Date.now(),
        sessionId: window.billableAIState.sessionId,
        draftId: window.billableAIState.draftId
      };

      // Enhanced Gmail compose window detection
      const composeSelectors = [
        '[role="dialog"]',
        '.Am.Al.editable',
        '[data-tooltip="Compose"]',
        '.aH9',
        '.aH9c'
      ];

      let composeWindow = null;
      for (const selector of composeSelectors) {
        composeWindow = document.querySelector(selector);
        if (composeWindow) break;
      }

      if (composeWindow) {
        // Enhanced subject field detection
        const subjectSelectors = [
          'input[name="subjectbox"]',
          '[data-tooltip="Subject"]',
          'input[placeholder*="Subject"]',
          'input[aria-label*="Subject"]',
          '.aXjCH input'
        ];

        for (const selector of subjectSelectors) {
          const subjectField = composeWindow.querySelector(selector);
          if (subjectField && subjectField.value) {
            emailData.subject = subjectField.value.trim();
            break;
          }
        }

        // Enhanced recipient field detection
        const recipientSelectors = [
          'input[name="to"]',
          '[data-tooltip="To"]',
          'input[placeholder*="To"]',
          'input[aria-label*="To"]',
          '.aXjCH input[type="text"]'
        ];

        for (const selector of recipientSelectors) {
          const toField = composeWindow.querySelector(selector);
          if (toField && toField.value) {
            emailData.to = toField.value.trim();
            break;
          }
        }

        // Enhanced content field detection
        const contentSelectors = [
          '[role="textbox"]',
          '.Am.Al.editable',
          '[contenteditable="true"]',
          '.aXjCH [contenteditable="true"]',
          '.aXjCH .Am.Al'
        ];

        for (const selector of contentSelectors) {
          const contentField = composeWindow.querySelector(selector);
          if (contentField) {
            const content = contentField.textContent || contentField.innerText || '';
            if (content.trim()) {
              emailData.content = content.trim();
              break;
            }
          }
        }
      }

      // Fallback: try to get data from any visible input fields
      if (!emailData.subject) {
        const subjectInputs = document.querySelectorAll('input[placeholder*="Subject"], input[aria-label*="Subject"]');
        for (const input of subjectInputs) {
          if (input.value && input.offsetParent !== null) {
            emailData.subject = input.value.trim();
            break;
          }
        }
      }

      if (!emailData.to) {
        const toInputs = document.querySelectorAll('input[placeholder*="To"], input[aria-label*="To"]');
        for (const input of toInputs) {
          if (input.value && input.offsetParent !== null) {
            emailData.to = input.value.trim();
            break;
          }
        }
      }

      console.log('🎯 BillableAI: Enhanced email data captured:', emailData);
      return emailData;
    } catch (error) {
      console.error('🎯 BillableAI: Error capturing enhanced email data:', error);
      return {
        to: 'Unknown recipient',
        subject: 'Email sent',
        content: 'Email content not captured',
        timestamp: Date.now(),
        sessionId: window.billableAIState.sessionId,
        draftId: window.billableAIState.draftId
      };
    }
  }

  // Enhanced send button detection
  function setupEnhancedSendButtonDetection() {
    try {
      // Multiple detection methods
      const sendButtonSelectors = [
        '[data-tooltip="Send"]',
        '[aria-label*="Send"]',
        'button[title*="Send"]',
        'div[role="button"][aria-label*="Send"]',
        '.aXjCH [data-tooltip="Send"]',
        '.aXjCH [aria-label*="Send"]',
        'button[data-tooltip="Send"]',
        'div[role="button"][data-tooltip="Send"]'
      ];

      // Monitor for send button clicks
      document.addEventListener('click', async (event) => {
        const target = event.target;
        
        // Check if it's a send button using multiple selectors
        let isSendButton = false;
        for (const selector of sendButtonSelectors) {
          if (target.closest(selector)) {
            isSendButton = true;
            break;
          }
        }

        // Additional checks for send button
        if (!isSendButton) {
          const sendText = target.textContent?.toLowerCase() || '';
          const sendAria = target.getAttribute('aria-label')?.toLowerCase() || '';
          const sendTitle = target.getAttribute('title')?.toLowerCase() || '';
          
          if (sendText.includes('send') || sendAria.includes('send') || sendTitle.includes('send')) {
            isSendButton = true;
          }
        }

        if (isSendButton && window.billableAIState.isTracking) {
          console.log('🎯 BillableAI: Send button clicked - enhanced detection');
          
          // Capture enhanced email data
          const emailData = await captureEnhancedEmailData();
          console.log('🎯 BillableAI: Enhanced email data captured:', emailData);
          
          // Stop tracking and generate summary
          const result = await stopEmailTracking();
          console.log('🎯 BillableAI: Tracking stopped after send:', result);
          
          // Create comprehensive email summary for assistant
          const emailSummary = {
            type: 'email_sent',
            timeSpent: result.timeSpent,
            emailData: emailData,
            summary: result.billingEntry?.summary || 'Email correspondence completed.',
            timestamp: Date.now(),
            sessionId: window.billableAIState.sessionId,
            draftId: window.billableAIState.draftId
          };
          
          // Show enhanced notification with "Open Assistant" button
          showEnhancedEmailSentNotification(emailSummary);
          
          // Store for assistant to access
          storeEnhancedEmailSummaryForAssistant(emailSummary);
        }
      });
      
      console.log('🎯 BillableAI: Enhanced send button detection setup complete');
    } catch (error) {
      console.error('🎯 BillableAI: Enhanced send button detection setup error:', error);
    }
  }

  // Enhanced email sent notification
  function showEnhancedEmailSentNotification(emailSummary) {
    try {
      // Remove existing notification
      const existingNotification = document.getElementById('billableai-email-sent-notification');
      if (existingNotification) {
        existingNotification.remove();
      }
      
      // Create enhanced notification element
      const notification = document.createElement('div');
      notification.id = 'billableai-email-sent-notification';
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        width: 380px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 12px;
        padding: 18px;
        box-shadow: 0 12px 30px rgba(0,0,0,0.3);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        transform: translateX(100%);
        opacity: 0;
        transition: all 0.4s ease;
        border: 1px solid rgba(255,255,255,0.2);
        backdrop-filter: blur(10px);
      `;
      
      // Format time spent
      const timeSpent = formatTime(emailSummary.timeSpent);
      
      // Create enhanced notification content
      notification.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 14px;">
          <div style="flex-shrink: 0; width: 44px; height: 44px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px;">
            📧
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 600; font-size: 15px; margin-bottom: 6px;">
              Email Sent Successfully!
            </div>
            <div style="font-size: 12px; opacity: 0.9; margin-bottom: 10px; line-height: 1.4;">
              <div><strong>To:</strong> ${emailSummary.emailData.to || 'Unknown'}</div>
              <div><strong>Subject:</strong> ${emailSummary.emailData.subject || 'No subject'}</div>
              <div><strong>Time Spent:</strong> ${timeSpent}</div>
            </div>
            <div style="display: flex; gap: 8px; margin-top: 14px;">
              <button id="billableai-open-assistant" style="
                background: rgba(255,255,255,0.2);
                border: 1px solid rgba(255,255,255,0.3);
                color: white;
                padding: 8px 14px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                flex: 1;
              " onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                🤖 Open Assistant
              </button>
              <button id="billableai-close-notification" style="
                background: rgba(255,255,255,0.1);
                border: 1px solid rgba(255,255,255,0.2);
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s ease;
              " onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'">
                ✕
              </button>
            </div>
          </div>
        </div>
      `;
      
      // Add to page
      document.body.appendChild(notification);
      
      // Animate in
      setTimeout(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
      }, 100);
      
      // Handle "Open Assistant" button click
      const openAssistantBtn = notification.querySelector('#billableai-open-assistant');
      openAssistantBtn.addEventListener('click', () => {
        console.log('🎯 BillableAI: Open Assistant button clicked');
        
        // Store data immediately for assistant
        storeEnhancedEmailSummaryForAssistant(emailSummary);
        
        // Show loading state
        openAssistantBtn.textContent = '🔄 Opening...';
        openAssistantBtn.style.opacity = '0.7';
        openAssistantBtn.disabled = true;
        
        // Enhanced assistant opening with multiple fallbacks
        openAssistantWithFallbacks(emailSummary);
      });
      
      // Handle close button click
      const closeBtn = notification.querySelector('#billableai-close-notification');
      closeBtn.addEventListener('click', removeEmailSentNotification);
      
      // Auto-remove after 12 seconds
      setTimeout(removeEmailSentNotification, 12000);
      
      console.log('🎯 BillableAI: Enhanced email sent notification displayed');
    } catch (error) {
      console.error('🎯 BillableAI: Error showing enhanced email sent notification:', error);
    }
  }

  // Enhanced assistant opening with multiple fallbacks
  function openAssistantWithFallbacks(emailSummary) {
    // Method 1: Send message to background script
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      console.log('🎯 BillableAI: Sending OPEN_ASSISTANT message to background script');
      
      chrome.runtime.sendMessage({
        type: 'OPEN_ASSISTANT',
        data: emailSummary
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('🎯 BillableAI: Error sending message to background script:', chrome.runtime.lastError);
          // Fallback to direct popup opening
          tryOpenPopupDirectly();
        } else {
          console.log('🎯 BillableAI: Assistant open response:', response);
          // Also try direct popup opening as backup
          tryOpenPopupDirectly();
        }
        // Remove notification after attempting to open assistant
        setTimeout(removeEmailSentNotification, 1000);
      });
    } else {
      console.log('🎯 BillableAI: Chrome runtime not available, using direct popup');
      tryOpenPopupDirectly();
      setTimeout(removeEmailSentNotification, 1000);
    }
  }

  // Try to open popup directly
  function tryOpenPopupDirectly() {
    try {
      if (typeof chrome !== 'undefined' && chrome.action) {
        chrome.action.openPopup();
        console.log('🎯 BillableAI: Opened popup directly');
      }
    } catch (popupError) {
      console.error('🎯 BillableAI: Failed to open popup directly:', popupError);
      // Final fallback: show enhanced message to user
      showEnhancedFallbackMessage();
    }
  }

  // Enhanced fallback message
  function showEnhancedFallbackMessage() {
    const fallbackMsg = document.createElement('div');
    fallbackMsg.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0,0,0,0.95);
      color: white;
      padding: 24px;
      border-radius: 12px;
      z-index: 10001;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      text-align: center;
      max-width: 400px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.1);
    `;
    fallbackMsg.innerHTML = `
      <div style="margin-bottom: 12px; font-size: 24px;">🤖</div>
      <div style="font-weight: 600; margin-bottom: 10px; font-size: 16px;">Open BillableAI Assistant</div>
      <div style="font-size: 13px; opacity: 0.9; margin-bottom: 16px; line-height: 1.4;">
        Your email data has been saved successfully. Please click the BillableAI extension icon in your browser toolbar to open the assistant and view your email summary.
      </div>
      <button onclick="this.parentElement.remove()" style="
        background: rgba(255,255,255,0.2);
        border: 1px solid rgba(255,255,255,0.3);
        color: white;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
      " onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">Got it</button>
    `;
    document.body.appendChild(fallbackMsg);
    
    // Remove after 10 seconds
    setTimeout(() => {
      if (fallbackMsg.parentNode) {
        fallbackMsg.remove();
      }
    }, 10000);
  }

  // Remove email sent notification
  function removeEmailSentNotification() {
    const notification = document.getElementById('billableai-email-sent-notification');
    if (notification) {
      notification.style.transform = 'translateX(100%)';
      notification.style.opacity = '0';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }
  }

  // Enhanced email summary storage for assistant
  function storeEnhancedEmailSummaryForAssistant(emailSummary) {
    try {
      // Create comprehensive assistant data
      const assistantData = {
        emailData: emailSummary.emailData,
        summary: emailSummary.summary,
        timeSpent: emailSummary.timeSpent,
        timestamp: emailSummary.timestamp,
        sessionId: emailSummary.sessionId,
        draftId: emailSummary.draftId,
        type: 'email_sent',
        source: 'gmail_compose'
      };
      
      // Store in localStorage (primary method)
      localStorage.setItem('billableai_assistant_data', JSON.stringify(assistantData));
      localStorage.setItem('billableai_navigate_to_assistant', 'true');
      
      // Also store in chrome.storage.local if available
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        try {
          chrome.storage.local.set({ 
            'billableai_assistant_data': assistantData,
            'billableai_navigate_to_assistant': true
          }, () => {
            if (chrome.runtime.lastError) {
              console.log('🎯 BillableAI: Chrome storage failed, using localStorage only:', chrome.runtime.lastError.message);
            } else {
              console.log('🎯 BillableAI: Enhanced email summary stored in chrome.storage.local');
            }
          });
        } catch (storageError) {
          console.log('🎯 BillableAI: Chrome storage error, using localStorage only:', storageError.message);
        }
      } else {
        console.log('🎯 BillableAI: Chrome storage not available, using localStorage only');
      }
      
      console.log('🎯 BillableAI: Enhanced email summary stored for assistant:', assistantData);
    } catch (error) {
      console.error('🎯 BillableAI: Error storing enhanced email summary:', error);
    }
  }

  // Initialize enhanced tracking
  function initializeEnhancedTracking() {
    try {
      console.log('🎯 BillableAI: Initializing enhanced tracking...');
      
      // Initialize tracking system
      initializeTracking();
      
      console.log('🎯 BillableAI: Enhanced tracking initialization complete');
    } catch (error) {
      console.error('🎯 BillableAI: Enhanced tracking initialization error:', error);
    }
  }

  // Start enhanced tracking when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEnhancedTracking);
  } else {
    initializeEnhancedTracking();
  }

  // Also initialize when page becomes visible (for Gmail's dynamic loading)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      setTimeout(initializeEnhancedTracking, 1000);
    }
  });

  console.log('🎯 BillableAI: Enhanced tracking script loaded successfully');
})(); 