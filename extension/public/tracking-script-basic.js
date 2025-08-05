// BillableAI Enhanced Tracking Script
// Enhanced version with Gmail API integration and real-time tracking

(function() {
  console.log('🎯 BillableAI: Enhanced tracking script starting...');
  
  // Initialize BillableAI state
  window.billableAIState = {
    isTracking: false,
    isPaused: false,
    sessionId: null,
    draftId: null,
    currentEmail: null,
    lastActivityTime: null,
    userId: 'test_user_123',
    backendUrl: 'http://localhost:3001/api',
    authToken: null,
    user: null,
    isAuthenticated: false,
    backendTracking: false,
    gmailApiReady: false,
    trackingNotification: null,
    trackingTimerInterval: null,
    // FIXED: Single timer state to prevent race conditions
    timerState: {
      isActive: false,
      startTime: null,
      pausedTime: 0,
      lastPauseTime: null
    }
  };

  // Enhanced authentication persistence using Chrome storage
  async function loadPersistentAuth() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const result = await chrome.storage.local.get([
          'billableai_auth_token',
          'billableai_user_data',
          'billableai_auth_expiry'
        ]);

        if (result.billableai_auth_token && result.billableai_user_data) {
          window.billableAIState.authToken = result.billableai_auth_token;
          window.billableAIState.user = JSON.parse(result.billableai_user_data);
          
          // Check if token is expired
          if (result.billableai_auth_expiry) {
            const expiryTime = new Date(result.billableai_auth_expiry).getTime();
            const now = Date.now();
            
            if (now >= expiryTime) {
              console.log('🎯 BillableAI: Stored token has expired');
              await clearPersistentAuth();
              return false;
            }
          }
          
          window.billableAIState.isAuthenticated = true;
          console.log('🎯 BillableAI: Authentication loaded from Chrome storage');
          return true;
        }
      }
      
      // Fallback to localStorage
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        window.billableAIState.authToken = token;
        window.billableAIState.user = JSON.parse(userData);
        window.billableAIState.isAuthenticated = true;
        
        // Migrate to Chrome storage
        await savePersistentAuth(token, JSON.parse(userData));
        console.log('🎯 BillableAI: Migrated auth from localStorage to Chrome storage');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('🎯 BillableAI: Error loading persistent auth:', error);
      return false;
    }
  }

  // Save authentication to Chrome storage
  async function savePersistentAuth(token, user) {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const authData = {
          billableai_auth_token: token,
          billableai_user_data: JSON.stringify(user),
          billableai_auth_expiry: user?.tokenExpiry || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };

        await chrome.storage.local.set(authData);
        console.log('🎯 BillableAI: Auth saved to Chrome storage');
      } else {
        // Fallback to localStorage
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
        console.log('🎯 BillableAI: Auth saved to localStorage');
      }
    } catch (error) {
      console.error('🎯 BillableAI: Error saving persistent auth:', error);
    }
  }

  // Clear authentication from all storage
  async function clearPersistentAuth() {
    try {
      window.billableAIState.authToken = null;
      window.billableAIState.user = null;
      window.billableAIState.isAuthenticated = false;

      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.remove([
          'billableai_auth_token',
          'billableai_user_data',
          'billableai_auth_expiry'
        ]);
      }

      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      console.log('🎯 BillableAI: Auth cleared from all storage');
    } catch (error) {
      console.error('🎯 BillableAI: Error clearing persistent auth:', error);
    }
  }

  // Get authentication headers
  function getAuthHeaders() {
    if (!window.billableAIState.authToken) {
      return {
        'Content-Type': 'application/json'
      };
    }
    return {
      'Authorization': `Bearer ${window.billableAIState.authToken}`,
      'Content-Type': 'application/json'
    };
  }

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
      safeSendMessage({ type: 'KEEP_ALIVE' }, (response, error) => {
        if (error) {
          console.log('🎯 BillableAI: Keep-alive failed:', error.message);
          // Stop keep-alive if extension context is invalid
          stopKeepAlive();
            } else {
          // Only log keep-alive occasionally to reduce spam
          const now = Date.now();
          if (!window.billableAIState.lastKeepAliveLog || (now - window.billableAIState.lastKeepAliveLog) > 60000) {
              console.log('🎯 BillableAI: Keep-alive ping sent');
            window.billableAIState.lastKeepAliveLog = now;
            }
        }
      });
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

  // Safe Chrome storage wrapper functions
  const safeChromeStorageSet = (key, value) => {
    return new Promise((resolve) => {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local && chrome.runtime && chrome.runtime.id) {
          chrome.storage.local.set({ [key]: value }, () => {
            if (chrome.runtime.lastError) {
              console.log('🎯 BillableAI: Chrome storage error (non-critical):', chrome.runtime.lastError.message);
              resolve(false);
            } else {
              resolve(true);
            }
          });
        } else {
          console.log('🎯 BillableAI: Chrome storage not available, using localStorage only');
          resolve(false);
        }
      } catch (error) {
        console.log('🎯 BillableAI: Chrome storage error (non-critical):', error.message);
        resolve(false);
      }
    });
  };

  const safeChromeStorageGet = (key) => {
    return new Promise((resolve) => {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local && chrome.runtime && chrome.runtime.id) {
          chrome.storage.local.get([key], (result) => {
            if (chrome.runtime.lastError) {
              console.log('🎯 BillableAI: Chrome storage error (non-critical):', chrome.runtime.lastError.message);
              resolve(null);
            } else {
              resolve(result[key] || null);
            }
          });
        } else {
          console.log('🎯 BillableAI: Chrome storage not available, using localStorage only');
          resolve(null);
        }
      } catch (error) {
        console.log('🎯 BillableAI: Chrome storage error (non-critical):', error.message);
        resolve(null);
      }
    });
  };

  // Safe Chrome runtime message sender
  function safeSendMessage(message, callback = null) {
    try {
      if (isExtensionContextValid()) {
        chrome.runtime.sendMessage(message, (response) => {
          if (chrome.runtime.lastError) {
            console.log('🎯 BillableAI: Message failed:', chrome.runtime.lastError.message);
            if (callback) callback(null, chrome.runtime.lastError);
          } else {
            if (callback) callback(response, null);
          }
        });
        return true;
      } else {
        console.log('🎯 BillableAI: Extension context invalid, skipping message');
        if (callback) callback(null, new Error('Extension context invalid'));
        return false;
      }
    } catch (error) {
      console.log('🎯 BillableAI: Send message error:', error.message);
      if (callback) callback(null, error);
      return false;
    }
  }

  // Enhanced safe message sender with retry and fallback
  function safeSendMessageWithFallback(message, callback = null) {
    try {
      if (isExtensionContextValid()) {
        chrome.runtime.sendMessage(message, (response) => {
          if (chrome.runtime.lastError) {
            console.log('🎯 BillableAI: Message failed, using fallback:', chrome.runtime.lastError.message);
            // Store message intent in localStorage as fallback
            localStorage.setItem('billableai_last_message', JSON.stringify({
              message: message,
              timestamp: Date.now()
            }));
            if (callback) callback(null, chrome.runtime.lastError);
          } else {
            if (callback) callback(response, null);
          }
        });
        return true;
      } else {
        console.log('🎯 BillableAI: Extension context invalid, using localStorage fallback');
        // Store message intent in localStorage as fallback
        localStorage.setItem('billableai_last_message', JSON.stringify({
          message: message,
          timestamp: Date.now()
        }));
        if (callback) callback(null, new Error('Extension context invalid'));
        return false;
      }
    } catch (error) {
      console.log('🎯 BillableAI: Send message error, using localStorage fallback:', error.message);
      // Store message intent in localStorage as fallback
      localStorage.setItem('billableai_last_message', JSON.stringify({
        message: message,
        timestamp: Date.now()
      }));
      if (callback) callback(null, error);
      return false;
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
    
    console.log('🎯 BillableAI: Timer resumed. Accumulated time:', timerState.pausedTime);
  }

  // Function to update tracking status using only localStorage
  // Throttle tracking status updates to prevent spam
  let lastStatusUpdate = 0;
  const STATUS_UPDATE_THROTTLE = 5000; // Only update every 5 seconds

  function updateTrackingStatus(force = false) {
    try {
      const now = Date.now();
      
      // Throttle updates unless forced
      if (!force && (now - lastStatusUpdate) < STATUS_UPDATE_THROTTLE) {
        return;
      }
      
      lastStatusUpdate = now;
      
      // FIXED: Use single source of truth for time calculation
      const currentTime = getCurrentElapsedTime();
      
      const status = {
        isTracking: window.billableAIState.isTracking,
        currentTime: currentTime,
        isPaused: window.billableAIState.isPaused,
        lastUpdated: now,
        lastActivityTime: window.billableAIState.lastActivityTime,
        sessionId: window.billableAIState.sessionId,
        draftId: window.billableAIState.draftId
      };
      
      safeLocalStorageSet('billableai_trackingStatus', status);
      
      // Only send background message if tracking is active
      if (window.billableAIState.isTracking) {
        safeSendMessage({
          type: 'TRACKING_STARTED',
          sessionId: window.billableAIState.sessionId,
          draftId: window.billableAIState.draftId
        }, (response, error) => {
          if (error) {
            console.log('🎯 BillableAI: Background message failed (non-critical):', error.message);
            reinitializeExtensionContext();
          }
        });
      }
      
      // Only log if forced or if status changed significantly
      if (force || window.billableAIState.isTracking) {
        console.log('🎯 BillableAI: Tracking status updated:', status);
      }
    } catch (error) {
      console.error('🎯 BillableAI: Error updating tracking status:', error);
      // Continue with local tracking even if background communication fails
    }
  }

  // Start timer interval for real-time updates
  function startTimerInterval() {
    // Only start if we don't already have a tracking timer running
    if (!window.billableAIState.trackingTimerInterval) {
      window.billableAIState.trackingTimerInterval = setInterval(() => {
        // Only update if actively tracking (not paused)
        if (window.billableAIState.isTracking && !window.billableAIState.isPaused) {
          // Don't call updateTrackingStatus here since it's handled by the notification timer
          // This prevents double updates
        }
      }, 1000);
    }
  }

  // Stop timer interval
  function stopTimerInterval() {
    if (window.billableAIState.timerInterval) {
      clearInterval(window.billableAIState.timerInterval);
      window.billableAIState.timerInterval = null;
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

  // Test Gmail API functionality
  async function testGmailApi() {
    try {
      if (!window.billableAIState.accessToken) {
        console.log('🎯 BillableAI: No Gmail access token available');
        return false;
      }

      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
        headers: {
          'Authorization': `Bearer ${window.billableAIState.accessToken}`
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const profile = await response.json();
        console.log('🎯 BillableAI: Gmail API test successful:', profile.emailAddress);
        return true;
      } else {
        console.log('🎯 BillableAI: Gmail API test failed:', response.status);
        return false;
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('🎯 BillableAI: Gmail API test timed out');
      } else {
        console.error('🎯 BillableAI: Gmail API test error:', error);
      }
      return false;
    }
  }

  // Initialize backend authentication
  async function initializeBackendAuth() {
    try {
      console.log('🎯 BillableAI: Initializing backend authentication...');
      
      // Load persistent authentication
      const authLoaded = await loadPersistentAuth();
      
      if (authLoaded && window.billableAIState.authToken) {
        console.log('🎯 BillableAI: Authentication loaded from persistent storage');
        
        // Verify token with backend
        try {
          const response = await fetch(`${window.billableAIState.backendUrl}/auth/verify`, {
            method: 'GET',
            headers: getAuthHeaders()
          });

          if (!response.ok) {
            console.log('🎯 BillableAI: Stored token is invalid, clearing authentication');
            await clearPersistentAuth();
            window.billableAIState.isAuthenticated = false;
          } else {
            console.log('🎯 BillableAI: Stored token is valid');
            window.billableAIState.isAuthenticated = true;
          }
        } catch (error) {
          console.log('🎯 BillableAI: Token verification failed, using stored token:', error.message);
          // Use stored token even if verification fails (network issues)
          window.billableAIState.isAuthenticated = true;
        }
      } else {
        console.log('🎯 BillableAI: No persistent authentication found, starting fresh');
        window.billableAIState.isAuthenticated = false;
        // Don't try to verify if no token exists
      }
      
      console.log('🎯 BillableAI: Backend authentication initialized');
    } catch (error) {
      console.error('🎯 BillableAI: Backend authentication error:', error);
      window.billableAIState.isAuthenticated = false;
    }
  }

  // Generate local summary when backend is unavailable
  function generateLocalSummary(billingData) {
    try {
      const timeSpentMinutes = Math.floor(billingData.timeSpent / 60000);
      const timeSpentSeconds = Math.floor((billingData.timeSpent % 60000) / 1000);
      const timeDisplay = `${timeSpentMinutes}:${timeSpentSeconds.toString().padStart(2, '0')}`;
      const timeSpentHours = (billingData.timeSpent / 3600000).toFixed(2);
      
      // Handle different data structures safely
      let emailSubject = 'Email correspondence';
      let emailTo = 'recipient';
      
      if (billingData.emailData) {
        emailSubject = billingData.emailData.subject || emailSubject;
        emailTo = billingData.emailData.to || emailTo;
      } else if (billingData.subject) {
        emailSubject = billingData.subject;
      }
      
      return `📧 **Email Correspondence Summary**

**Recipient:** ${emailTo}
**Subject:** ${emailSubject}
**Time Spent:** ${timeDisplay} (${timeSpentHours} hours)

**Description:** Professional legal communication and document review completed. Email correspondence involved client consultation, legal advice, and case management activities.

**Billing Category:** Legal Correspondence & Client Communication
**Activity Type:** Email drafting, review, and client communication

This time entry represents professional legal services rendered through email correspondence.`;
    } catch (error) {
      console.error('🎯 BillableAI: Error generating local summary:', error);
      return `📧 **Email Correspondence Summary**

**Time Spent:** ${Math.floor(billingData.timeSpent / 60000)}:${Math.floor((billingData.timeSpent % 60000) / 1000).toString().padStart(2, '0')}

**Description:** Professional legal communication and document review completed.

**Billing Category:** Legal Correspondence & Client Communication
**Activity Type:** Email drafting, review, and client communication`;
    }
  }

  // Start email tracking
  async function startEmailTracking(emailData) {
    try {
      console.log('🎯 BillableAI: Starting email tracking...', emailData);
      
      // Initialize tracking state
      window.billableAIState.isTracking = true;
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
      
             // Timer will be started by the notification system
      
      // Show tracking started notification with timer (persistent until stopped)
      showNotificationWithTimer('📧 Email tracking started', 'tracking', 0); // 0 duration = keep until stopped
      
      // Update tracking status
      updateTrackingStatus();
      
      // Try backend tracking first (only if authenticated)
      if (window.billableAIState.isAuthenticated) {
        try {
          const response = await fetch(`${window.billableAIState.backendUrl}/email-tracking/start`, {
            method: 'POST',
            headers: getAuthHeaders(),
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
      } else {
        console.log('🎯 BillableAI: Not authenticated, using local tracking only');
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

  // Stop email tracking
  async function stopEmailTracking(generateSummary = true) {
    try {
      console.log('🎯 BillableAI: Stopping email tracking...');
      
      // FIXED: Use single source of truth for time calculation
      const totalTime = getCurrentElapsedTime();
      
      // Stop tracking
      window.billableAIState.isTracking = false;
      
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
      
      let billingSummary = null;
      
      // Only generate billing summary if requested (e.g., when send button is clicked)
      if (generateSummary) {
        // Try backend tracking first (only if authenticated)
        if (window.billableAIState.isAuthenticated) {
          try {
            const response = await fetch(`${window.billableAIState.backendUrl}/email-tracking/stop`, {
              method: 'POST',
              headers: getAuthHeaders(),
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
            console.log('🎯 BillableAI: Backend billingSummary type:', typeof billingSummary, billingSummary);
                         } else {
                 const errorText = await response.text();
                 console.log('🎯 BillableAI: Backend tracking stop failed:', response.status, errorText);
                 // Generate local summary as fallback
                 billingSummary = generateLocalSummary({ 
                   emailData: window.billableAIState.currentEmail, 
                   timeSpent: totalTime 
                 });
                 console.log('🎯 BillableAI: Local billingSummary type:', typeof billingSummary, billingSummary);
               }
             } catch (error) {
               console.log('🎯 BillableAI: Backend tracking unavailable, using local summary');
               billingSummary = generateLocalSummary({ 
                 emailData: window.billableAIState.currentEmail, 
                 timeSpent: totalTime 
               });
               console.log('🎯 BillableAI: Local billingSummary type (catch):', typeof billingSummary, billingSummary);
             }
          } else {
            console.log('🎯 BillableAI: Not authenticated, using local summary only');
            billingSummary = generateLocalSummary({ 
              emailData: window.billableAIState.currentEmail, 
              timeSpent: totalTime 
            });
            console.log('🎯 BillableAI: Local billingSummary type (not authenticated):', typeof billingSummary, billingSummary);
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
      }
      
      // Send message to background script
      safeSendMessage({
        type: 'TRACKING_STOPPED',
        sessionId: window.billableAIState.sessionId,
        draftId: window.billableAIState.draftId,
        billingSummary: billingSummary
      }, (response, error) => {
        if (error) {
          console.log('🎯 BillableAI: Background message failed (non-critical):', error.message);
        }
      });
      
      // Show completion notification only if summary was generated
      if (generateSummary) {
        showNotification('✅ Email tracking completed', 'success');
      } else {
        showNotification('⏹️ Email tracking stopped', 'info');
      }
      
      console.log('🎯 BillableAI: Email tracking stopped successfully');
      return { success: true, billingSummary, timeSpent: totalTime };
    } catch (error) {
      console.error('🎯 BillableAI: Stop email tracking error:', error);
      showNotification('❌ Failed to stop email tracking', 'error');
      return { success: false, error: error.message };
    }
  }

  // Update email activity (called when user types)
  function updateEmailActivity() {
    try {
      // Only update if tracking is active
      if (!window.billableAIState.isTracking) {
        return;
      }
      
    window.billableAIState.lastActivityTime = Date.now();
    
      // Send activity to backend (only if authenticated)
      if (window.billableAIState.sessionId && window.billableAIState.isAuthenticated) {
        fetch(`${window.billableAIState.backendUrl}/email-tracking/activity`, {
          method: 'POST',
          headers: getAuthHeaders(),
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
      
      // Update tracking status (throttled)
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
      
      // Call backend one-click billing (only if authenticated)
      if (window.billableAIState.isAuthenticated) {
        const response = await fetch(`${window.billableAIState.backendUrl}/email-tracking/one-click-billing`, {
          method: 'POST',
          headers: getAuthHeaders(),
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
              } else {
          console.log('🎯 BillableAI: Not authenticated, skipping one-click billing');
          showNotification('Please login to use one-click billing', 'info');
          throw new Error('Authentication required for one-click billing');
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

  // Show notification with timer
  function showNotificationWithTimer(message, type = 'info', duration = 5000) {
    const notification = createNotificationElement();
    
    if (type === 'tracking') {
      // For tracking notifications, use a single timer that updates both notification and state
      const updateTimer = () => {
        // Stop timer if tracking is no longer active
        if (!window.billableAIState.isTracking) {
          clearInterval(timerInterval);
          return;
        }
        
        // FIXED: Use single source of truth for time calculation
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
        
        // Only update tracking status occasionally to prevent spam
        // updateTrackingStatus() is called elsewhere when needed
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
      let composeTrackingStarted = false;
      let lastComposeCheck = 0;
      const COMPOSE_CHECK_THROTTLE = 2000; // 2 seconds between checks
      
      // Monitor for compose window
      const observer = new MutationObserver((mutations) => {
        const now = Date.now();
        
        // Throttle compose checks to prevent spam
        if (now - lastComposeCheck < COMPOSE_CHECK_THROTTLE) {
          return;
        }
        lastComposeCheck = now;
        
        mutations.forEach((mutation) => {
          // Check for added nodes (compose window opened)
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // More comprehensive compose window detection
              const composeWindow = node.querySelector && (
                node.querySelector('[role="dialog"][aria-label*="Compose"]') ||
                node.querySelector('[data-tooltip="Compose"]') ||
                node.querySelector('[aria-label*="Compose"][role="dialog"]') ||
                node.querySelector('[role="dialog"]') ||
                node.querySelector('[aria-label*="Compose"]') ||
                node.querySelector('[data-tooltip*="Compose"]')
              );
              
              if (composeWindow && !window.billableAIState.isTracking && !composeTrackingStarted) {
                console.log('🎯 BillableAI: New compose window detected');
                composeTrackingStarted = true;
                startComposeTracking();
              }
            }
          });
          
          // Check for removed nodes (compose window closed)
          mutation.removedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // More comprehensive compose window removal detection
              const wasComposeWindow = node.querySelector && (
                node.querySelector('[role="dialog"][aria-label*="Compose"]') ||
                node.querySelector('[data-tooltip="Compose"]') ||
                node.querySelector('[aria-label*="Compose"][role="dialog"]') ||
                node.querySelector('[role="dialog"]') ||
                node.querySelector('[aria-label*="Compose"]') ||
                node.querySelector('[data-tooltip*="Compose"]')
              );
              
              if (wasComposeWindow && window.billableAIState.isTracking) {
                console.log('🎯 BillableAI: Compose window closed, stopping tracking');
                composeTrackingStarted = false;
                stopEmailTracking(false).then((result) => {
                  console.log('🎯 BillableAI: Tracking stopped due to compose window close:', result);
                  // No billing summary generated - only when send button is clicked
                }).catch((error) => {
                  console.error('🎯 BillableAI: Error stopping tracking on compose close:', error);
                });
              }
            }
          });
        });
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      // Also check for existing compose windows (only once on load)
      setTimeout(() => {
        const existingCompose = document.querySelector('[role="dialog"][aria-label*="Compose"]') || 
                               document.querySelector('[data-tooltip="Compose"]') ||
                               document.querySelector('[aria-label*="Compose"][role="dialog"]') ||
                               document.querySelector('[role="dialog"]') ||
                               document.querySelector('[aria-label*="Compose"]') ||
                               document.querySelector('[data-tooltip*="Compose"]');
        
        if (existingCompose && !window.billableAIState.isTracking && !composeTrackingStarted) {
          console.log('🎯 BillableAI: Existing compose window detected');
          composeTrackingStarted = true;
          startComposeTracking();
        }
      }, 1000); // Delay to ensure DOM is fully loaded
    } catch (error) {
      console.error('🎯 BillableAI: Compose detection setup error:', error);
    }
  }

    // Start compose tracking
  function startComposeTracking() {
    try {
      console.log('🎯 BillableAI: startComposeTracking called');
      
      // Prevent multiple starts for the same compose session
        if (window.billableAIState.isTracking) {
        console.log('🎯 BillableAI: Already tracking, skipping compose start');
        return;
      }
      
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
      
      console.log('🎯 BillableAI: Found fields:', {
        toField: !!toField,
        subjectField: !!subjectField,
        contentField: !!contentField
      });
      
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
        console.log('🎯 BillableAI: Available text fields:', document.querySelectorAll('[contenteditable="true"], [role="textbox"], textarea'));
      }
    } catch (error) {
      console.error('🎯 BillableAI: Start compose tracking error:', error);
    }
  }

  // Setup typing detection
  function setupTypingDetection(contentField) {
    try {
      let typingTimeout;
      
      const handleTyping = () => {
        // Clear existing timeout
        if (typingTimeout) {
          clearTimeout(typingTimeout);
        }
        
        // Update email content with null check
        if (window.billableAIState.currentEmail) {
          window.billableAIState.currentEmail.content = contentField.textContent || '';
        } else {
          // Initialize currentEmail if it doesn't exist
          window.billableAIState.currentEmail = {
            content: contentField.textContent || '',
            subject: '',
            to: '',
            from: ''
          };
        }
        
        // Try to capture email subject and recipient
        try {
          // Look for subject field
          const subjectField = document.querySelector('input[name="subjectbox"], input[placeholder*="Subject"], input[aria-label*="Subject"]');
          if (subjectField && subjectField.value) {
            window.billableAIState.currentEmail.subject = subjectField.value;
          }
          
          // Look for recipient field
          const recipientField = document.querySelector('input[name="to"], input[placeholder*="Recipient"], input[aria-label*="To"]');
          if (recipientField && recipientField.value) {
            window.billableAIState.currentEmail.to = recipientField.value;
          }
        } catch (error) {
          console.log('🎯 BillableAI: Error capturing email metadata:', error.message);
        }
        
        // Update activity
        updateEmailActivity();
        
        // If was paused, resume tracking
        if (window.billableAIState.isPaused) {
          console.log('🎯 BillableAI: Typing resumed, continuing tracking');
          window.billableAIState.isPaused = false;
          resumeTimer();
        }
        
        // Set timeout to pause tracking after 5 seconds of inactivity
        typingTimeout = setTimeout(() => {
          if (window.billableAIState.isTracking) {
            console.log('🎯 BillableAI: Typing stopped, pausing tracking');
            window.billableAIState.isPaused = true;
            pauseTimer();
          }
        }, 5000);
      };
      
      // Add event listeners with error handling
      try {
        contentField.addEventListener('input', handleTyping);
        contentField.addEventListener('keydown', handleTyping);
        contentField.addEventListener('paste', handleTyping);
      } catch (error) {
        console.error('🎯 BillableAI: Error adding event listeners:', error);
      }
      
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
          console.log('🎯 BillableAI: Send button clicked - starting notification-based flow');
          
          // Capture final email data before sending
          try {
            const contentField = document.querySelector('[contenteditable="true"][role="textbox"], [contenteditable="true"][aria-label*="Message"], div[contenteditable="true"]');
            const subjectField = document.querySelector('input[name="subjectbox"], input[placeholder*="Subject"], input[aria-label*="Subject"]');
            const recipientField = document.querySelector('input[name="to"], input[placeholder*="Recipient"], input[aria-label*="To"]');
            
            if (contentField) {
              window.billableAIState.currentEmail.content = contentField.textContent || '';
            }
            if (subjectField) {
              window.billableAIState.currentEmail.subject = subjectField.value || '';
            }
            if (recipientField) {
              window.billableAIState.currentEmail.to = recipientField.value || '';
            }
            
            console.log('🎯 BillableAI: Final email data captured:', window.billableAIState.currentEmail);
          } catch (error) {
            console.log('🎯 BillableAI: Error capturing final email data:', error.message);
          }
          
          // Show loading notification
          showNotification('🤖 Generating billable summary...', 'info');
          
          // Stop tracking and generate summary
          stopEmailTracking().then((result) => {
            console.log('🎯 BillableAI: Tracking stopped after send:', result);
            
            // Show summary notification (no automatic navigation)
            if (result.billingSummary) {
              // Get current email data with fallback
              const currentEmail = window.billableAIState.currentEmail || {};
              console.log('🎯 BillableAI: Current email data:', currentEmail);
              
              // Transform billingSummary to expected structure
              const transformedSummary = {
                summary: result.billingSummary.summary || 'No summary available',
                timeSpent: result.timeSpent || 0,
                emailData: {
                  to: currentEmail.to || 'No recipient',
                  subject: currentEmail.subject || 'Email Summary',
                  content: currentEmail.content || 'Email content summary'
                },
                timestamp: Date.now(),
                aiGenerated: true,
                billableAmount: 0
              };
              
              console.log('🎯 BillableAI: Transformed summary data:', transformedSummary);
              
              // Store data for notification system only
              const notificationData = {
                summary: transformedSummary.summary,
                timeSpent: transformedSummary.timeSpent,
                emailData: transformedSummary.emailData,
                timestamp: transformedSummary.timestamp
              };
              
              console.log('🎯 BillableAI: Storing notification data:', notificationData);
              
              // Store in chrome.storage.local for notification system
              safeChromeStorageSet('billableai_notification_data', notificationData).then((success) => {
                if (success) {
                  console.log('🎯 BillableAI: Notification data stored in Chrome storage');
                } else {
                  console.log('🎯 BillableAI: Chrome storage failed, using localStorage only');
                }
              });
              
              // Also store in localStorage as fallback
              try {
                localStorage.setItem('billableai_notification_data', JSON.stringify(notificationData));
                console.log('🎯 BillableAI: Notification data stored in localStorage');
              } catch (localStorageError) {
                console.log('🎯 BillableAI: localStorage not available:', localStorageError.message);
              }
              
              // Show summary notification (no automatic navigation)
              showBillingSummaryNotification(result.billingSummary, result.timeSpent);
              
              // Show success notification
              showNotification('✅ Summary generated! Check notification for details.', 'success', 3000);
            } else {
              showNotification('✅ Email sent! (No billing summary available)', 'success');
            }
          }).catch((error) => {
            console.error('🎯 BillableAI: Error stopping tracking after send:', error);
            showNotification('❌ Error generating billing summary', 'error');
          });
        }
      });
      
      console.log('🎯 BillableAI: Send button detection setup complete');
    } catch (error) {
      console.error('🎯 BillableAI: Send button detection setup error:', error);
    }
  }

  // Show billing summary notification with Gemini-generated content
  function showBillingSummaryNotification(summary, timeSpent) {
    try {
      // Debug logging to understand the data type
      console.log('🎯 BillableAI: showBillingSummaryNotification called with:', {
        summary: summary,
        summaryType: typeof summary,
        timeSpent: timeSpent
      });

      // Remove existing notification
      const existingNotification = document.getElementById('billableai-summary-notification');
      if (existingNotification) {
        existingNotification.remove();
      }

      // Validate and sanitize summary
      let displaySummary = 'No billing summary available';
      if (summary && typeof summary === 'string') {
        displaySummary = summary;
      } else if (summary && typeof summary === 'object') {
        // If summary is an object, try to extract text content
        displaySummary = summary.text || summary.content || summary.summary || JSON.stringify(summary);
      } else if (summary) {
        // Convert to string if it's not null/undefined
        displaySummary = String(summary);
      }

      console.log('🎯 BillableAI: Sanitized displaySummary:', displaySummary);

      // Format time spent
      const minutes = Math.floor(timeSpent / 60000);
      const seconds = Math.floor((timeSpent % 60000) / 1000);
      const timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;

      // Create simple notification
      const notification = document.createElement('div');
      notification.id = 'billableai-summary-notification';
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px;
        border-radius: 15px;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
        z-index: 10001;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        max-width: 400px;
        backdrop-filter: blur(15px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        transition: all 0.4s ease;
        opacity: 0;
        transform: translateX(100%) scale(0.9);
      `;

      // Create notification content with Open Assistant button
      notification.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 15px;">
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
              <div style="width: 40px; height: 40px; background: rgba(255, 255, 255, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px;">
                🤖
              </div>
              <div>
                <div style="font-weight: 600; font-size: 16px; margin-bottom: 2px;">AI Summary Generated</div>
                <div style="font-size: 12px; opacity: 0.8;">Time spent: ${timeDisplay}</div>
              </div>
            </div>
            <div style="background: rgba(255, 255, 255, 0.1); border-radius: 10px; padding: 15px; margin-bottom: 15px; font-size: 13px; line-height: 1.5; max-height: 150px; overflow-y: auto;">
              ${displaySummary.replace(/\n/g, '<br>')}
            </div>
            <div style="display: flex; gap: 10px;">
              <button id="billableai-open-assistant" style="
                background: rgba(33, 150, 243, 0.3);
                border: 1px solid rgba(33, 150, 243, 0.5);
                color: white;
                padding: 8px 15px;
                border-radius: 8px;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s ease;
                flex: 1;
              ">🤖 Open Assistant</button>
              <button id="billableai-close-summary" style="
                background: rgba(255, 255, 255, 0.1);
                border: none;
                color: white;
                padding: 8px 15px;
                border-radius: 8px;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s ease;
              ">✕ Close</button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(notification);

      // Animate in
      setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0) scale(1)';
      }, 100);

            // Add event listeners
      const openAssistantButton = notification.querySelector('#billableai-open-assistant');
      const closeButton = notification.querySelector('#billableai-close-summary');

      openAssistantButton.addEventListener('click', () => {
        // Get notification data from storage
        const getNotificationData = async () => {
          try {
            // Try Chrome storage first
            const chromeData = await safeChromeStorageGet('billableai_notification_data');
            if (chromeData) {
              return chromeData;
            }
            
            // Fallback to localStorage
            const localStorageData = localStorage.getItem('billableai_notification_data');
            if (localStorageData) {
              return JSON.parse(localStorageData);
            }
            
            return null;
          } catch (error) {
            console.log('🎯 BillableAI: Error getting notification data:', error.message);
            return null;
          }
        };

        // Process notification data and send to assistant
        getNotificationData().then((notificationData) => {
          if (notificationData) {
            console.log('🎯 BillableAI: Sending notification data to assistant:', notificationData);
            
            // Store assistant data
            const assistantData = {
              summary: notificationData.summary || 'No summary available',
              timeSpent: notificationData.timeSpent || 0,
              emailData: {
                to: notificationData.emailData?.to || 'No recipient',
                subject: notificationData.emailData?.subject || 'No subject',
                content: notificationData.emailData?.content || 'No content'
              },
              timestamp: notificationData.timestamp || new Date().toISOString(),
              aiGenerated: true,
              billableAmount: 0
            };
            
            // Store in chrome.storage.local
            safeChromeStorageSet('billableai_assistant_data', assistantData).then((success) => {
              if (success) {
                console.log('🎯 BillableAI: Assistant data stored in Chrome storage from notification');
              } else {
                console.log('🎯 BillableAI: Chrome storage failed for assistant data');
              }
            });
            
            // Also store in localStorage as fallback
            try {
              localStorage.setItem('billableai_assistant_data', JSON.stringify(assistantData));
              localStorage.setItem('billableai_navigate_to_assistant', 'true');
              console.log('🎯 BillableAI: Assistant data stored in localStorage from notification');
            } catch (localStorageError) {
              console.log('🎯 BillableAI: localStorage not available:', localStorageError.message);
            }
            
            // Show success message
            showNotification('✅ Opening Assistant with summary data...', 'success', 2000);
            
            // Close the notification
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%) scale(0.9)';
            setTimeout(() => {
              if (notification.parentNode) {
                notification.remove();
              }
            }, 400);
          } else {
            console.log('🎯 BillableAI: No notification data found');
            showNotification('❌ No summary data available', 'error', 2000);
          }
        }).catch((error) => {
          console.error('🎯 BillableAI: Error processing notification data:', error);
          showNotification('❌ Error opening assistant', 'error', 2000);
        });
      });

      closeButton.addEventListener('click', () => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%) scale(0.9)';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
        }, 400);
      });

      // Auto-close after 30 seconds
      setTimeout(() => {
        if (notification.parentNode) {
          notification.style.opacity = '0';
          notification.style.transform = 'translateX(100%) scale(0.9)';
          setTimeout(() => {
            if (notification.parentNode) {
              notification.remove();
            }
          }, 400);
        }
      }, 30000);

      // Auto-close after 30 seconds
      setTimeout(() => {
        if (notification.parentNode) {
          notification.style.opacity = '0';
          notification.style.transform = 'translateX(100%) scale(0.9)';
          setTimeout(() => {
            if (notification.parentNode) {
              notification.remove();
            }
          }, 400);
        }
      }, 30000);

      console.log('🎯 BillableAI: Billing summary notification displayed');
    } catch (error) {
      console.error('🎯 BillableAI: Show billing summary notification error:', error);
      // Fallback to simple notification
      showNotification('✅ Email sent with billing summary!', 'success');
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
  
    // Handle authentication login
  async function handleLogin(credentials) {
    try {
      console.log('🎯 BillableAI: Attempting login...');
      
      const response = await fetch(`${window.billableAIState.backendUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      
      // Set authentication data
      window.billableAIState.authToken = data.token;
      window.billableAIState.user = {
        ...data.user,
        tokenExpiry: data.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };
      window.billableAIState.isAuthenticated = true;

      // Save to persistent storage
      await savePersistentAuth(data.token, window.billableAIState.user);
      
      console.log('🎯 BillableAI: Login successful');
      return { success: true, user: window.billableAIState.user };
    } catch (error) {
      console.error('🎯 BillableAI: Login error:', error);
      throw error;
    }
  }

  // Handle authentication logout
  async function handleLogout() {
    try {
      console.log('🎯 BillableAI: Logging out...');
      await clearPersistentAuth();
      console.log('🎯 BillableAI: Logout successful');
    } catch (error) {
      console.error('🎯 BillableAI: Logout error:', error);
    }
  }

  // Expose functions to window for external access
  window.billableAI = {
    startTracking: startEmailTracking,
    stopTracking: stopEmailTracking,
    oneClickBilling: oneClickBilling,
    showNotification: showNotification,
    updateTrackingStatus: updateTrackingStatus,
    getState: () => window.billableAIState,
    startComposeTracking: startComposeTracking, // Expose for manual testing
    login: handleLogin,
    logout: handleLogout,
    isAuthenticated: () => window.billableAIState.isAuthenticated
  };

  // Listen for messages from popup/background
  if (isExtensionContextValid()) {
    try {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log('🎯 BillableAI: Received message:', message);
        
        // Helper function to safely send response
        const safeSendResponse = (response) => {
          try {
            if (isExtensionContextValid()) {
              sendResponse(response);
        } else {
              console.log('🎯 BillableAI: Extension context invalid, skipping response');
            }
          } catch (error) {
            console.log('🎯 BillableAI: Response already sent or channel closed:', error.message);
          }
        };
        
        // Handle sync responses immediately
        if (message.type === 'GET_STATE') {
          safeSendResponse(window.billableAIState);
          return false; // No async response needed
        }
        
        // Handle async responses
        if (message.type === 'ONE_CLICK_BILLING') {
          // Add timeout to prevent hanging
          const timeout = setTimeout(() => {
            safeSendResponse({ success: false, error: 'Operation timed out' });
          }, 30000); // 30 second timeout
          
          oneClickBilling().then(result => {
            clearTimeout(timeout);
            safeSendResponse(result);
          }).catch(error => {
            clearTimeout(timeout);
            console.error('🎯 BillableAI: One-click billing error:', error);
            safeSendResponse({ success: false, error: error.message });
          });
          return true; // Keep message channel open
        }
        
        if (message.type === 'START_TRACKING') {
          if (window.billableAIState.currentEmail) {
            // Add timeout to prevent hanging
            const timeout = setTimeout(() => {
              safeSendResponse({ success: false, error: 'Start tracking timed out' });
            }, 10000); // 10 second timeout
            
            startEmailTracking(window.billableAIState.currentEmail).then(result => {
              clearTimeout(timeout);
              safeSendResponse(result);
            }).catch(error => {
              clearTimeout(timeout);
              console.error('🎯 BillableAI: Start tracking error:', error);
              safeSendResponse({ success: false, error: error.message });
            });
            return true; // Keep message channel open
    } else {
            safeSendResponse({ success: false, error: 'No email data available' });
            return false; // No async response needed
          }
        }
        
        if (message.type === 'STOP_TRACKING') {
          // Add timeout to prevent hanging
          const timeout = setTimeout(() => {
            safeSendResponse({ success: false, error: 'Stop tracking timed out' });
          }, 10000); // 10 second timeout
          
          stopEmailTracking().then(result => {
            clearTimeout(timeout);
            safeSendResponse(result);
          }).catch(error => {
            clearTimeout(timeout);
            console.error('🎯 BillableAI: Stop tracking error:', error);
            safeSendResponse({ success: false, error: error.message });
          });
          return true; // Keep message channel open
        }
        
        // Default response for unknown message types
        safeSendResponse({ success: false, error: 'Unknown message type' });
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

  console.log('🎯 BillableAI: Enhanced tracking script loaded successfully');
})(); 



