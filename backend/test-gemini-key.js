import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ path: './.env' });

console.log('🔍 Checking Gemini API Key Configuration:');
console.log('==========================================');
console.log('GEMINI_API_KEY value:', process.env.GEMINI_API_KEY);
console.log('GEMINI_API_KEY length:', process.env.GEMINI_API_KEY?.length || 0);
console.log('Is placeholder?', process.env.GEMINI_API_KEY === 'your_gemini_api_key');
console.log('Is valid format?', process.env.GEMINI_API_KEY?.startsWith('AIzaSy'));
console.log('Is empty?', !process.env.GEMINI_API_KEY);
console.log('==========================================');

if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key' && process.env.GEMINI_API_KEY.startsWith('AIzaSy')) {
  console.log('✅ Valid Gemini API key detected!');
} else {
  console.log('❌ Invalid or missing Gemini API key');
  console.log('📝 Please update backend/env.local with your real API key');
} 