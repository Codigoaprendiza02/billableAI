import axios from 'axios';

const BASE_URL = 'http://localhost:3001';

async function testStepByStep() {
  console.log('🚀 Starting Step-by-Step Tests...\n');
  
  // Step 1: Health Check
  console.log('Step 1: Testing Health Check...');
  try {
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check PASSED:', healthResponse.data);
  } catch (error) {
    console.error('❌ Health Check FAILED:', error.message);
    return;
  }
  
  // Step 2: Email Tracking Start
  console.log('\nStep 2: Testing Email Tracking Start...');
  try {
    const startResponse = await axios.post(`${BASE_URL}/api/test/email-tracking/start`, {
      to: 'client@example.com',
      subject: 'Test Email Subject',
      content: 'This is a test email content for billing tracking.'
    });
    console.log('✅ Email Tracking Start PASSED:', startResponse.data);
    
    const sessionId = startResponse.data.sessionId;
    console.log(`📝 Session ID: ${sessionId}`);
    
    // Step 3: Activity Update
    console.log('\nStep 3: Testing Activity Update...');
    try {
      const activityResponse = await axios.post(`${BASE_URL}/api/test/email-tracking/activity`, {
        sessionId
      });
      console.log('✅ Activity Update PASSED:', activityResponse.data);
    } catch (error) {
      console.error('❌ Activity Update FAILED:', error.response?.data || error.message);
    }
    
    // Step 4: Stop Tracking
    console.log('\nStep 4: Testing Stop Tracking...');
    try {
      const stopResponse = await axios.post(`${BASE_URL}/api/test/email-tracking/stop`, {
        sessionId,
        finalContent: 'This is the final email content with more details about the legal matter.'
      });
      console.log('✅ Stop Tracking PASSED:', stopResponse.data);
      
      if (stopResponse.data.billingSummary) {
        console.log('📊 Billing Summary Generated:');
        console.log(`   - Time Spent: ${stopResponse.data.timeSpent}ms`);
        console.log(`   - Hours: ${stopResponse.data.billingSummary.hours}`);
        console.log(`   - Activity Type: ${stopResponse.data.billingSummary.metadata.activityType}`);
        console.log(`   - Word Count: ${stopResponse.data.billingSummary.metadata.wordCount}`);
      }
    } catch (error) {
      console.error('❌ Stop Tracking FAILED:', error.response?.data || error.message);
    }
    
    // Step 5: Send Email and Log Time
    console.log('\nStep 5: Testing Send Email and Log Time...');
    try {
      const sendResponse = await axios.post(`${BASE_URL}/api/test/email-tracking/send`, {
        sessionId,
        emailData: {
          to: 'client@example.com',
          subject: 'Legal Matter Update',
          content: 'Dear Client, I am writing to provide you with an update on your legal matter. We have reviewed the documents and prepared the necessary filings.'
        }
      });
      console.log('✅ Send Email and Log Time PASSED:', sendResponse.data);
    } catch (error) {
      console.error('❌ Send Email and Log Time FAILED:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('❌ Email Tracking Start FAILED:', error.response?.data || error.message);
  }
  
  // Step 6: Get Active Sessions
  console.log('\nStep 6: Testing Get Active Sessions...');
  try {
    const sessionsResponse = await axios.get(`${BASE_URL}/api/test/email-tracking/sessions`);
    console.log('✅ Get Active Sessions PASSED:', sessionsResponse.data);
  } catch (error) {
    console.error('❌ Get Active Sessions FAILED:', error.response?.data || error.message);
  }
  
  console.log('\n🎉 Step-by-Step Testing Complete!');
}

testStepByStep().catch(console.error); 