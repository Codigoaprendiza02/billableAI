// This script helps you find your Chrome extension ID
// Run this in the browser console when your extension is loaded

console.log('🔍 Finding Extension ID...');

// Method 1: From chrome.runtime.id
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
  console.log('✅ Extension ID from chrome.runtime.id:', chrome.runtime.id);
} else {
  console.log('❌ chrome.runtime.id not available');
}

// Method 2: From the current URL
if (window.location.href.includes('chrome-extension://')) {
  const urlParts = window.location.href.split('/');
  const extensionId = urlParts[2];
  console.log('✅ Extension ID from URL:', extensionId);
} else {
  console.log('❌ Not running in extension context');
}

// Method 3: From manifest
console.log('📋 Instructions to find Extension ID:');
console.log('1. Open Chrome and go to chrome://extensions/');
console.log('2. Enable "Developer mode"');
console.log('3. Find "BillableAI" and copy the ID');
console.log('4. Update the EXTENSION_ID in your .env file');
console.log('5. Update the redirect URI in Google Cloud Console');
console.log('6. Update the manifest.json oauth2 client_id if needed');

// Method 4: Check if we can access the manifest
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest) {
  try {
    const manifest = chrome.runtime.getManifest();
    console.log('✅ Manifest loaded successfully');
    if (manifest.oauth2 && manifest.oauth2.client_id) {
      console.log('✅ OAuth2 client_id in manifest:', manifest.oauth2.client_id);
    }
  } catch (error) {
    console.log('❌ Could not access manifest:', error.message);
  }
} 