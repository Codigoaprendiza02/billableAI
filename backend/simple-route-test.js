import axios from 'axios';

const BASE_URL = 'http://localhost:3001';

async function testSimpleRoutes() {
  console.log('🔍 Testing Simple Routes...\n');
  
  // Test 1: Health Check
  console.log('1. Testing Health Check...');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check: PASSED');
    console.log('Response:', response.data);
  } catch (error) {
    console.error('❌ Health Check: FAILED', error.message);
    return;
  }
  
  // Test 2: Test if server is responding
  console.log('\n2. Testing Server Response...');
  try {
    const response = await axios.get(`${BASE_URL}/`);
    console.log('✅ Server Root: PASSED');
    console.log('Response:', response.data);
  } catch (error) {
    console.error('❌ Server Root: FAILED');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
  }
  
  // Test 3: Test a non-existent route to see error handling
  console.log('\n3. Testing Non-existent Route...');
  try {
    const response = await axios.get(`${BASE_URL}/api/nonexistent`);
    console.log('✅ Non-existent Route: PASSED (unexpected)');
  } catch (error) {
    console.log('✅ Non-existent Route: FAILED (expected)');
    console.log('Error:', error.response?.data);
  }
  
  // Test 4: Test if test routes are accessible
  console.log('\n4. Testing Test Routes...');
  try {
    const response = await axios.get(`${BASE_URL}/api/test/email-tracking/sessions`);
    console.log('✅ Test Routes: PASSED');
    console.log('Response:', response.data);
  } catch (error) {
    console.log('❌ Test Routes: FAILED');
    console.log('Status:', error.response?.status);
    console.log('Data:', error.response?.data);
  }
}

testSimpleRoutes().catch(console.error); 