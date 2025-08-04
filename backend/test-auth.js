import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './.env' });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function testAuth() {
  try {
    console.log('🔐 Testing API key authentication...');
    console.log('API Key:', GEMINI_API_KEY ? `${GEMINI_API_KEY.substring(0, 10)}...` : 'undefined');
    
    // Try to get project info (this should work if API key is valid)
    const response = await axios.get(
      'https://generativelanguage.googleapis.com/v1/models',
      {
        headers: {
          'x-goog-api-key': GEMINI_API_KEY
        }
      }
    );
    
    console.log('✅ Authentication successful!');
    console.log('Available models:', response.data.models?.length || 0);
    
  } catch (error) {
    console.error('❌ Authentication failed:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.error?.message);
    
    if (error.response?.status === 403) {
      console.log('\n💡 This suggests the API key is valid but lacks permissions.');
      console.log('Try creating a new API key or check the API permissions.');
    }
  }
}

testAuth(); 