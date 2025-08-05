import axios from 'axios';

async function checkOAuthConfig() {
  console.log('🔍 Checking OAuth Configuration...\n');
  
  try {
    // Check backend health
    console.log('📊 Checking backend health...');
    const healthResponse = await axios.get('http://localhost:3001/health');
    console.log('✅ Backend is healthy:', healthResponse.data.status);
    
    // Check OAuth configuration
    console.log('\n🔐 Checking OAuth configuration...');
    const oauthResponse = await axios.get('http://localhost:3001/api/auth/test-oauth');
    console.log('✅ OAuth configuration:', {
      hasClientId: oauthResponse.data.hasClientId,
      hasClientSecret: oauthResponse.data.hasClientSecret,
      clientIdStart: oauthResponse.data.clientIdStart,
      clientIdEnd: oauthResponse.data.clientIdEnd
    });
    
    // Check Google OAuth URL
    console.log('\n🔗 Checking Google OAuth URL...');
    const googleResponse = await axios.get('http://localhost:3001/api/auth/debug-oauth');
    console.log('✅ Google OAuth URL generated');
    console.log('URL length:', googleResponse.data.fullAuthUrl.length, 'characters');
    
    // Check Clio OAuth URL
    console.log('\n🏢 Checking Clio OAuth URL...');
    const clioResponse = await axios.get('http://localhost:3001/api/auth/debug-clio-oauth');
    console.log('✅ Clio OAuth URL generated');
    console.log('URL length:', clioResponse.data.fullAuthUrl.length, 'characters');
    
    console.log('\n🎉 All OAuth configurations are working!');
    console.log('\n📋 Ready to test:');
    console.log('1. Google OAuth: node get-google-oauth-url.js');
    console.log('2. Clio OAuth: node get-clio-oauth-url.js');
    
  } catch (error) {
    console.error('❌ OAuth configuration check failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

checkOAuthConfig(); 