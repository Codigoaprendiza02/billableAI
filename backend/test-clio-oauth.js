import axios from 'axios';

async function testClioOAuth() {
  console.log('🧪 Testing Clio OAuth...\n');
  
  try {
    // Test 1: Get Clio OAuth URL
    console.log('🔗 Step 1: Getting Clio OAuth URL...');
    const response = await axios.get('http://localhost:3001/api/auth/debug-clio-oauth');
    
    console.log('✅ Clio OAuth URL generated successfully!');
    console.log('🔗 URL:');
    console.log(response.data.fullAuthUrl);
    
    console.log('\n📋 Instructions:');
    console.log('1. Copy the URL above');
    console.log('2. Open it in your browser');
    console.log('3. Sign in with Clio');
    console.log('4. Grant permissions');
    console.log('5. You should see the Clio OAuth callback page');
    console.log('6. The page should automatically process the OAuth');
    
    console.log('\n⚠️  Prerequisites:');
    console.log('- Complete Google OAuth first');
    console.log('- JWT token should be in localStorage as "authToken"');
    console.log('- Check browser console for token storage');
    
    console.log('\n🔍 Debug Steps:');
    console.log('1. Open browser console');
    console.log('2. Check localStorage.getItem("authToken")');
    console.log('3. If no token, complete Google OAuth first');
    
  } catch (error) {
    console.error('❌ Clio OAuth test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testClioOAuth(); 