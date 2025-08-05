import axios from 'axios';

async function getClioOAuthUrl() {
  try {
    console.log('🔍 Getting Clio OAuth URL...\n');
    
    const response = await axios.get('http://localhost:3001/api/auth/debug-clio-oauth');
    
    console.log('✅ Clio OAuth URL generated successfully!\n');
    console.log('🔗 Clio OAuth URL:');
    console.log(response.data.fullAuthUrl);
    console.log('\n📋 Instructions:');
    console.log('   1. Complete Google OAuth first (get JWT token)');
    console.log('   2. Copy the URL above');
    console.log('   3. Open it in your browser');
    console.log('   4. Sign in to Clio');
    console.log('   5. Grant permissions for profile, matters, clients, time entries');
    console.log('   6. Complete the OAuth flow');
    console.log('\n⚠️  Note: You need a valid JWT token from Google OAuth first');
    
  } catch (error) {
    console.error('❌ Error getting Clio OAuth URL:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

getClioOAuthUrl(); 