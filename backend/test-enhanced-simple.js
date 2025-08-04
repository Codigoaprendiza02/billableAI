// Simple Enhanced BillableAI Functionality Test
// Tests the enhanced features with correct port and authentication

import axios from 'axios';

const BASE_URL = 'http://localhost:3001/api';
const AUTH_TOKEN = 'mock_auth_token_' + Date.now();
const TEST_USER_ID = '688a35729151cc3796ed040a'; // Real test user ID from database

// Test data
const testEmailData = {
  to: 'client@example.com',
  subject: 'Contract Review and Legal Analysis',
  content: `Dear Client,

I have completed my review of the proposed contract for the merger agreement. The document contains several clauses that require attention:

1. Section 3.2 - Liability limitations appear to be overly broad
2. Section 5.1 - Termination clauses need clarification
3. Section 7.3 - Intellectual property rights require additional protection

I recommend we schedule a meeting to discuss these points and negotiate better terms. The current draft exposes us to unnecessary legal risks.

Please let me know your availability for next week.

Best regards,
Attorney`,
  from: 'attorney@lawfirm.com'
};

console.log('🧪 Starting Simple Enhanced BillableAI Functionality Test');
console.log('=' .repeat(60));

// Test 1: Health Check
async function testHealthCheck() {
  console.log('\n🔍 Test 1: Health Check');
  console.log('-'.repeat(40));
  
  try {
    const response = await axios.get(`${BASE_URL.replace('/api', '')}/health`);
    console.log('✅ Health check passed:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

// Test 2: Email Tracking Start
async function testEmailTrackingStart() {
  console.log('\n📧 Test 2: Email Tracking Start');
  console.log('-'.repeat(40));
  
  try {
    const response = await axios.post(`${BASE_URL}/email-tracking/start`, {
      to: testEmailData.to,
      subject: testEmailData.subject,
      content: testEmailData.content
    }, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Email tracking start passed:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Email tracking start failed:', error.response?.data || error.message);
    return null;
  }
}

// Test 3: Enhanced Billing Summary
async function testEnhancedBillingSummary() {
  console.log('\n📝 Test 3: Enhanced Billing Summary');
  console.log('-'.repeat(40));
  
  try {
    // First start a session
    const startResponse = await axios.post(`${BASE_URL}/email-tracking/start`, {
      to: testEmailData.to,
      subject: testEmailData.subject,
      content: testEmailData.content
    });
    
    const sessionId = startResponse.data.sessionId;
    
    // Wait a moment for session to be established
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Now stop the session
    const response = await axios.post(`${BASE_URL}/email-tracking/stop`, {
      sessionId: sessionId,
      finalContent: testEmailData.content
    });
    
    console.log('✅ Enhanced billing summary passed:', {
      timeSpent: response.data.timeSpent,
      summary: response.data.billingSummary?.summary,
      metadata: response.data.billingSummary?.metadata
    });
    return response.data;
  } catch (error) {
    console.error('❌ Enhanced billing summary failed:', error.response?.data || error.message);
    return null;
  }
}

// Test 4: Gmail API Integration
async function testGmailApiIntegration() {
  console.log('\n📧 Test 4: Gmail API Integration');
  console.log('-'.repeat(40));
  
  try {
    const { parseEmailContent } = await import('./src/services/gmailService.js');
    
    const parsedContent = parseEmailContent({
      headers: [
        { name: 'Subject', value: testEmailData.subject },
        { name: 'To', value: testEmailData.to },
        { name: 'From', value: testEmailData.from }
      ],
      payload: {
        body: { data: Buffer.from(testEmailData.content).toString('base64') }
      }
    });
    
    console.log('✅ Gmail API integration passed:', {
      isBillable: parsedContent.isBillable,
      category: parsedContent.billableCategory,
      confidence: parsedContent.confidence,
      keywords: parsedContent.billableKeywords,
      wordCount: parsedContent.wordCount
    });
    return parsedContent;
  } catch (error) {
    console.error('❌ Gmail API integration failed:', error.message);
    return null;
  }
}

// Test 5: Gemini AI Integration
async function testGeminiIntegration() {
  console.log('\n🤖 Test 5: Gemini AI Integration');
  console.log('-'.repeat(40));
  
  try {
    const { generateSummary, suggestClientMatter } = await import('./src/services/gptService.js');
    
    // Test summary generation
    const summary = await generateSummary(
      testEmailData.content,
      1800000, // 30 minutes
      { emailTone: 'formal' }
    );
    
    console.log('✅ Gemini AI integration passed:', {
      summary: summary.summary,
      metadata: summary.metadata
    });
    return summary;
  } catch (error) {
    console.error('❌ Gemini AI integration failed:', error.message);
    return null;
  }
}

// Test 6: Clio Integration
async function testClioIntegration() {
  console.log('\n⏰ Test 6: Clio Integration');
  console.log('-'.repeat(40));
  
  try {
    const { completeOneClickBilling } = await import('./src/services/clioService.js');
    
    const billingData = {
      summary: 'Legal analysis and correspondence regarding contract review. Time spent: 0.50 hours.',
      timeSpent: 1800000,
      suggestions: {
        suggestedMatter: 'Contract review and negotiation',
        matterType: 'contract',
        confidence: 0.85
      }
    };
    
    const billingResult = await completeOneClickBilling(TEST_USER_ID, testEmailData, billingData);
    
    console.log('✅ Clio integration passed:', {
      success: billingResult.success,
      client: billingResult.client,
      matter: billingResult.matter,
      timeEntry: billingResult.timeEntry
    });
    return billingResult;
  } catch (error) {
    console.error('❌ Clio integration failed:', error.message);
    return null;
  }
}

// Test 7: Test API Endpoints
async function testApiEndpoints() {
  console.log('\n🔧 Test 7: API Endpoints');
  console.log('-'.repeat(40));
  
  try {
    // Test basic endpoints with test authentication
    const testResponse = await axios.post(`${BASE_URL}/email-tracking/start`, {
      to: testEmailData.to,
      subject: testEmailData.subject,
      content: testEmailData.content
    });
    
    console.log('✅ API endpoints test passed:', {
      sessionId: testResponse.data.sessionId,
      startTime: testResponse.data.startTime
    });
    return testResponse.data;
  } catch (error) {
    console.error('❌ API endpoints test failed:', error.response?.data || error.message);
    return null;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🧪 Running Simple Enhanced BillableAI Functionality Tests');
  console.log('=' .repeat(60));
  
  const results = {
    healthCheck: await testHealthCheck(),
    emailTracking: await testEmailTrackingStart(),
    billingSummary: await testEnhancedBillingSummary(),
    gmailApi: await testGmailApiIntegration(),
    gemini: await testGeminiIntegration(),
    clio: await testClioIntegration(),
    apiEndpoints: await testApiEndpoints()
  };
  
  console.log('\n📊 Test Results Summary');
  console.log('=' .repeat(60));
  
  Object.entries(results).forEach(([testName, result]) => {
    const status = result ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${testName}`);
  });
  
  const passedTests = Object.values(results).filter(result => result !== null).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Overall Result: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Enhanced functionality is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Please check the implementation.');
  }
  
  return results;
}

// Run tests
runAllTests().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
}); 