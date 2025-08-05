// BillableAI Detection Module
// Handles Gmail DOM detection and element tracking

(function() {
  console.log('🎯 BillableAI: Detection module loaded');
  
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
          element.addEventListener('input', window.billableAIEvents.handleEmailInput, { passive: true });
          element.addEventListener('focus', window.billableAIEvents.handleEmailFocus, { passive: true });
          element.addEventListener('blur', window.billableAIEvents.handleEmailBlur, { passive: true });
          
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
          button.addEventListener('click', window.billableAIEvents.handleSendButtonClick, { passive: true });
          
          console.log('🎯 BillableAI: Send button tracked (no visual highlight)');
        }
      });
    } catch (error) {
      console.log('🎯 BillableAI: Error in send button detection (non-critical):', error.message);
    }
  }

  // Test detection function for manual testing
  function testDetection() {
    console.log('🎯 BillableAI: Testing Gmail detection');
    detectGmailComposeInNode(document.body);
    detectGmailSendButtonInNode(document.body);
  }

  // Expose detection functions
  window.billableAIDetection = {
    setupGmailDetection,
    detectGmailComposeInNode,
    detectGmailSendButtonInNode,
    addVisualIndicator,
    testDetection
  };

  console.log('🎯 BillableAI: Detection module ready');
})(); 