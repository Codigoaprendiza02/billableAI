import axios from 'axios';

async function getGoogleOAuthUrl() {
  try {
    console.log('🔍 Getting Google OAuth URL...\n');
    
    const response = await axios.get('http://localhost:3001/api/auth/debug-oauth');
    
    console.log('✅ Google OAuth URL generated successfully!\n');
    console.log('🔗 Google OAuth URL:');
    console.log(response.data.fullAuthUrl);
    console.log('\n📋 Instructions:');
    console.log('   1. Copy the URL above');
    console.log('   2. Open it in your browser');
    console.log('   3. Sign in with Google');
    console.log('   4. Grant Gmail permissions');
    console.log('   5. Complete the OAuth flow');
    console.log('\n⚠️  Note: You will be redirected to a callback page');
    
  } catch (error) {
    console.error('❌ Error getting Google OAuth URL:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

getGoogleOAuthUrl(); 