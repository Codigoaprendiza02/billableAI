import axios from 'axios';

const BASE_URL = 'http://localhost:3001';

async function testSimpleEmailTracking() {
  console.log('🔍 Testing Simple Email Tracking...\n');
  
  // Test 1: Health Check
  console.log('1. Testing Health Check...');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check: PASSED');
  } catch (error) {
    console.error('❌ Health Check: FAILED', error.message);
    return;
  }
  
  // Test 2: Simple Email Tracking Start
  console.log('\n2. Testing Simple Email Tracking Start...');
  try {
    const response = await axios.post(`${BASE_URL}/api/simple-test/email-tracking/start`, {
      to: 'client@example.com',
      subject: 'Test Email Subject',
      content: 'This is a test email content for billing tracking.'
    });
    console.log('✅ Simple Email Tracking Start: PASSED');
    console.log('Response:', response.data);
    
    if (response.data.sessionId) {
      console.log(`📝 Session ID: ${response.data.sessionId}`);
      console.log(`⏰ Start Time: ${response.data.startTime}`);
    }
    
  } catch (error) {
    console.error('❌ Simple Email Tracking Start: FAILED');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
  }
}

testSimpleEmailTracking().catch(console.error); 