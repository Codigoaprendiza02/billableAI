// Build script for BillableAI Extension
// Fetches configuration from backend and updates manifest.json

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fetchConfig() {
  try {
    console.log('🔧 Fetching configuration from backend...');
    const response = await fetch('http://localhost:3001/api/config/config');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch config: ${response.status}`);
    }
    
    const config = await response.json();
    console.log('✅ Configuration fetched successfully from existing .env file');
    return config;
  } catch (error) {
    console.error('❌ Error fetching config from backend:', error.message);
    console.log('\n🔧 Setup Instructions:');
    console.log('1. Ensure backend/.env file exists with your actual credentials');
    console.log('2. Start the backend server: cd backend && npm start');
    console.log('3. Run this build script again');
    console.log('\n📝 Note: Do not modify the existing .env file as it contains your actual credentials');
    
    // Fallback to default config
    console.log('\n⚠️  Using fallback configuration...');
    return {
      googleClientId: 'your_google_client_id_here',
      geminiApiKey: 'your_gemini_api_key_here',
      clioClientId: 'your_clio_client_id_here'
    };
  }
}

async function updateManifest() {
  try {
    console.log('🔧 Building BillableAI Extension...');
    
    // Fetch configuration from backend
    const config = await fetchConfig();
    
    // Read manifest template
    const manifestPath = path.join(__dirname, 'public', 'manifest.json');
    let manifestContent = fs.readFileSync(manifestPath, 'utf8');
    
    // Replace placeholders with actual values
    manifestContent = manifestContent.replace('{{GOOGLE_CLIENT_ID}}', config.googleClientId);
    
    // Write updated manifest
    fs.writeFileSync(manifestPath, manifestContent);
    console.log('✅ Manifest.json updated with configuration');
    
    // Check if using placeholder values
    if (config.googleClientId.includes('your_') || config.googleClientId.includes('here')) {
      console.log('⚠️  WARNING: Using placeholder values. Please ensure your .env file contains actual credentials.');
      console.log('📖 See backend/SECURE_SETUP.md for detailed instructions.');
    } else {
      console.log('✅ Using actual credentials from existing .env file');
    }
    
    console.log('🎉 Extension build completed successfully!');
    console.log(`📋 Google Client ID: ${config.googleClientId}`);
    
  } catch (error) {
    console.error('❌ Error building extension:', error);
    process.exit(1);
  }
}

// Run the build
updateManifest(); 