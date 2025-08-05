import axios from 'axios';

async function quickTest() {
  console.log('🧪 Quick Authentication Test...\n');
  
  try {
    // Test login with sample user
    console.log('🔐 Testing login with lawyer1...');
    const response = await axios.post('http://localhost:3001/api/auth/login', {
      username: 'lawyer1',
      password: 'TestPassword123!@#'
    });
    
    console.log('✅ Login successful!');
    console.log('User:', response.data.user.name);
    console.log('Token received:', response.data.token ? 'Yes' : 'No');
    
    // Test profile with token
    console.log('\n👤 Testing profile endpoint...');
    const profileResponse = await axios.get('http://localhost:3001/api/auth/profile', {
      headers: { Authorization: `Bearer ${response.data.token}` }
    });
    
    console.log('✅ Profile successful!');
    console.log('User profile:', profileResponse.data.user.name);
    
    console.log('\n🎉 Authentication system is working!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

quickTest(); 