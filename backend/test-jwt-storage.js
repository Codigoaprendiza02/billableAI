import axios from 'axios';

async function testJWTStorage() {
  console.log('🧪 Testing JWT Token Storage...\n');
  
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
    console.log('5. After seeing the success page, open browser console');
    console.log('6. Run these commands in console:');
    console.log('   - localStorage.getItem("authToken")');
    console.log('   - localStorage.getItem("user")');
    console.log('7. Check if tokens are stored properly');
    
    console.log('\n🔍 Expected Results:');
    console.log('- authToken should be a long JWT string');
    console.log('- user should be a JSON object with user data');
    console.log('- Both should not be null or undefined');
    
    console.log('\n⚠️  Debug Steps:');
    console.log('1. Open browser console (F12)');
    console.log('2. Check localStorage contents');
    console.log('3. If tokens are missing, Google OAuth failed');
    console.log('4. If tokens exist, Clio OAuth should work');
    
  } catch (error) {
    console.error('❌ JWT storage test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testJWTStorage(); 