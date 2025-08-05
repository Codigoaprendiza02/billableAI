import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

console.log('🔍 Checking for .env files:');
console.log('==========================================');

// Check if .env file exists in current directory
const envPath = path.join(process.cwd(), '.env');
console.log('Looking for .env at:', envPath);
console.log('.env exists:', fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
  console.log('📄 .env file contents:');
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log(envContent);
} else {
  console.log('❌ .env file not found');
}

// Check if .env file exists in parent directory
const parentEnvPath = path.join(process.cwd(), '..', '.env');
console.log('\nLooking for .env in parent directory:', parentEnvPath);
console.log('Parent .env exists:', fs.existsSync(parentEnvPath));

if (fs.existsSync(parentEnvPath)) {
  console.log('📄 Parent .env file contents:');
  const parentEnvContent = fs.readFileSync(parentEnvPath, 'utf8');
  console.log(parentEnvContent);
}

// Load environment variables
console.log('\n🔄 Loading environment variables...');
dotenv.config();

console.log('\n📊 Environment Variables:');
console.log('==========================================');
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY);
console.log('GEMINI_API_KEY length:', process.env.GEMINI_API_KEY?.length || 0);
console.log('Is valid format?', process.env.GEMINI_API_KEY?.startsWith('AIzaSy'));
console.log('=========================================='); 