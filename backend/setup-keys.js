// Setup script to configure API keys
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function setupKeys() {
  console.log('🔧 BillableAI API Key Setup\n');
  
  console.log('📋 Required API Keys:');
  console.log('');
  console.log('1️⃣ Google OAuth (for Gmail integration):');
  console.log('   - Go to: https://console.cloud.google.com/apis/credentials');
  console.log('   - Create OAuth 2.0 Client ID');
  console.log('   - Format: 123456789-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com');
  console.log('');
  
  console.log('2️⃣ Clio OAuth (for legal practice management):');
  console.log('   - Go to: https://app.clio.com/developers');
  console.log('   - Create a new application');
  console.log('   - Get Client ID and Secret');
  console.log('');
  
  console.log('3️⃣ Gemini API Key (for AI features):');
  console.log('   - Go to: https://aistudio.google.com/app/apikey');
  console.log('   - Create API key');
  console.log('   - Format: AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');
  console.log('');
  
  console.log('4️⃣ JWT Secret (for authentication):');
  console.log('   - Generate a secure random string');
  console.log('   - Example: billableai_jwt_secret_2024_secure_random_string');
  console.log('');
  
  console.log('📝 Instructions:');
  console.log('1. Get your API keys from the sources above');
  console.log('2. Update backend/env.local with your actual keys');
  console.log('3. Restart the backend server: npm start');
  console.log('4. Test the configuration: node test-complete-import-chain.js');
  console.log('');
  
  // Check current env.local
  const envPath = path.join(__dirname, 'env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    console.log('🔍 Current env.local status:');
    lines.forEach(line => {
      if (line.includes('=your_') && line.includes('_here')) {
        console.log(`   ❌ ${line.trim()}`);
      } else if (line.includes('=') && !line.startsWith('#') && !line.startsWith('PORT') && !line.startsWith('NODE_ENV') && !line.startsWith('MONGODB_URI') && !line.startsWith('ALLOWED_ORIGINS')) {
        console.log(`   ✅ ${line.trim()}`);
      }
    });
  }
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Update the keys marked with ❌ above');
  console.log('2. Save the env.local file');
  console.log('3. Restart the backend server');
  console.log('4. Test the configuration');
}

setupKeys(); 