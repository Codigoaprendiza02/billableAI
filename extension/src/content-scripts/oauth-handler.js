// OAuth Handler Content Script
// Handles OAuth callbacks and sends messages to the extension

console.log('🔗 OAuth Handler Content Script loaded');

// Listen for OAuth callbacks
window.addEventListener('message', (event) => {
  // Only handle messages from our own origin
  if (event.origin !== window.location.origin) return;
  
  if (event.data.type === 'OAUTH_CALLBACK') {
    console.log('🔄 OAuth callback received:', event.data);
    
    // Send message to extension
    chrome.runtime.sendMessage({
      type: 'CLIO_OAUTH_CALLBACK',
      code: event.data.code,
      state: event.data.state
    });
  }
});

// Check if this page is an OAuth callback
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');
const state = urlParams.get('state');

if (code && window.location.href.includes('/api/auth/clio/callback')) {
  console.log('🔗 Clio OAuth callback detected');
  
  // Send the authorization code to the extension
  chrome.runtime.sendMessage({
    type: 'CLIO_OAUTH_CALLBACK',
    code: code,
    state: state
  });
  
  // Close the tab after a short delay
  setTimeout(() => {
    window.close();
  }, 2000);
}

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'INITIATE_CLIO_OAUTH') {
    console.log('🔗 Initiating Clio OAuth from content script');
    
    // Open OAuth URL in current tab
    const oauthUrl = request.oauthUrl;
    window.location.href = oauthUrl;
  }
}); 