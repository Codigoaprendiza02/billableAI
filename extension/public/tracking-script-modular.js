// BillableAI Modular Tracking Script
// Main entry point that loads all modules and provides the interface

(function() {
  console.log('🎯 BillableAI: Modular tracking script starting...');
  
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

  // Load modules in order
  function loadModules() {
    console.log('🎯 BillableAI: Loading modules...');
    
    // Module 1: Core tracking (state management, localStorage)
    if (typeof window.billableAICore === 'undefined') {
      console.log('🎯 BillableAI: Core module not loaded, loading...');
      const coreScript = document.createElement('script');
      coreScript.src = chrome.runtime.getURL('tracking-core.js');
      coreScript.onload = () => {
        console.log('🎯 BillableAI: Core module loaded');
        // Wait a bit to ensure module is fully initialized
        setTimeout(loadGmailAPI, 100);
      };
      coreScript.onerror = () => {
        console.error('🎯 BillableAI: Failed to load Core module');
      };
      document.head.appendChild(coreScript);
    } else {
      loadGmailAPI();
    }
  }

  function loadGmailAPI() {
    // Module 2: Gmail API
    if (typeof window.billableAIGmailAPI === 'undefined') {
      console.log('🎯 BillableAI: Gmail API module not loaded, loading...');
      const gmailScript = document.createElement('script');
      gmailScript.src = chrome.runtime.getURL('tracking-gmail-api.js');
      gmailScript.onload = () => {
        console.log('🎯 BillableAI: Gmail API module loaded');
        // Wait a bit to ensure module is fully initialized
        setTimeout(loadGemini, 100);
      };
      gmailScript.onerror = () => {
        console.error('🎯 BillableAI: Failed to load Gmail API module');
      };
      document.head.appendChild(gmailScript);
    } else {
      loadGemini();
    }
  }

  function loadGemini() {
    // Module 3: Gemini API
    if (typeof window.billableAIGemini === 'undefined') {
      console.log('🎯 BillableAI: Gemini module not loaded, loading...');
      const geminiScript = document.createElement('script');
      geminiScript.src = chrome.runtime.getURL('tracking-gemini.js');
      geminiScript.onload = () => {
        console.log('🎯 BillableAI: Gemini module loaded');
        // Wait a bit to ensure module is fully initialized
        setTimeout(loadEvents, 100);
      };
      geminiScript.onerror = () => {
        console.error('🎯 BillableAI: Failed to load Gemini module');
      };
      document.head.appendChild(geminiScript);
    } else {
      loadEvents();
    }
  }

  function loadEvents() {
    // Module 4: Events
    if (typeof window.billableAIEvents === 'undefined') {
      console.log('🎯 BillableAI: Events module not loaded, loading...');
      const eventsScript = document.createElement('script');
      eventsScript.src = chrome.runtime.getURL('tracking-events.js');
      eventsScript.onload = () => {
        console.log('🎯 BillableAI: Events module loaded');
        // Wait a bit to ensure module is fully initialized
        setTimeout(loadDetection, 100);
      };
      eventsScript.onerror = () => {
        console.error('🎯 BillableAI: Failed to load Events module');
      };
      document.head.appendChild(eventsScript);
    } else {
      loadDetection();
    }
  }

  function loadDetection() {
    // Module 5: Detection
    if (typeof window.billableAIDetection === 'undefined') {
      console.log('🎯 BillableAI: Detection module not loaded, loading...');
      const detectionScript = document.createElement('script');
      detectionScript.src = chrome.runtime.getURL('tracking-detection.js');
      detectionScript.onload = () => {
        console.log('🎯 BillableAI: Detection module loaded');
        // Wait a bit to ensure module is fully initialized
        setTimeout(initializeTracking, 100);
      };
      detectionScript.onerror = () => {
        console.error('🎯 BillableAI: Failed to load Detection module');
      };
      document.head.appendChild(detectionScript);
    } else {
      initializeTracking();
    }
  }

  // Initialize tracking with proper error handling
  async function initializeTracking() {
    console.log('🎯 BillableAI: Initializing modular tracking system');
    
    try {
      // Check if all required modules are loaded
      if (!window.billableAICore) {
        throw new Error('Core module not loaded');
      }
      if (!window.billableAIGmailAPI) {
        throw new Error('Gmail API module not loaded');
      }
      if (!window.billableAIGemini) {
        throw new Error('Gemini module not loaded');
      }
      if (!window.billableAIEvents) {
        throw new Error('Events module not loaded');
      }
      if (!window.billableAIDetection) {
        throw new Error('Detection module not loaded');
      }
      
      console.log('🎯 BillableAI: All modules loaded, initializing...');
      
      // Initialize Gmail API
      await window.billableAIGmailAPI.initializeGmailApi();
      
      // Initialize tracking status
      window.billableAICore.updateTrackingStatus();
      
      // Setup Gmail detection
      window.billableAIDetection.setupGmailDetection();
      
      // Add visual indicator for debugging
      window.billableAIDetection.addVisualIndicator();
      
      console.log('🎯 BillableAI: Modular tracking system initialized');
    } catch (error) {
      console.error('🎯 BillableAI: Error initializing tracking:', error);
      console.log('🎯 BillableAI: Retrying initialization in 2 seconds...');
      
      // Retry initialization after a delay
      setTimeout(() => {
        initializeTracking();
      }, 2000);
    }
  }

  // Start tracking when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadModules);
  } else {
    loadModules();
  }

  // Also initialize after a short delay to catch dynamic content
  setTimeout(loadModules, 1000);
  setTimeout(loadModules, 3000);

  // Keyboard shortcut to toggle tracking (Ctrl+Shift+T)
  document.addEventListener('keydown', function(e) {
    try {
      if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        console.log('🎯 BillableAI: Keyboard shortcut pressed (Ctrl+Shift+T)');
        
        if (window.billableAIState && window.billableAIState.isTracking) {
          window.billableAIEvents.pauseEmailTracking();
        } else {
          window.billableAIGmailAPI.extractEmailDataWithGmailApi().then(emailData => {
            window.billableAIEvents.startEmailTracking(emailData);
          });
        }
      }
    } catch (error) {
      console.error('🎯 BillableAI: Error in keyboard shortcut handler:', error);
    }
  });

  console.log('🎯 BillableAI: Modular tracking script ready');
  
  // Expose functions for manual testing - ensure this runs in page context
  try {
    window.billableAI = {
      startTracking: () => {
        console.log('🎯 BillableAI: Manual start tracking');
        if (window.billableAIGmailAPI) {
          window.billableAIGmailAPI.extractEmailDataWithGmailApi().then(emailData => {
            window.billableAIEvents.startEmailTracking(emailData);
          });
        } else {
          console.log('🎯 BillableAI: Gmail API module not ready');
        }
      },
      stopTracking: () => {
        console.log('🎯 BillableAI: Manual stop tracking');
        if (window.billableAIEvents) {
          window.billableAIEvents.stopEmailTracking();
        }
      },
      pauseTracking: () => {
        console.log('🎯 BillableAI: Manual pause tracking');
        if (window.billableAIEvents) {
          window.billableAIEvents.pauseEmailTracking();
        }
      },
      resumeTracking: () => {
        console.log('🎯 BillableAI: Manual resume tracking');
        if (window.billableAIEvents) {
          window.billableAIEvents.resumeEmailTracking();
        }
      },
      getStatus: () => {
        console.log('🎯 BillableAI: Current status:', window.billableAIState);
        return window.billableAIState || { isTracking: false, message: 'Modules not loaded' };
      },
      testDetection: () => {
        console.log('🎯 BillableAI: Testing Gmail detection');
        if (window.billableAIDetection) {
          window.billableAIDetection.testDetection();
        }
      },
      cleanup: () => {
        console.log('🎯 BillableAI: Cleaning up');
        // No visual elements to clean up - all disabled to prevent reflows
      },
      // Test functions for gmail-api-test.html
      testGmailApi: async () => {
        if (window.billableAIGmailAPI) {
          return await window.billableAIGmailAPI.testGmailApi();
        }
        return false;
      },
      generateTestSummary: async (emailData, timeSpent) => {
        if (window.billableAIGemini) {
          return await window.billableAIGemini.generateTestSummary(emailData, timeSpent);
        }
        return 'Modules not loaded';
      },
      getDraftsCount: async () => {
        if (window.billableAIGmailAPI) {
          return await window.billableAIGmailAPI.getDraftsCount();
        }
        return 0;
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
      startTracking: () => {
        console.log('🎯 BillableAI: Fallback start tracking');
        if (window.billableAIEvents) {
          window.billableAIEvents.startEmailTracking({ to: '', subject: '', content: '' });
        }
      },
      stopTracking: () => {
        console.log('🎯 BillableAI: Fallback stop tracking');
        if (window.billableAIEvents) {
          window.billableAIEvents.stopEmailTracking();
        }
      },
      getStatus: () => {
        if (window.billableAIState) {
          return window.billableAIState;
        }
        return { isTracking: false, message: 'Extension not loaded' };
      },
      testGmailApi: async () => {
        if (window.billableAIGmailAPI) {
          return await window.billableAIGmailAPI.testGmailApi();
        }
        return false;
      },
      generateTestSummary: async (emailData, timeSpent) => {
        if (window.billableAIGemini) {
          return await window.billableAIGemini.generateTestSummary(emailData, timeSpent);
        }
        return 'Extension not loaded';
      },
      getDraftsCount: async () => {
        if (window.billableAIGmailAPI) {
          return await window.billableAIGmailAPI.getDraftsCount();
        }
        return 0;
      }
    };
  }
})(); 