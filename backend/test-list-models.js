import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './.env' });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function listModels() {
  try {
    console.log('🔍 Listing available Gemini models...');
    console.log('API Key:', GEMINI_API_KEY ? `${GEMINI_API_KEY.substring(0, 10)}...` : 'undefined');
    
    const response = await axios.get(
      'https://generativelanguage.googleapis.com/v1/models',
      {
        headers: {
          'x-goog-api-key': GEMINI_API_KEY
        }
      }
    );
    
    console.log('✅ Available models:');
    response.data.models.forEach(model => {
      console.log(`- ${model.name}: ${model.description || 'No description'}`);
    });
    
  } catch (error) {
    console.error('❌ Error listing models:', error.response?.data || error.message);
  }
}

listModels(); 