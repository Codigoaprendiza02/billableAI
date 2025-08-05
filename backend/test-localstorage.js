import axios from 'axios';

async function testLocalStorage() {
  console.log('🧪 Testing localStorage Debug...\n');
  
  try {
    // Get Google OAuth URL
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
    console.log('5. After seeing the success page, open browser console (F12)');
    console.log('6. Run these commands in console:');
    console.log('   - Object.keys(localStorage)');
    console.log('   - localStorage.getItem("authToken")');
    console.log('   - localStorage.getItem("jwt_token")');
    console.log('   - localStorage.getItem("token")');
    console.log('   - localStorage.getItem("user")');
    console.log('7. Check what keys and values are stored');
    
    console.log('\n🔍 Expected Results:');
    console.log('- Should see "authToken" key with JWT string');
    console.log('- Should see "user" key with user object');
    console.log('- Both should not be null or undefined');
    
    console.log('\n⚠️  Debug Steps:');
    console.log('1. Complete Google OAuth first');
    console.log('2. Check browser console for stored keys');
    console.log('3. Verify token is stored as "authToken"');
    console.log('4. Then try Clio OAuth');
    
  } catch (error) {
    console.error('❌ localStorage test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testLocalStorage(); 