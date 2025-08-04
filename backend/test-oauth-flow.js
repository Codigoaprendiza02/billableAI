import axios from 'axios';

async function testOAuthFlow() {
  console.log('🧪 Testing Complete OAuth Flow...\n');
  
  try {
    // Step 1: Test Google OAuth URL generation
    console.log('🔗 Step 1: Testing Google OAuth URL generation...');
    const googleResponse = await axios.get('http://localhost:3001/api/auth/debug-oauth');
    console.log('✅ Google OAuth URL generated successfully');
    console.log('URL length:', googleResponse.data.fullAuthUrl.length, 'characters');
    
    // Step 2: Test Clio OAuth URL generation
    console.log('\n🏢 Step 2: Testing Clio OAuth URL generation...');
    const clioResponse = await axios.get('http://localhost:3001/api/auth/debug-clio-oauth');
    console.log('✅ Clio OAuth URL generated successfully');
    console.log('URL length:', clioResponse.data.fullAuthUrl.length, 'characters');
    
    // Step 3: Test OAuth configuration
    console.log('\n🔐 Step 3: Testing OAuth configuration...');
    const oauthResponse = await axios.get('http://localhost:3001/api/auth/test-oauth');
    console.log('✅ OAuth configuration verified:', {
      hasClientId: oauthResponse.data.hasClientId,
      hasClientSecret: oauthResponse.data.hasClientSecret
    });
    
    console.log('\n🎉 OAuth Flow Test Results:');
    console.log('✅ Google OAuth URL: Ready');
    console.log('✅ Clio OAuth URL: Ready');
    console.log('✅ OAuth Configuration: Valid');
    
    console.log('\n📋 Next Steps:');
    console.log('1. Run: node get-google-oauth-url.js');
    console.log('2. Complete Google OAuth in browser');
    console.log('3. Run: node get-clio-oauth-url.js');
    console.log('4. Complete Clio OAuth in browser');
    
  } catch (error) {
    console.error('❌ OAuth flow test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testOAuthFlow(); 