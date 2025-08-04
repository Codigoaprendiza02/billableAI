import axios from 'axios';

const BASE_URL = 'http://localhost:3001';

async function testRoutes() {
  console.log('🔍 Testing Routes...\n');
  
  // Test 1: Health Check
  console.log('1. Testing Health Check...');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check: PASSED');
  } catch (error) {
    console.error('❌ Health Check: FAILED', error.message);
  }
  
  // Test 2: Test Email Tracking Start
  console.log('\n2. Testing Email Tracking Start...');
  try {
    const response = await axios.post(`${BASE_URL}/api/test/email-tracking/start`, {
      to: 'test@example.com',
      subject: 'Test',
      content: 'Test content'
    });
    console.log('✅ Email Tracking Start: PASSED');
    console.log('Response:', response.data);
  } catch (error) {
    console.error('❌ Email Tracking Start: FAILED');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
  }
  
  // Test 3: Test Sessions
  console.log('\n3. Testing Get Sessions...');
  try {
    const response = await axios.get(`${BASE_URL}/api/test/email-tracking/sessions`);
    console.log('✅ Get Sessions: PASSED');
    console.log('Response:', response.data);
  } catch (error) {
    console.error('❌ Get Sessions: FAILED');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
  }
}

testRoutes().catch(console.error); 