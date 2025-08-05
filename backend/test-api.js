// Simple API test script
import axios from 'axios';

const BASE_URL = 'http://localhost:3001/api';

async function testEmailTracking() {
  try {
    console.log('Testing email tracking endpoint...');
    
    const response = await axios.post(`${BASE_URL}/email-tracking/start`, {
      to: 'test@example.com',
      subject: 'Test Email',
      content: 'Test content'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock_token'
      }
    });
    
    console.log('✅ Email tracking test passed:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Email tracking test failed:', error.response?.data || error.message);
    return null;
  }
}

async function testHealth() {
  try {
    console.log('Testing health endpoint...');
    
    const response = await axios.get('http://localhost:3001/health');
    
    console.log('✅ Health test passed:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Health test failed:', error.response?.data || error.message);
    return null;
  }
}

async function runTests() {
  console.log('🧪 Running API tests...');
  
  await testHealth();
  await testEmailTracking();
  
  console.log('✅ Tests completed');
}

runTests().catch(console.error); 
testEmailTracking(); 
testEmailTracking(); 
testEmailTracking(); 
testEmailTracking(); 
testEmailTracking(); 
testEmailTracking(); 
testEmailTracking(); 
testEmailTracking(); 
testEmailTracking(); 