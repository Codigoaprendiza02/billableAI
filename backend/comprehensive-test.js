import axios from 'axios';

const BASE_URL = 'http://localhost:3001';

// Test functions
const tests = {
  // Test 1: Health Check
  async testHealthCheck() {
    console.log('\n🔍 Test 1: Health Check');
    try {
      const response = await axios.get(`${BASE_URL}/health`);
      console.log('✅ Health check passed:', response.data);
      return true;
    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      return false;
    }
  },

  // Test 2: Email Tracking Start
  async testEmailTrackingStart() {
    console.log('\n🔍 Test 2: Email Tracking Start');
    try {
      const response = await axios.post(`${BASE_URL}/api/test/email-tracking/start`, {
        to: 'client@example.com',
        subject: 'Test Email Subject',
        content: 'This is a test email content for billing tracking.'
      });
      console.log('✅ Email tracking start passed:', response.data);
      return response.data.sessionId;
    } catch (error) {
      console.error('❌ Email tracking start failed:', error.response?.data || error.message);
      return null;
    }
  },

  // Test 3: Email Tracking Activity Update
  async testEmailTrackingActivity(sessionId) {
    console.log('\n🔍 Test 3: Email Tracking Activity Update');
    try {
      const response = await axios.post(`${BASE_URL}/api/test/email-tracking/activity`, {
        sessionId
      });
      console.log('✅ Email tracking activity update passed:', response.data);
      return true;
    } catch (error) {
      console.error('❌ Email tracking activity update failed:', error.response?.data || error.message);
      return false;
    }
  },

  // Test 4: Email Tracking Stop
  async testEmailTrackingStop(sessionId) {
    console.log('\n🔍 Test 4: Email Tracking Stop');
    try {
      const response = await axios.post(`${BASE_URL}/api/test/email-tracking/stop`, {
        sessionId,
        finalContent: 'This is the final email content with more details about the legal matter.'
      });
      console.log('✅ Email tracking stop passed:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Email tracking stop failed:', error.response?.data || error.message);
      return null;
    }
  },

  // Test 5: Send Email and Log Time
  async testSendEmailAndLogTime(sessionId) {
    console.log('\n🔍 Test 5: Send Email and Log Time');
    try {
      const response = await axios.post(`${BASE_URL}/api/test/email-tracking/send`, {
        sessionId,
        emailData: {
          to: 'client@example.com',
          subject: 'Legal Matter Update',
          content: 'Dear Client, I am writing to provide you with an update on your legal matter. We have reviewed the documents and prepared the necessary filings.'
        }
      });
      console.log('✅ Send email and log time passed:', response.data);
      return true;
    } catch (error) {
      console.error('❌ Send email and log time failed:', error.response?.data || error.message);
      return false;
    }
  },

  // Test 6: Get Active Sessions
  async testGetActiveSessions() {
    console.log('\n🔍 Test 6: Get Active Sessions');
    try {
      const response = await axios.get(`${BASE_URL}/api/test/email-tracking/sessions`);
      console.log('✅ Get active sessions passed:', response.data);
      return true;
    } catch (error) {
      console.error('❌ Get active sessions failed:', error.response?.data || error.message);
      return false;
    }
  }
};

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting BillableAI Email Tracking Tests...\n');
  
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: Health Check
  const healthCheck = await tests.testHealthCheck();
  results.tests.push({ name: 'Health Check', passed: healthCheck });
  if (healthCheck) results.passed++; else results.failed++;

  // Test 2: Email Tracking Start
  const sessionId = await tests.testEmailTrackingStart();
  results.tests.push({ name: 'Email Tracking Start', passed: !!sessionId });
  if (sessionId) results.passed++; else results.failed++;

  if (sessionId) {
    // Test 3: Activity Update
    const activityUpdate = await tests.testEmailTrackingActivity(sessionId);
    results.tests.push({ name: 'Activity Update', passed: activityUpdate });
    if (activityUpdate) results.passed++; else results.failed++;

    // Test 4: Stop Tracking
    const stopTracking = await tests.testEmailTrackingStop(sessionId);
    results.tests.push({ name: 'Stop Tracking', passed: !!stopTracking });
    if (stopTracking) results.passed++; else results.failed++;

    // Test 5: Send Email and Log Time
    const sendEmail = await tests.testSendEmailAndLogTime(sessionId);
    results.tests.push({ name: 'Send Email and Log Time', passed: sendEmail });
    if (sendEmail) results.passed++; else results.failed++;
  }

  // Test 6: Get Active Sessions
  const activeSessions = await tests.testGetActiveSessions();
  results.tests.push({ name: 'Get Active Sessions', passed: activeSessions });
  if (activeSessions) results.passed++; else results.failed++;

  // Print results
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  results.tests.forEach(test => {
    console.log(`${test.passed ? '✅' : '❌'} ${test.name}`);
  });
  console.log(`\n🎯 Total: ${results.passed + results.failed} tests`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

  return results;
}

runAllTests().catch(console.error); 