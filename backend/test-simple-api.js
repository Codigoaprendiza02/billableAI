import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './.env' });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function testSimpleAPI() {
  try {
    console.log('🧪 Testing simple Gemini API call...');
    console.log('API Key:', GEMINI_API_KEY ? `${GEMINI_API_KEY.substring(0, 10)}...` : 'undefined');
    
    // Try a simple content generation call
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent',
      {
        contents: [{
          parts: [{
            text: 'Hello, can you respond with "API is working"?'
          }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY
        }
      }
    );
    
    console.log('✅ API Response:');
    console.log('Status:', response.status);
    console.log('Data:', response.data);
    
  } catch (error) {
    console.error('❌ API Error:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.error?.message);
    console.error('Code:', error.response?.data?.error?.code);
  }
}

testSimpleAPI(); 