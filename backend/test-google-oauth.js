import axios from 'axios';

async function testGoogleOAuth() {
  console.log('🧪 Testing Google OAuth...\n');
  
  try {
    // Test 1: Get Google OAuth URL
    console.log('🔗 Step 1: Getting Google OAuth URL...');
    const response = await axios.get('http://localhost:3001/api/auth/debug-oauth');
    
    console.log('✅ Google OAuth URL generated successfully!');
    console.log('🔗 URL:');
    console.log(response.data.fullAuthUrl);
    
    console.log('\n📋 Instructions:');
    console.log('1. Copy the URL above');
    console.log('2. Open it in your browser');
    console.log('3. Sign in with Google');
    console.log('4. Grant Gmail permissions');
    console.log('5. You should see an HTML success page (not JSON)');
    console.log('6. Check browser console for "✅ JWT token stored in localStorage"');
    
    console.log('\n⚠️  Expected Result:');
    console.log('- HTML page with success message');
    console.log('- JWT token displayed');
    console.log('- Token stored in localStorage');
    console.log('- Links to test Clio OAuth');
    
  } catch (error) {
    console.error('❌ Google OAuth test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testGoogleOAuth(); 