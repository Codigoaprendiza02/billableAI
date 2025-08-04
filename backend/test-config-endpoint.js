// Test script to verify backend config endpoint
import fetch from 'node-fetch';

async function testConfigEndpoint() {
  try {
    console.log('🔧 Testing backend config endpoint...');
    
    const response = await fetch('http://localhost:3001/api/config/config');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const config = await response.json();
    
    console.log('📋 Config endpoint response:', {
      hasGoogleClientId: !!config.googleClientId,
      hasClioClientId: !!config.clioClientId,
      hasGeminiApiKey: !!config.geminiApiKey,
      geminiApiKey: config.geminiApiKey ? `${config.geminiApiKey.substring(0, 10)}...` : 'not set',
      geminiApiKeyLength: config.geminiApiKey?.length || 0,
      isPlaceholder: config.geminiApiKey === 'your_gemini_api_key_here',
      startsWithAIzaSy: config.geminiApiKey?.startsWith('AIzaSy')
    });
    
    if (config.geminiApiKey && config.geminiApiKey !== 'your_gemini_api_key_here' && config.geminiApiKey.startsWith('AIzaSy')) {
      console.log('✅ Gemini API key is properly configured!');
    } else {
      console.log('❌ Gemini API key is not properly configured');
      console.log('   Please update backend/env.local with your actual Gemini API key');
    }
    
  } catch (error) {
    console.error('❌ Error testing config endpoint:', error.message);
    console.log('   Make sure the backend server is running: cd backend && npm start');
  }
}

testConfigEndpoint(); 