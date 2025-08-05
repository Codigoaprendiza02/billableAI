// BillableAI Enhanced Tracking Script - FIXED VERSION
// Enhanced version with Gmail API integration and real-time tracking
// FIXED: Timer bug resolved with single source of truth

(function() {
  console.log('🎯 BillableAI: Enhanced tracking script starting... (FIXED VERSION)');
  
  // Initialize BillableAI state
  window.billableAIState = {
    isTracking: false,
    startTime: null,
    sessionStartTime: null, // Track current session start time
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
    // NEW: Single timer state to prevent race conditions
    timerState: {
      isActive: false,
      startTime: null,
      pausedTime: 0,
      lastPauseTime: null
    }
  };

  // Check if extension context is valid
  function isExtensionContextValid() {
    return typeof chrome !== 'undefined' && 
           chrome.runtime && 
           chrome.runtime.id && 
           !chrome.runtime.lastError;
  }

  // Re-initialize extension context if needed
  function reinitializeExtensionContext() {
    try {
      if (!isExtensionContextValid()) {
        console.log('🎯 BillableAI: Extension context invalid, attempting re-initialization...');
        
        // Stop current keep-alive
        stopKeepAlive();
        
        // Restart keep-alive after a short delay
        setTimeout(() => {
          if (isExtensionContextValid()) {
            startKeepAlive();
            console.log('🎯 BillableAI: Extension context re-initialized successfully');
          } else {
            console.log('🎯 BillableAI: Extension context still invalid, continuing with local tracking only');
          }
        }, 1000);
      }
    } catch (error) {
      console.log('🎯 BillableAI: Re-initialization error:', error.message);
    }
  }

  // Keep-alive mechanism for service worker
  let keepAliveInterval = null;

  function startKeepAlive() {
    if (keepAliveInterval) {
      clearInterval(keepAliveInterval);
    }
    
    keepAliveInterval = setInterval(() => {
      try {
        if (isExtensionContextValid()) {
          chrome.runtime.sendMessage({ type: 'KEEP_ALIVE' }, (response) => {
            if (chrome.runtime.lastError) {
              console.log('🎯 BillableAI: Keep-alive failed:', chrome.runtime.lastError.message);
              // Stop keep-alive if extension context is invalid
              stopKeepAlive();
            } else {
              console.log('🎯 BillableAI: Keep-alive ping sent');
            }
          });
        } else {
          console.log('🎯 BillableAI: Chrome runtime not available, stopping keep-alive');
          stopKeepAlive();
        }
      } catch (error) {
        console.log('🎯 BillableAI: Keep-alive error:', error.message);
        // Stop keep-alive if there are persistent errors
        stopKeepAlive();
      }
    }, 25000); // Every 25 seconds
  }

  function stopKeepAlive() {
    if (keepAliveInterval) {
      clearInterval(keepAliveInterval);
      keepAliveInterval = null;
    }
  }

  // Start keep-alive when script loads
  startKeepAlive();

  // Periodic extension context check
  setInterval(() => {
    if (!isExtensionContextValid()) {
      reinitializeExtensionContext();
    }
  }, 30000); // Check every 30 seconds

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

  // Helper function to format time - moved to global scope
  function formatTime(milliseconds) {
    if (!milliseconds || milliseconds <= 0) {
      return '0 minutes';
    }
    
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      const remainingMinutes = minutes % 60;
      if (remainingMinutes > 0) {
        return `${hours}h ${remainingMinutes}m`;
      } else {
        return `${hours}h`;
      }
    } else if (minutes > 0) {
      return `${minutes} minutes`;
    } else {
      return `${seconds} seconds`;
    }
  }

  // FIXED: Single source of truth for timer calculation
  function getCurrentElapsedTime() {
    const timerState = window.billableAIState.timerState;
    
    if (!timerState.isActive || !timerState.startTime) {
      return timerState.pausedTime;
    }
    
    if (window.billableAIState.isPaused) {
      return timerState.pausedTime;
    }
    
    // Calculate current elapsed time
    const currentTime = Date.now();
    const activeTime = currentTime - timerState.startTime;
    return timerState.pausedTime + activeTime;
  }

  // FIXED: Update timer state when pausing
  function pauseTimer() {
    if (!window.billableAIState.isTracking) return;
    
    console.log('🎯 BillableAI: Pausing timer...');
    
    const timerState = window.billableAIState.timerState;
    const currentElapsed = getCurrentElapsedTime();
    
    // Update timer state
    timerState.pausedTime = currentElapsed;
    timerState.lastPauseTime = Date.now();
    
    window.billableAIState.isPaused = true;
    window.billableAIState.accumulatedTime = currentElapsed;
    
    console.log('🎯 BillableAI: Timer paused. Accumulated time:', currentElapsed);
  }

  // FIXED: Update timer state when resuming
  function resumeTimer() {
    if (!window.billableAIState.isTracking || !window.billableAIState.isPaused) return;
    
    console.log('🎯 BillableAI: Resuming timer...');
    
    const timerState = window.billableAIState.timerState;
    
    // Update timer state
    timerState.startTime = Date.now();
    timerState.isActive = true;
    
    window.billableAIState.isPaused = false;
    window.billableAIState.sessionStartTime = Date.now();
    
    console.log('🎯 BillableAI: Timer resumed. Accumulated time:', timerState.pausedTime);
  }

  // Function to update tracking status using only localStorage
  function updateTrackingStatus() {
    try {
      // Use the single source of truth for time calculation
      const currentTime = getCurrentElapsedTime();
      
      const status = {
        isTracking: window.billableAIState.isTracking,
        currentTime: currentTime,
        isPaused: window.billableAIState.isPaused,
        lastUpdated: Date.now(),
        lastActivityTime: window.billableAIState.lastActivityTime,
        sessionId: window.billableAIState.sessionId,
        draftId: window.billableAIState.draftId
      };
      
      safeLocalStorageSet('billableai_trackingStatus', status);
      
      // Send message to background script with error handling
      if (isExtensionContextValid()) {
        try {
          chrome.runtime.sendMessage({
            type: 'TRACKING_STARTED',
            sessionId: window.billableAIState.sessionId,
            draftId: window.billableAIState.draftId
          }, (response) => {
            if (chrome.runtime.lastError) {
              console.log('🎯 BillableAI: Background message failed (non-critical):', chrome.runtime.lastError.message);
              reinitializeExtensionContext();
            }
          });
        } catch (error) {
          console.log('🎯 BillableAI: Extension context error (non-critical):', error.message);
          reinitializeExtensionContext();
        }
      } else {
        console.log('🎯 BillableAI: Extension context not available, using local tracking only');
      }
      
      console.log('🎯 BillableAI: Tracking status updated:', status);
    } catch (error) {
      console.error('🎯 BillableAI: Error updating tracking status:', error);
      // Continue with local tracking even if background communication fails
    }
  }

  // Initialize Gmail API access
  async function initializeGmailApi() {
    try {
      console.log('🎯 BillableAI: Initializing Gmail API...');
      
      // Get Gmail access token from Chrome identity
      if (typeof chrome !== 'undefined' && chrome.identity) {
        chrome.identity.getAuthToken({ interactive: false }, (token) => {
          if (chrome.runtime.lastError) {
            console.log('🎯 BillableAI: Gmail token error:', chrome.runtime.lastError.message);
            window.billableAIState.gmailApiReady = false;
          } else if (token) {
            window.billableAIState.accessToken = token;
            window.billableAIState.gmailApiReady = true;
            console.log('🎯 BillableAI: Gmail API initialized successfully');
          } else {
            console.log('🎯 BillableAI: No Gmail token available');
            window.billableAIState.gmailApiReady = false;
          }
        });
      } else {
        console.log('🎯 BillableAI: Chrome identity not available');
        window.billableAIState.gmailApiReady = false;
      }
    } catch (error) {
      console.error('🎯 BillableAI: Gmail API initialization error:', error);
      window.billableAIState.gmailApiReady = false;
    }
  }

  // Initialize backend authentication
  async function initializeBackendAuth() {
    try {
      console.log('🎯 BillableAI: Initializing backend authentication...');
      
      // For now, use a mock token - in production this would be a real JWT
      window.billableAIState.authToken = 'mock_auth_token_' + Date.now();
      window.billableAIState.isAuthenticated = true;
      
      console.log('🎯 BillableAI: Backend authentication initialized');
    } catch (error) {
      console.error('🎯 BillableAI: Backend authentication error:', error);
      window.billableAIState.isAuthenticated = false;
    }
  }

  // Generate local summary when backend is unavailable
  function generateLocalSummary(billingData) {
    const timeSpentHours = (billingData.timeSpent / 3600000).toFixed(2);
    const emailSubject = billingData.emailData.subject || 'Email correspondence';
    const emailTo = billingData.emailData.to || 'recipient';
    
    return `Email correspondence with ${emailTo} regarding "${emailSubject}". Time spent: ${timeSpentHours} hours. Professional legal communication and document review completed.`;
  }

  // FIXED: Start email tracking with proper timer initialization
  async function startEmailTracking(emailData) {
    try {
      console.log('🎯 BillableAI: Starting email tracking...', emailData);
      
      // Initialize tracking state
      window.billableAIState.isTracking = true;
      window.billableAIState.startTime = Date.now();
      window.billableAIState.sessionStartTime = Date.now();
      window.billableAIState.isPaused = false;
      window.billableAIState.sessionId = `${window.billableAIState.userId}_${Date.now()}`;
      window.billableAIState.draftId = emailData.draftId || `draft_${Date.now()}`;
      window.billableAIState.currentEmail = emailData;
      
      // FIXED: Initialize timer state properly
      const timerState = window.billableAIState.timerState;
      timerState.isActive = true;
      timerState.startTime = Date.now();
      timerState.pausedTime = 0;
      timerState.lastPauseTime = null;
      
      // Show tracking started notification with timer (persistent until stopped)
      showNotificationWithTimer('📧 Email tracking started', 'tracking', 0);
      
      // Update tracking status
      updateTrackingStatus();
      
      // Try backend tracking first
      try {
        const response = await fetch(`${window.billableAIState.backendUrl}/email-tracking/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${window.billableAIState.authToken}`
          },
          body: JSON.stringify({
            to: emailData.to || 'draft@example.com',
            subject: emailData.subject || 'Draft Email',
            content: emailData.content || '',
            from: emailData.from || 'user@example.com',
            sessionId: window.billableAIState.sessionId,
            draftId: window.billableAIState.draftId
          })
        });

        if (response.ok) {
          const result = await response.json();
          console.log('🎯 BillableAI: Backend tracking started successfully:', result);
          window.billableAIState.backendTracking = true;
        } else {
          const errorText = await response.text();
          console.log('🎯 BillableAI: Backend tracking start failed:', response.status, errorText);
          window.billableAIState.backendTracking = false;
        }
      } catch (error) {
        console.log('🎯 BillableAI: Backend tracking unavailable, using local tracking only');
        window.billableAIState.backendTracking = false;
      }
      
      console.log('🎯 BillableAI: Email tracking started successfully');
      return true;
    } catch (error) {
      console.error('🎯 BillableAI: Start email tracking error:', error);
      showNotification('❌ Failed to start email tracking', 'error');
      return false;
    }
  }

  // FIXED: Stop email tracking with proper time calculation
  async function stopEmailTracking() {
    try {
      console.log('🎯 BillableAI: Stopping email tracking...');
      
      // Use single source of truth for time calculation
      const totalTime = getCurrentElapsedTime();
      
      // Stop tracking
      window.billableAIState.isTracking = false;
      window.billableAIState.accumulatedTime = totalTime;
      
      // Clear timer interval
      if (window.billableAIState.trackingTimerInterval) {
        clearInterval(window.billableAIState.trackingTimerInterval);
        window.billableAIState.trackingTimerInterval = null;
      }
      
      // Remove tracking notification
      if (window.billableAIState.trackingNotification && window.billableAIState.trackingNotification.parentNode) {
        try {
          window.billableAIState.trackingNotification.style.opacity = '0';
          window.billableAIState.trackingNotification.style.transform = 'translateX(100%)';
          setTimeout(() => {
            if (window.billableAIState.trackingNotification && window.billableAIState.trackingNotification.parentNode) {
              window.billableAIState.trackingNotification.remove();
            }
          }, 300);
        } catch (error) {
          console.log('🎯 BillableAI: Error removing notification:', error.message);
        }
        window.billableAIState.trackingNotification = null;
      }
      
      // Update tracking status
      updateTrackingStatus();
      
      // Try backend tracking first
      let billingSummary = null;
      try {
        const response = await fetch(`${window.billableAIState.backendUrl}/email-tracking/stop`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${window.billableAIState.authToken}`
          },
          body: JSON.stringify({
            sessionId: window.billableAIState.sessionId,
            draftId: window.billableAIState.draftId,
            totalTime: totalTime,
            emailData: window.billableAIState.currentEmail
          })
        });

        if (response.ok) {
          const result = await response.json();
          billingSummary = result.billingSummary;
          console.log('🎯 BillableAI: Backend tracking stopped successfully:', result);
        } else {
          const errorText = await response.text();
          console.log('🎯 BillableAI: Backend tracking stop failed:', response.status, errorText);
          // Generate local summary as fallback
          billingSummary = generateLocalSummary({ timeSpent: totalTime, emailData: window.billableAIState.currentEmail });
        }
      } catch (error) {
        console.log('🎯 BillableAI: Backend tracking unavailable, using local summary');
        billingSummary = generateLocalSummary({ timeSpent: totalTime, emailData: window.billableAIState.currentEmail });
      }
      
      // Store billing summary for chat
      if (billingSummary) {
        const chatMessages = JSON.parse(localStorage.getItem('billableai_chatMessages') || '[]');
        chatMessages.push({
          type: 'assistant',
          content: `📧 **Email Tracking Complete**\n\n⏱️ **Time Spent:** ${Math.floor(totalTime / 60000)}:${Math.floor((totalTime % 60000) / 1000).toString().padStart(2, '0')}\n\n📝 **Billing Summary:**\n${billingSummary}`,
          timestamp: Date.now()
        });
        localStorage.setItem('billableai_chatMessages', JSON.stringify(chatMessages));
      }
      
      // Send message to background script
      if (isExtensionContextValid()) {
        try {
          chrome.runtime.sendMessage({
            type: 'TRACKING_STOPPED',
            sessionId: window.billableAIState.sessionId,
            draftId: window.billableAIState.draftId,
            billingSummary: billingSummary
          });
        } catch (error) {
          console.log('🎯 BillableAI: Background message failed (non-critical):', error.message);
        }
      }
      
      // Show completion notification
      showNotification('✅ Email tracking completed', 'success');
      
      console.log('🎯 BillableAI: Email tracking stopped successfully');
      return { success: true, billingSummary };
    } catch (error) {
      console.error('🎯 BillableAI: Stop email tracking error:', error);
      showNotification('❌ Failed to stop email tracking', 'error');
      return { success: false, error: error.message };
    }
  }

  // Update email activity (called when user types)
  function updateEmailActivity() {
    try {
      window.billableAIState.lastActivityTime = Date.now();
      
      // Send activity to backend
      if (window.billableAIState.sessionId) {
        fetch(`${window.billableAIState.backendUrl}/email-tracking/activity`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${window.billableAIState.authToken}`
          },
          body: JSON.stringify({
            sessionId: window.billableAIState.sessionId,
            draftId: window.billableAIState.draftId,
            isTyping: true,
            content: window.billableAIState.currentEmail.content,
            timeSpent: getCurrentElapsedTime()
          })
        }).catch(error => {
          console.log('🎯 BillableAI: Activity update failed:', error.message);
        });
      }
      
      // Update tracking status
      updateTrackingStatus();
    } catch (error) {
      console.error('🎯 BillableAI: Update email activity error:', error);
    }
  }

  // One-click billing workflow
  async function oneClickBilling() {
    try {
      console.log('🎯 BillableAI: Starting one-click billing...');
      
      // Stop tracking first
      const stopResult = await stopEmailTracking();
      
      // Call backend one-click billing
      const response = await fetch(`${window.billableAIState.backendUrl}/email-tracking/one-click-billing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${window.billableAIState.authToken}`
        },
        body: JSON.stringify({
          sessionId: window.billableAIState.sessionId,
          draftId: window.billableAIState.draftId,
          emailData: window.billableAIState.currentEmail,
          sendEmail: true
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('🎯 BillableAI: One-click billing completed:', result);
        
        showNotification('Email sent and time logged to Clio!', 'success');
        
        return result;
      } else {
        console.error('🎯 BillableAI: One-click billing failed:', response.status);
        throw new Error('Failed to complete one-click billing');
      }
    } catch (error) {
      console.error('🎯 BillableAI: One-click billing error:', error);
      showNotification('One-click billing failed', 'error');
      throw error;
    }
  }

  // Create notification element
  function createNotificationElement() {
    // Remove existing notification if any
    const existingNotification = document.getElementById('billableai-notification');
    if (existingNotification) {
      existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.id = 'billableai-notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px 20px;
      border-radius: 10px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      max-width: 300px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      transition: all 0.3s ease;
      opacity: 0;
      transform: translateX(100%);
    `;

    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateX(0)';
    }, 100);

    return notification;
  }

  // FIXED: Show notification with timer using single source of truth
  function showNotificationWithTimer(message, type = 'info', duration = 5000) {
    const notification = createNotificationElement();
    
    if (type === 'tracking') {
      // For tracking notifications, use a single timer that updates both notification and state
      const updateTimer = () => {
        // Use single source of truth for time calculation
        const elapsed = getCurrentElapsedTime();
        
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        const statusText = window.billableAIState.isPaused ? ' (PAUSED)' : '';
        const timerDisplay = ` (${minutes}:${seconds.toString().padStart(2, '0')})${statusText}`;
        
        // Update notification content
        notification.innerHTML = `
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="flex: 1;">
              <div style="font-weight: 600; margin-bottom: 5px;">${message}</div>
              <div style="font-size: 12px; opacity: 0.8;">${timerDisplay}</div>
            </div>
            <div style="width: 8px; height: 8px; background: ${window.billableAIState.isPaused ? '#FF9800' : '#4CAF50'}; border-radius: 50%; animation: ${window.billableAIState.isPaused ? 'none' : 'pulse 1s infinite'};"></div>
          </div>
        `;
        
        // Update tracking status to keep everything in sync
        updateTrackingStatus();
      };
      
      // Start the timer interval
      const timerInterval = setInterval(updateTimer, 1000);
      
      // Store references for cleanup
      window.billableAIState.trackingNotification = notification;
      window.billableAIState.trackingTimerInterval = timerInterval;
      
      // Initial update
      updateTimer();
    } else {
      // Regular notification without timer
      notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="flex: 1;">${message}</div>
          <div style="width: 8px; height: 8px; background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'}; border-radius: 50%;"></div>
        </div>
      `;
    }

    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    // Auto-remove after duration (only for non-tracking notifications)
    if (type !== 'tracking' && duration > 0) {
      setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
        }, 300);
      }, duration);
    }

    return notification;
  }

  // Show simple notification
  function showNotification(message, type = 'info', duration = 5000) {
    return showNotificationWithTimer(message, type, duration);
  }

  // Initialize tracking system
  async function initializeTracking() {
    try {
      console.log('🎯 BillableAI: Initializing tracking system...');
      
      // Initialize Gmail API
      await initializeGmailApi();
      
      // Initialize backend authentication
      await initializeBackendAuth();
      
      // Set up Gmail compose detection
      setupGmailComposeDetection();
      
      // Set up send button detection
      setupSendButtonDetection();
      
      console.log('🎯 BillableAI: Tracking system initialized successfully');
    } catch (error) {
      console.error('🎯 BillableAI: Error initializing tracking system:', error);
      // Continue with basic functionality even if initialization fails
    }
  }

  // Setup Gmail compose detection
  function setupGmailComposeDetection() {
    try {
      // Monitor for compose window
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check for compose window
              const composeWindow = node.querySelector('[role="dialog"]') || 
                                   node.querySelector('[data-tooltip="Compose"]') ||
                                   node.querySelector('[aria-label*="Compose"]');
              
              if (composeWindow && !window.billableAIState.isTracking) {
                console.log('🎯 BillableAI: Compose window detected');
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
      
      // Also check for existing compose windows
      const existingCompose = document.querySelector('[role="dialog"]') || 
                             document.querySelector('[data-tooltip="Compose"]') ||
                             document.querySelector('[aria-label*="Compose"]');
      
      if (existingCompose && !window.billableAIState.isTracking) {
        console.log('🎯 BillableAI: Existing compose window detected');
        startComposeTracking();
      }
    } catch (error) {
      console.error('🎯 BillableAI: Compose detection setup error:', error);
    }
  }

  // Start compose tracking
  function startComposeTracking() {
    try {
      // Extract email data from compose window
      const toField = document.querySelector('[name="to"]') || 
                     document.querySelector('[aria-label*="To"]') ||
                     document.querySelector('input[placeholder*="Recipients"]');
      
      const subjectField = document.querySelector('[name="subjectbox"]') || 
                          document.querySelector('[aria-label*="Subject"]') ||
                          document.querySelector('input[placeholder*="Subject"]');
      
      const contentField = document.querySelector('[role="textbox"]') || 
                          document.querySelector('[contenteditable="true"]') ||
                          document.querySelector('div[aria-label*="Message Body"]');
      
      if (contentField) {
        const emailData = {
          to: (toField && toField.value) ? toField.value : 'draft@example.com',
          subject: (subjectField && subjectField.value) ? subjectField.value : 'Draft Email',
          content: contentField.textContent || '',
          from: 'user@gmail.com' // This would be extracted from Gmail profile
        };
        
        console.log('🎯 BillableAI: Starting compose tracking with data:', emailData);
        startEmailTracking(emailData);
        
        // Set up typing detection
        setupTypingDetection(contentField);
        
        // Store current email data for popup display
        safeLocalStorageSet('billableai_currentEmail', emailData);
      } else {
        console.log('🎯 BillableAI: No content field found, cannot start tracking');
      }
    } catch (error) {
      console.error('🎯 BillableAI: Start compose tracking error:', error);
    }
  }

  // FIXED: Setup typing detection with proper pause/resume logic
  function setupTypingDetection(contentField) {
    try {
      let typingTimeout;
      let isPaused = false;
      
      const handleTyping = () => {
        // Clear existing timeout
        if (typingTimeout) {
          clearTimeout(typingTimeout);
        }
        
        // Update email content
        window.billableAIState.currentEmail.content = contentField.textContent || '';
        
        // Update activity
        updateEmailActivity();
        
        // If was paused, resume tracking
        if (isPaused) {
          console.log('🎯 BillableAI: Typing resumed, continuing tracking');
          isPaused = false;
          resumeTimer();
        }
        
        // Set timeout to pause tracking after 5 seconds of inactivity
        typingTimeout = setTimeout(() => {
          if (window.billableAIState.isTracking) {
            console.log('🎯 BillableAI: Typing stopped, pausing tracking');
            isPaused = true;
            pauseTimer();
          }
        }, 5000);
      };
      
      // Add event listeners
      contentField.addEventListener('input', handleTyping);
      contentField.addEventListener('keydown', handleTyping);
      contentField.addEventListener('paste', handleTyping);
      
      console.log('🎯 BillableAI: Typing detection setup complete');
    } catch (error) {
      console.error('🎯 BillableAI: Typing detection setup error:', error);
    }
  }

  // Setup send button detection
  function setupSendButtonDetection() {
    try {
      // Monitor for send button clicks
      document.addEventListener('click', (event) => {
        const target = event.target;
        
        // Check if it's a send button
        const isSendButton = target.closest('[data-tooltip="Send"]') ||
                            target.closest('[aria-label*="Send"]') ||
                            target.closest('button[title*="Send"]') ||
                            target.closest('div[role="button"][aria-label*="Send"]');
        
        if (isSendButton && window.billableAIState.isTracking) {
          console.log('🎯 BillableAI: Send button clicked');
          
          // Capture complete email data before sending
          captureEmailDataAndSend().then((emailData) => {
            console.log('🎯 BillableAI: Email data captured:', emailData);
            
            // Stop tracking and generate summary
            stopEmailTracking().then((result) => {
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
              
              // Show notification with "Open Assistant" button
              showEmailSentNotification(emailSummary);
              
              // Store for assistant to access
              storeEmailSummaryForAssistant(emailSummary);
              
            }).catch((error) => {
              console.error('🎯 BillableAI: Error stopping tracking after send:', error);
            });
          }).catch((error) => {
            console.error('🎯 BillableAI: Error capturing email data:', error);
          });
        }
      });
      
      console.log('🎯 BillableAI: Enhanced send button detection setup complete');
    } catch (error) {
      console.error('🎯 BillableAI: Send button detection setup error:', error);
    }
  }

  // Capture complete email data before sending
  async function captureEmailDataAndSend() {
    try {
      // Wait a moment for Gmail to process the send action
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get current email data
      const currentEmail = window.billableAIState.currentEmail || {};
      
      // Try to capture additional data from Gmail compose window
      const composeWindow = document.querySelector('[role="dialog"]') || document.querySelector('.Am.Al.editable');
      let emailContent = currentEmail.content || '';
      let emailSubject = currentEmail.subject || '';
      let emailTo = currentEmail.to || '';
      
      if (composeWindow) {
        // Try to get subject
        const subjectField = composeWindow.querySelector('input[name="subjectbox"]') || 
                           composeWindow.querySelector('[data-tooltip="Subject"]') ||
                           composeWindow.querySelector('input[placeholder*="Subject"]');
        if (subjectField) {
          emailSubject = subjectField.value || emailSubject;
        }
        
        // Try to get recipient
        const toField = composeWindow.querySelector('input[name="to"]') ||
                       composeWindow.querySelector('[data-tooltip="To"]') ||
                       composeWindow.querySelector('input[placeholder*="To"]');
        if (toField) {
          emailTo = toField.value || emailTo;
        }
        
        // Try to get content
        const contentField = composeWindow.querySelector('[role="textbox"]') ||
                           composeWindow.querySelector('.Am.Al.editable') ||
                           composeWindow.querySelector('[contenteditable="true"]');
        if (contentField) {
          emailContent = contentField.textContent || contentField.innerText || emailContent;
        }
      }
      
      return {
        to: emailTo,
        subject: emailSubject,
        content: emailContent,
        timestamp: Date.now(),
        sessionId: window.billableAIState.sessionId,
        draftId: window.billableAIState.draftId
      };
    } catch (error) {
      console.error('🎯 BillableAI: Error capturing email data:', error);
      return window.billableAIState.currentEmail || {
        to: 'Unknown recipient',
        subject: 'Email sent',
        content: 'Email content not captured',
        timestamp: Date.now()
      };
    }
  }

  // Show email sent notification with "Open Assistant" button
  function showEmailSentNotification(emailSummary) {
    try {
      // Remove existing notification
      const existingNotification = document.getElementById('billableai-email-sent-notification');
      if (existingNotification) {
        existingNotification.remove();
      }
      
      // Create notification element
      const notification = document.createElement('div');
      notification.id = 'billableai-email-sent-notification';
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        width: 350px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.3);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        transform: translateX(100%);
        opacity: 0;
        transition: all 0.3s ease;
        border: 1px solid rgba(255,255,255,0.2);
      `;
      
        // Format time spent
        const timeSpent = formatTime(emailSummary.timeSpent);
      
      // Create notification content
      notification.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 12px;">
          <div style="flex-shrink: 0; width: 40px; height: 40px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px;">
            📧
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">
              Email Sent Successfully!
            </div>
            <div style="font-size: 12px; opacity: 0.9; margin-bottom: 8px;">
              <div><strong>To:</strong> ${emailSummary.emailData.to || 'Unknown'}</div>
              <div><strong>Subject:</strong> ${emailSummary.emailData.subject || 'No subject'}</div>
              <div><strong>Time Spent:</strong> ${timeSpent}</div>
            </div>
            <div style="display: flex; gap: 8px; margin-top: 12px;">
              <button id="billableai-open-assistant" style="
                background: rgba(255,255,255,0.2);
                border: 1px solid rgba(255,255,255,0.3);
                color: white;
                padding: 6px 12px;
                border-radius: 6px;
                font-size: 11px;
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
                padding: 6px 12px;
                border-radius: 6px;
                font-size: 11px;
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
        storeEmailSummaryForAssistant(emailSummary);
        
        // Show loading state
        openAssistantBtn.textContent = '🔄 Opening...';
        openAssistantBtn.style.opacity = '0.7';
        openAssistantBtn.disabled = true;
        
        // First, try to send message to background script
        if (typeof chrome !== 'undefined' && chrome.runtime) {
          console.log('🎯 BillableAI: Sending OPEN_ASSISTANT message to background script');
          
          chrome.runtime.sendMessage({
            type: 'OPEN_ASSISTANT',
            data: emailSummary
          }, (response) => {
            if (chrome.runtime.lastError) {
              console.error('🎯 BillableAI: Error sending message to background script:', chrome.runtime.lastError);
              // Fallback: try to open popup directly
              tryOpenPopupAsFallback();
            } else {
              console.log('🎯 BillableAI: Assistant open response:', response);
              // Try to open popup as well
              tryOpenPopupAsFallback();
            }
            // Remove notification after attempting to open assistant
            setTimeout(removeEmailSentNotification, 1000);
          });
        } else {
          console.log('🎯 BillableAI: Chrome runtime not available, using fallback');
          tryOpenPopupAsFallback();
          setTimeout(removeEmailSentNotification, 1000);
        }
      });
      
      // Function to try opening popup as fallback
      function tryOpenPopupAsFallback() {
        try {
          if (typeof chrome !== 'undefined' && chrome.action) {
            chrome.action.openPopup();
            console.log('🎯 BillableAI: Opened popup as fallback');
          }
        } catch (popupError) {
          console.error('🎯 BillableAI: Failed to open popup:', popupError);
          // Final fallback: show a message to user
          showFallbackMessage();
        }
      }

      // Function to show fallback message
      function showFallbackMessage() {
        const fallbackMsg = document.createElement('div');
        fallbackMsg.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0,0,0,0.9);
          color: white;
          padding: 20px;
          border-radius: 8px;
          z-index: 10001;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          text-align: center;
          max-width: 350px;
        `;
        fallbackMsg.innerHTML = `
          <div style="margin-bottom: 10px;">🤖</div>
          <div style="font-weight: 600; margin-bottom: 8px;">Open BillableAI Assistant</div>
          <div style="font-size: 12px; opacity: 0.8; margin-bottom: 12px;">
            Your email data has been saved. Please click the BillableAI extension icon in your browser toolbar to open the assistant.
          </div>
          <button onclick="this.parentElement.remove()" style="
            background: rgba(255,255,255,0.2);
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 11px;
            cursor: pointer;
          ">Got it</button>
        `;
        document.body.appendChild(fallbackMsg);
        
        // Remove after 8 seconds
        setTimeout(() => {
          if (fallbackMsg.parentNode) {
            fallbackMsg.remove();
          }
        }, 8000);
      }
      
      // Handle close button click
      const closeBtn = notification.querySelector('#billableai-close-notification');
      closeBtn.addEventListener('click', removeEmailSentNotification);
      
      // Auto-remove after 10 seconds
      setTimeout(removeEmailSentNotification, 10000);
      
      console.log('🎯 BillableAI: Email sent notification displayed');
    } catch (error) {
      console.error('🎯 BillableAI: Error showing email sent notification:', error);
    }
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

  // Store email summary for assistant to access
  function storeEmailSummaryForAssistant(emailSummary) {
    try {
      // Store in localStorage for assistant to access
      const assistantData = {
        emailData: emailSummary.emailData,
        summary: emailSummary.summary,
        timeSpent: emailSummary.timeSpent,
        timestamp: emailSummary.timestamp,
        sessionId: emailSummary.sessionId,
        draftId: emailSummary.draftId
      };
      
      // Store in localStorage (this should always work)
      safeLocalStorageSet('billableai_assistant_data', assistantData);
      
      // Also store in chrome.storage.local if available and context is valid
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local && isExtensionContextValid()) {
        try {
          chrome.storage.local.set({ 'billableai_assistant_data': assistantData }, () => {
            if (chrome.runtime.lastError) {
              console.log('🎯 BillableAI: Chrome storage failed, using localStorage only:', chrome.runtime.lastError.message);
            } else {
              console.log('🎯 BillableAI: Email summary stored in chrome.storage.local');
            }
          });
        } catch (storageError) {
          console.log('🎯 BillableAI: Chrome storage error, using localStorage only:', storageError.message);
        }
      } else {
        console.log('🎯 BillableAI: Chrome storage not available, using localStorage only');
      }
      
      console.log('🎯 BillableAI: Email summary stored for assistant:', assistantData);
    } catch (error) {
      console.error('🎯 BillableAI: Error storing email summary for assistant:', error);
      // Even if there's an error, try to store at least in localStorage
      try {
        const assistantData = {
          emailData: emailSummary.emailData,
          summary: emailSummary.summary,
          timeSpent: emailSummary.timeSpent,
          timestamp: emailSummary.timestamp,
          sessionId: emailSummary.sessionId,
          draftId: emailSummary.draftId
        };
        localStorage.setItem('billableai_assistant_data', JSON.stringify(assistantData));
        console.log('🎯 BillableAI: Fallback storage in localStorage successful');
      } catch (fallbackError) {
        console.error('🎯 BillableAI: Fallback storage also failed:', fallbackError);
      }
    }
  }

  // Show summary in chat window
  function showSummaryInChat(result) {
    try {
      // Create a message to be displayed in the chat
      const summaryMessage = {
        type: 'billing_summary',
        timeSpent: result.timeSpent,
        emailData: window.billableAIState.currentEmail,
        summary: result.billingEntry?.summary || 'Email correspondence completed.',
        timestamp: Date.now(),
        timeSpent: result.timeSpent
      };
      
      // Store in localStorage for chat to pick up
      const chatMessages = safeLocalStorageGet('billableai_chatMessages', []);
      chatMessages.push(summaryMessage);
      safeLocalStorageSet('billableai_chatMessages', chatMessages);
      
      console.log('🎯 BillableAI: Summary message stored for chat:', summaryMessage);
    } catch (error) {
      console.error('🎯 BillableAI: Show summary in chat error:', error);
    }
  }

  // Expose functions to window for external access
  window.billableAI = {
    startTracking: startEmailTracking,
    stopTracking: stopEmailTracking,
    oneClickBilling: oneClickBilling,
    showNotification: showNotification,
    updateTrackingStatus: updateTrackingStatus,
    getState: () => window.billableAIState
  };

  // Listen for messages from popup/background
  if (isExtensionContextValid()) {
    try {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log('🎯 BillableAI: Received message:', message);
        
        // Handle sync responses immediately
        if (message.type === 'GET_STATE') {
          sendResponse(window.billableAIState);
          return false; // No async response needed
        }
        
        // Handle async responses
        if (message.type === 'ONE_CLICK_BILLING') {
          oneClickBilling().then(result => {
            try {
              sendResponse(result);
            } catch (error) {
              console.log('🎯 BillableAI: Response already sent for ONE_CLICK_BILLING');
            }
          }).catch(error => {
            console.error('🎯 BillableAI: One-click billing error:', error);
            try {
              sendResponse({ success: false, error: error.message });
            } catch (responseError) {
              console.log('🎯 BillableAI: Response already sent for ONE_CLICK_BILLING error');
            }
          });
          return true; // Keep message channel open
        }
        
        if (message.type === 'START_TRACKING') {
          if (window.billableAIState.currentEmail) {
            startEmailTracking(window.billableAIState.currentEmail).then(result => {
              try {
                sendResponse(result);
              } catch (error) {
                console.log('🎯 BillableAI: Response already sent for START_TRACKING');
              }
            }).catch(error => {
              console.error('🎯 BillableAI: Start tracking error:', error);
              try {
                sendResponse({ success: false, error: error.message });
              } catch (responseError) {
                console.log('🎯 BillableAI: Response already sent for START_TRACKING error');
              }
            });
            return true; // Keep message channel open
          } else {
            sendResponse({ success: false, error: 'No email data available' });
            return false; // No async response needed
          }
        }
        
        if (message.type === 'STOP_TRACKING') {
          stopEmailTracking().then(result => {
            try {
              sendResponse(result);
            } catch (error) {
              console.log('🎯 BillableAI: Response already sent for STOP_TRACKING');
            }
          }).catch(error => {
            console.error('🎯 BillableAI: Stop tracking error:', error);
            try {
              sendResponse({ success: false, error: error.message });
            } catch (responseError) {
              console.log('🎯 BillableAI: Response already sent for STOP_TRACKING error');
            }
          });
          return true; // Keep message channel open
        }
        
        // Default response for unknown message types
        sendResponse({ success: false, error: 'Unknown message type' });
        return false; // No async response needed
      });
    } catch (error) {
      console.log('🎯 BillableAI: Extension context error, using local tracking only:', error.message);
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTracking);
  } else {
    initializeTracking();
  }

  console.log('🎯 BillableAI: Enhanced tracking script loaded successfully (FIXED VERSION)');
})(); 