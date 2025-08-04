// Comprehensive test for complete import chain
import fetch from 'node-fetch';
import { GEMINI_API_KEY } from './src/config.js';

async function testCompleteImportChain() {
  console.log('🔧 Testing complete import chain...\n');
  
  // Step 1: Check backend environment variables
  console.log('1️⃣ Backend Environment Variables:');
  console.log('   GEMINI_API_KEY:', GEMINI_API_KEY ? `${GEMINI_API_KEY.substring(0, 10)}...` : 'not set');
  console.log('   Key length:', GEMINI_API_KEY?.length || 0);
  console.log('   Is placeholder:', GEMINI_API_KEY === 'your_gemini_api_key_here');
  console.log('   Starts with AIzaSy:', GEMINI_API_KEY?.startsWith('AIzaSy'));
  console.log('');
  
  // Step 2: Test backend config endpoint
  console.log('2️⃣ Backend Config Endpoint:');
  try {
    const response = await fetch('http://localhost:3001/api/config/config');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const config = await response.json();
    
    console.log('   ✅ Endpoint accessible');
    console.log('   geminiApiKey:', config.geminiApiKey ? `${config.geminiApiKey.substring(0, 10)}...` : 'not set');
    console.log('   Key length:', config.geminiApiKey?.length || 0);
    console.log('   Is placeholder:', config.geminiApiKey === 'your_gemini_api_key_here');
    console.log('   Starts with AIzaSy:', config.geminiApiKey?.startsWith('AIzaSy'));
    console.log('');
    
    // Step 3: Test extension config import (simulated)
    console.log('3️⃣ Extension Config Import (Simulated):');
    console.log('   ✅ ConfigService would receive:', {
      hasGeminiApiKey: !!config.geminiApiKey,
      geminiApiKey: config.geminiApiKey ? `${config.geminiApiKey.substring(0, 10)}...` : 'not set',
      isValid: config.geminiApiKey && config.geminiApiKey !== 'your_gemini_api_key_here' && config.geminiApiKey.startsWith('AIzaSy')
    });
    console.log('');
    
    // Step 4: Test GeminiService import (simulated)
    console.log('4️⃣ GeminiService Import (Simulated):');
    const isValidKey = config.geminiApiKey && config.geminiApiKey !== 'your_gemini_api_key_here' && config.geminiApiKey.startsWith('AIzaSy');
    console.log('   ✅ GeminiService would receive:', {
      isValidKey,
      apiKey: isValidKey ? `${config.geminiApiKey.substring(0, 10)}...` : 'fallback'
    });
    console.log('');
    
    // Summary
    console.log('📋 Summary:');
    if (isValidKey) {
      console.log('   ✅ Gemini API key is properly configured and would be imported correctly');
    } else {
      console.log('   ❌ Gemini API key is not properly configured');
      console.log('   📝 To fix: Update backend/env.local with your actual Gemini API key');
      console.log('   📝 Format: GEMINI_API_KEY=AIzaSyYourActualKeyHere');
    }
    
  } catch (error) {
    console.error('❌ Error testing config endpoint:', error.message);
    console.log('   Make sure the backend server is running: cd backend && npm start');
  }
}

testCompleteImportChain(); 