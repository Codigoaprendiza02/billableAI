import dotenv from 'dotenv';
import { generateSummary } from './src/services/gptService.js';

// Load environment variables
dotenv.config({ path: './env.local' });

async function testGPTDirect() {
  try {
    console.log('🧪 Testing GPT service directly...');
    
    const emailText = 'This is a test email about legal consultation for a client regarding contract review.';
    const timeSpent = 180; // 3 minutes
    const userPreferences = { emailTone: 'formal' };
    
    console.log('📝 Calling generateSummary...');
    const result = await generateSummary(emailText, timeSpent, userPreferences, 'gemini');
    
    console.log('✅ GPT Result:');
    console.log('Summary:', result.summary);
    console.log('Metadata:', result.metadata);
    console.log('Model used:', result.metadata.model);
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testGPTDirect(); 