// BillableAI Core Tracking Module
// Handles state management and localStorage operations

(function() {
  console.log('🎯 BillableAI: Core tracking module loaded');
  
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

  // Expose core functions
  window.billableAICore = {
    safeLocalStorageSet,
    safeLocalStorageGet,
    updateTrackingStatus,
    getState: () => window.billableAIState
  };

  console.log('🎯 BillableAI: Core tracking module ready');
})(); 