import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './env.local' });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function testGeminiPrompt() {
  try {
    console.log('🧪 Testing Gemini API with billing prompt...');
    console.log('API Key:', GEMINI_API_KEY ? `${GEMINI_API_KEY.substring(0, 10)}...` : 'undefined');
    
    const emailText = "This is a test email for legal consultation regarding contract review.";
    const timeSpent = 180;
    const emailTone = 'formal';
    
    const prompt = `Write a concise legal billing summary (1-2 sentences) for this email. Include the time spent in the summary.

Email: ${emailText}
Time spent: ${(timeSpent / 3600).toFixed(2)} hours

Summary:`;
    
    console.log('📝 Prompt being sent:');
    console.log(prompt);
    
    // Try the API call
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent',
      {
        contents: [{
          parts: [{
            text: prompt
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
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ API Error:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.error?.message);
    console.error('Code:', error.response?.data?.error?.code);
    console.error('Full error:', error.response?.data);
  }
}

testGeminiPrompt(); 