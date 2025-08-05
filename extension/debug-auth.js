// Debug script to check authentication status
console.log('🔍 Debugging Authentication Status...');

// Check localStorage
const authToken = localStorage.getItem('billableai_auth_token');
const userData = localStorage.getItem('billableai_user_data');

console.log('📋 localStorage check:');
console.log('  - Auth token exists:', !!authToken);
console.log('  - User data exists:', !!userData);

if (authToken) {
  console.log('  - Token length:', authToken.length);
  console.log('  - Token preview:', authToken.substring(0, 20) + '...');
}

if (userData) {
  try {
    const user = JSON.parse(userData);
    console.log('  - User name:', user.name);
    console.log('  - User email:', user.email);
  } catch (e) {
    console.log('  - Error parsing user data:', e.message);
  }
}

// Check chrome.storage.local
if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
  chrome.storage.local.get(['billableai_auth_token', 'billableai_user_data'], (result) => {
    console.log('📋 chrome.storage.local check:');
    console.log('  - Auth token exists:', !!result.billableai_auth_token);
    console.log('  - User data exists:', !!result.billableai_user_data);
    
    if (result.billableai_auth_token) {
      console.log('  - Token length:', result.billableai_auth_token.length);
    }
    
    if (result.billableai_user_data) {
      try {
        const user = JSON.parse(result.billableai_user_data);
        console.log('  - User name:', user.name);
        console.log('  - User email:', user.email);
      } catch (e) {
        console.log('  - Error parsing user data:', e.message);
      }
    }
  });
} else {
  console.log('📋 chrome.storage.local not available');
}

// Test simpleAuth
import('../src/utils/simpleAuth.js').then(({ isAuthenticated, getCurrentUser, getAuthToken }) => {
  console.log('📋 simpleAuth check:');
  console.log('  - isAuthenticated():', isAuthenticated());
  console.log('  - getAuthToken():', !!getAuthToken());
  console.log('  - getCurrentUser():', getCurrentUser()?.name || 'No user');
}); 