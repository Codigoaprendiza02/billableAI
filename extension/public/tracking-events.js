// BillableAI Events Module
// Handles DOM event detection and tracking logic

(function() {
  console.log('🎯 BillableAI: Events module loaded');
  
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
    window.billableAICore.updateTrackingStatus();
    
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
    window.billableAICore.updateTrackingStatus();
    
    console.log('🎯 BillableAI: Email tracking paused');
  }

  function resumeEmailTracking() {
    console.log('🎯 BillableAI: Resuming email tracking');
    
    window.billableAIState.isTracking = true;
    window.billableAIState.startTime = Date.now();
    window.billableAIState.isPaused = false;
    window.billableAIState.lastActivityTime = Date.now();
    
    // Update tracking status
    window.billableAICore.updateTrackingStatus();
    
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
    window.billableAICore.updateTrackingStatus();
    
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
      window.billableAICore.updateTrackingStatus();
      
      // Update activity every 10 seconds to eliminate performance impact
      setTimeout(() => {
        if (window.billableAIState.isTracking) {
          updateEmailActivity();
        }
      }, 10000);
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
        const emailData = await window.billableAIGmailAPI.extractEmailDataWithGmailApi();
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
    window.billableAIGmailAPI.extractEmailDataWithGmailApi().then(emailData => {
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
        const apiEmailData = await window.billableAIGmailAPI.getDraftContent(emailData.draftId);
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
    const summary = await window.billableAIGemini.generateSummaryWithGemini(fullEmailContent, timeSpent);
    
    // Store summary in localStorage
    try {
      const storedSummaries = window.billableAICore.safeLocalStorageGet('billableai_summaries', []);
      storedSummaries.push(summary);
      window.billableAICore.safeLocalStorageSet('billableai_summaries', storedSummaries);
      console.log('🎯 BillableAI: Summary stored successfully');
    } catch (error) {
      console.error('🎯 BillableAI: Error storing summary:', error);
    }
    
    // Update work history
    try {
      const storedWorkHistory = window.billableAICore.safeLocalStorageGet('billableai_workHistory', {});
      storedWorkHistory.summaries = (storedWorkHistory.summaries || 0) + 1;
      const totalMinutes = parseInt(storedWorkHistory.timeSpent || 0) + Math.floor(timeSpent / 1000 / 60);
      storedWorkHistory.timeSpent = totalMinutes + ' mins';
      window.billableAICore.safeLocalStorageSet('billableai_workHistory', storedWorkHistory);
      console.log('🎯 BillableAI: Work history updated - Total time:', totalMinutes, 'minutes');
    } catch (error) {
      console.error('🎯 BillableAI: Error updating work history:', error);
    }
    
    // Stop tracking
    stopEmailTracking();
    
    console.log('🎯 BillableAI: Summary generation completed successfully');
    return summary;
  }

  // Expose event functions
  window.billableAIEvents = {
    startEmailTracking,
    pauseEmailTracking,
    resumeEmailTracking,
    stopEmailTracking,
    handleEmailInput,
    handleEmailFocus,
    handleEmailBlur,
    handleSendButtonClick,
    generateSummary
  };

  console.log('🎯 BillableAI: Events module ready');
})(); 