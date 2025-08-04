// Test backend connection
import fetch from 'node-fetch';

async function testBackendConnection() {
  try {
    console.log('🔧 Testing backend connection...');
    
    const response = await fetch('http://localhost:3001/api/config/config');
    
    if (response.ok) {
      const config = await response.json();
      console.log('✅ Backend is running and responding!');
      console.log('📋 Configuration received:', {
        hasGoogleClientId: !!config.googleClientId,
        hasClioClientId: !!config.clioClientId,
        hasGeminiApiKey: !!config.geminiApiKey,
        geminiApiKey: config.geminiApiKey ? `${config.geminiApiKey.substring(0, 10)}...` : 'not set'
      });
      
      if (config.geminiApiKey && config.geminiApiKey !== 'your_gemini_api_key_here' && config.geminiApiKey.startsWith('AIzaSy')) {
        console.log('✅ Gemini API key is properly configured!');
        return true;
      } else {
        console.log('❌ Gemini API key is not properly configured');
        return false;
      }
    } else {
      console.log(`❌ Backend responded with status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Backend connection failed: ${error.message}`);
    return false;
  }
}

testBackendConnection(); 