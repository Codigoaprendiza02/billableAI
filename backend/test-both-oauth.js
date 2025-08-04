import axios from 'axios';

async function testBothOAuth() {
  console.log('🧪 Testing Complete OAuth Flow (Google + Clio)...\n');
  
  try {
    // Step 1: Test Google OAuth URL
    console.log('🔗 Step 1: Testing Google OAuth URL...');
    const googleResponse = await axios.get('http://localhost:3001/api/auth/debug-oauth');
    console.log('✅ Google OAuth URL ready');
    console.log('URL length:', googleResponse.data.fullAuthUrl.length, 'characters');
    
    // Step 2: Test Clio OAuth URL
    console.log('\n🏢 Step 2: Testing Clio OAuth URL...');
    const clioResponse = await axios.get('http://localhost:3001/api/auth/debug-clio-oauth');
    console.log('✅ Clio OAuth URL ready');
    console.log('URL length:', clioResponse.data.fullAuthUrl.length, 'characters');
    
    // Step 3: Test OAuth configuration
    console.log('\n🔐 Step 3: Testing OAuth configuration...');
    const oauthResponse = await axios.get('http://localhost:3001/api/auth/test-oauth');
    console.log('✅ OAuth configuration verified');
    
    console.log('\n🎉 OAuth Flow Test Results:');
    console.log('✅ Google OAuth URL: Ready');
    console.log('✅ Clio OAuth URL: Ready');
    console.log('✅ OAuth Configuration: Valid');
    
    console.log('\n📋 Complete Testing Steps:');
    console.log('1. Google OAuth:');
    console.log('   - Copy Google OAuth URL');
    console.log('   - Open in browser');
    console.log('   - Sign in with Google');
    console.log('   - Grant Gmail permissions');
    console.log('   - Verify HTML success page (not JSON)');
    console.log('   - Check browser console for "✅ JWT token stored in localStorage"');
    
    console.log('\n2. Clio OAuth:');
    console.log('   - Copy Clio OAuth URL');
    console.log('   - Open in browser');
    console.log('   - Sign in with Clio');
    console.log('   - Grant permissions');
    console.log('   - Verify callback page processes automatically');
    console.log('   - Check for success message');
    
    console.log('\n🔍 Debug Commands:');
    console.log('- Google OAuth URL: node test-google-oauth.js');
    console.log('- Clio OAuth URL: node test-clio-oauth.js');
    console.log('- Both URLs: node test-both-oauth.js');
    
    console.log('\n⚠️  Troubleshooting:');
    console.log('- If Google OAuth returns JSON instead of HTML: Check browser detection logic');
    console.log('- If Clio OAuth shows "No JWT token found": Complete Google OAuth first');
    console.log('- If Clio OAuth shows "Route not found": Check route definitions');
    
  } catch (error) {
    console.error('❌ OAuth flow test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testBothOAuth(); 