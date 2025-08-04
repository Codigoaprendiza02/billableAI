// Enhanced BillableAI Functionality Test
// Tests Gmail API integration, Gemini AI summaries, and Clio one-click billing

import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';
const TEST_USER_ID = 'test_user_123';

// Mock authentication token
const AUTH_TOKEN = 'mock_auth_token_' + Date.now();

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

const testSessionData = {
  sessionId: 'test_session_' + Date.now(),
  draftId: 'test_draft_' + Date.now(),
  timeSpent: 1800000, // 30 minutes in milliseconds
  isTyping: true
};

console.log('🧪 Starting Enhanced BillableAI Functionality Test');
console.log('=' .repeat(60));

// Test 1: Gmail API Composition Tracking
async function testGmailCompositionTracking() {
  console.log('\n📧 Test 1: Gmail API Composition Tracking');
  console.log('-'.repeat(40));
  
  try {
    // Start composition tracking
    const startResponse = await axios.post(`${BASE_URL}/email-tracking/start-composition`, {
      ...testEmailData
    }, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Start composition tracking:', startResponse.data);
    
    // Update composition
    const updateResponse = await axios.post(`${BASE_URL}/email-tracking/update-composition`, {
      draftId: startResponse.data.draftId,
      ...testEmailData,
      content: testEmailData.content + '\n\nAdditional legal analysis added.'
    }, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Update composition:', updateResponse.data);
    
    // Monitor activity
    const activityResponse = await axios.post(`${BASE_URL}/email-tracking/activity`, {
      sessionId: startResponse.data.sessionId,
      draftId: startResponse.data.draftId,
      isTyping: true,
      content: testEmailData.content,
      timeSpent: 900000 // 15 minutes
    }, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Activity monitoring:', activityResponse.data);
    
    return {
      sessionId: startResponse.data.sessionId,
      draftId: startResponse.data.draftId
    };
    
  } catch (error) {
    console.error('❌ Gmail composition tracking test failed:', error.response?.data || error.message);
    return null;
  }
}

// Test 2: Enhanced Billing Summary Generation
async function testBillingSummaryGeneration() {
  console.log('\n📝 Test 2: Enhanced Billing Summary Generation');
  console.log('-'.repeat(40));
  
  try {
    const billingEntry = await axios.post(`${BASE_URL}/email-tracking/stop-composition`, {
      sessionId: testSessionData.sessionId,
      draftId: testSessionData.draftId,
      finalContent: testEmailData.content,
      sendEmail: false
    }, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Billing summary generated:', {
      timeSpent: billingEntry.data.timeSpent,
      summary: billingEntry.data.billingEntry.summary,
      metadata: billingEntry.data.billingEntry.metadata,
      suggestions: billingEntry.data.billingEntry.suggestions
    });
    
    return billingEntry.data;
    
  } catch (error) {
    console.error('❌ Billing summary generation test failed:', error.response?.data || error.message);
    return null;
  }
}

// Test 3: One-Click Billing with Clio Integration
async function testOneClickBilling() {
  console.log('\n🚀 Test 3: One-Click Billing with Clio Integration');
  console.log('-'.repeat(40));
  
  try {
    const billingResponse = await axios.post(`${BASE_URL}/email-tracking/one-click-billing`, {
      sessionId: testSessionData.sessionId,
      draftId: testSessionData.draftId,
      emailData: testEmailData,
      sendEmail: true
    }, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ One-click billing completed:', {
      timeSpent: billingResponse.data.timeSpent,
      emailSent: billingResponse.data.emailSent,
      billingResult: billingResponse.data.billingResult,
      billingEntry: billingResponse.data.billingEntry
    });
    
    return billingResponse.data;
    
  } catch (error) {
    console.error('❌ One-click billing test failed:', error.response?.data || error.message);
    return null;
  }
}

// Test 4: Gmail API Integration
async function testGmailApiIntegration() {
  console.log('\n📧 Test 4: Gmail API Integration');
  console.log('-'.repeat(40));
  
  try {
    // Test Gmail service functions
    const { trackEmailComposition, updateEmailDraft, sendEmailDraft } = await import('./src/services/gmailService.js');
    
    console.log('✅ Gmail service functions imported successfully');
    
    // Test email content parsing
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
    
    console.log('✅ Email content parsed:', {
      isBillable: parsedContent.isBillable,
      category: parsedContent.billableCategory,
      confidence: parsedContent.confidence,
      keywords: parsedContent.billableKeywords,
      wordCount: parsedContent.wordCount
    });
    
    return parsedContent;
    
  } catch (error) {
    console.error('❌ Gmail API integration test failed:', error.message);
    return null;
  }
}

// Test 5: Gemini AI Integration
async function testGeminiIntegration() {
  console.log('\n🤖 Test 5: Gemini AI Integration');
  console.log('-'.repeat(40));
  
  try {
    const { generateSummary, suggestClientMatter, generateBillingEntry } = await import('./src/services/gptService.js');
    
    console.log('✅ Gemini service functions imported successfully');
    
    // Test summary generation
    const summary = await generateSummary(
      testEmailData.content,
      testSessionData.timeSpent,
      { emailTone: 'formal' }
    );
    
    console.log('✅ AI summary generated:', {
      summary: summary.summary,
      metadata: summary.metadata
    });
    
    // Test client/matter suggestions
    const suggestions = await suggestClientMatter(
      [testEmailData.to],
      testEmailData.content
    );
    
    console.log('✅ Client/matter suggestions:', suggestions);
    
    // Test enhanced billing entry
    const billingEntry = await generateBillingEntry(
      testEmailData,
      testSessionData.timeSpent,
      { emailTone: 'formal' }
    );
    
    console.log('✅ Enhanced billing entry:', {
      summary: billingEntry.summary,
      suggestions: billingEntry.suggestions,
      billingData: billingEntry.billingData
    });
    
    return { summary, suggestions, billingEntry };
    
  } catch (error) {
    console.error('❌ Gemini AI integration test failed:', error.message);
    return null;
  }
}

// Test 6: Clio Integration
async function testClioIntegration() {
  console.log('\n⏰ Test 6: Clio Integration');
  console.log('-'.repeat(40));
  
  try {
    const { 
      completeOneClickBilling, 
      findClientByEmail, 
      findOrCreateMatter,
      logTimeEntryOneClick 
    } = await import('./src/services/clioService.js');
    
    console.log('✅ Clio service functions imported successfully');
    
    // Test one-click billing workflow
    const billingData = {
      summary: 'Legal analysis and correspondence regarding contract review. Time spent: 0.50 hours.',
      timeSpent: testSessionData.timeSpent,
      suggestions: {
        suggestedMatter: 'Contract review and negotiation',
        matterType: 'contract',
        confidence: 0.85
      }
    };
    
    const billingResult = await completeOneClickBilling(TEST_USER_ID, testEmailData, billingData);
    
    console.log('✅ One-click billing workflow:', {
      success: billingResult.success,
      client: billingResult.client,
      matter: billingResult.matter,
      timeEntry: billingResult.timeEntry
    });
    
    return billingResult;
    
  } catch (error) {
    console.error('❌ Clio integration test failed:', error.message);
    return null;
  }
}

// Test 7: Extension Integration
async function testExtensionIntegration() {
  console.log('\n🔧 Test 7: Extension Integration');
  console.log('-'.repeat(40));
  
  try {
    // Test extension API endpoints
    const sessionsResponse = await axios.get(`${BASE_URL}/email-tracking/sessions`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });
    
    console.log('✅ Extension sessions API:', sessionsResponse.data);
    
    // Test composition data endpoint
    const compositionResponse = await axios.get(`${BASE_URL}/email-tracking/composition/test_draft_123`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });
    
    console.log('✅ Extension composition API:', compositionResponse.data);
    
    return {
      sessions: sessionsResponse.data,
      composition: compositionResponse.data
    };
    
  } catch (error) {
    console.error('❌ Extension integration test failed:', error.response?.data || error.message);
    return null;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🧪 Running Enhanced BillableAI Functionality Tests');
  console.log('=' .repeat(60));
  
  const results = {
    gmailComposition: await testGmailCompositionTracking(),
    billingSummary: await testBillingSummaryGeneration(),
    oneClickBilling: await testOneClickBilling(),
    gmailApi: await testGmailApiIntegration(),
    gemini: await testGeminiIntegration(),
    clio: await testClioIntegration(),
    extension: await testExtensionIntegration()
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

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}

export {
  runAllTests,
  testGmailCompositionTracking,
  testBillingSummaryGeneration,
  testOneClickBilling,
  testGmailApiIntegration,
  testGeminiIntegration,
  testClioIntegration,
  testExtensionIntegration
}; 