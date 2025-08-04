import dotenv from 'dotenv';
import { sendEmailAndLogTime, startEmailTracking } from './src/services/emailTrackingService.js';

// Load environment variables
dotenv.config({ path: './env.local' });

async function testBillableEmail() {
  try {
    console.log('🧪 Testing Billable Email Detection and Tracking...');
    
    const userId = 'test_user_123';
    
    // Test 1: Billable Legal Email
    console.log('\n📧 Test 1: Billable Legal Email');
    const legalEmailData = {
      to: 'client@abccorp.com',
      subject: 'Contract Review and Legal Analysis',
      content: `Dear Client,

I have completed my review of the proposed contract for your business partnership with XYZ Corp. 

Key findings from my legal analysis:
1. Liability provisions in Section 3.2 require modification
2. Intellectual property rights in Section 4.1 are acceptable
3. Termination clauses in Section 5.3 need clarification

This contract review involved detailed legal analysis and professional consultation. The time spent includes:
- Contract review and analysis: 2 hours
- Legal research on similar cases: 1 hour
- Drafting recommendations: 1 hour

Please let me know if you need any clarification on these legal matters.

Best regards,
Attorney`
    };
    
    // Start tracking
    const session = startEmailTracking(userId, legalEmailData);
    console.log('✅ Started tracking session:', session.sessionId);
    
    // Simulate some time passing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Send email with tracking
    const result = await sendEmailAndLogTime(userId, session.sessionId, legalEmailData);
    
    console.log('✅ Legal Email Results:');
    console.log('Is Billable:', result.isBillable);
    console.log('Category:', result.billableCategory);
    console.log('Confidence:', result.confidence);
    console.log('Time Spent:', result.timeSpent, 'ms');
    console.log('Summary:', result.billingSummary?.summary);
    
    // Test 2: Non-Billable Personal Email
    console.log('\n📧 Test 2: Non-Billable Personal Email');
    const personalEmailData = {
      to: 'friend@email.com',
      subject: 'Lunch Plans',
      content: `Hey there!

Want to grab lunch today? I was thinking we could try that new restaurant downtown.

Let me know if you're free!

Cheers,
Friend`
    };
    
    // Start tracking
    const session2 = startEmailTracking(userId, personalEmailData);
    console.log('✅ Started tracking session:', session2.sessionId);
    
    // Simulate some time passing
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Send email with tracking
    const result2 = await sendEmailAndLogTime(userId, session2.sessionId, personalEmailData);
    
    console.log('✅ Personal Email Results:');
    console.log('Is Billable:', result2.isBillable);
    console.log('Category:', result2.billableCategory);
    console.log('Confidence:', result2.confidence);
    console.log('Time Spent:', result2.timeSpent, 'ms');
    console.log('Summary:', result2.billingSummary?.summary);
    
    // Test 3: Business Consulting Email
    console.log('\n📧 Test 3: Business Consulting Email');
    const businessEmailData = {
      to: 'client@consulting.com',
      subject: 'Business Strategy Consultation',
      content: `Dear Client,

Thank you for the opportunity to provide business consulting services for your company's expansion plans.

Based on my analysis of your current business model and market conditions, I recommend the following strategic approach:

1. Market Analysis: Conduct comprehensive market research
2. Financial Planning: Develop detailed budget projections
3. Risk Assessment: Identify potential challenges and mitigation strategies

This consultation involved professional business analysis and strategic planning expertise.

Best regards,
Business Consultant`
    };
    
    // Start tracking
    const session3 = startEmailTracking(userId, businessEmailData);
    console.log('✅ Started tracking session:', session3.sessionId);
    
    // Simulate some time passing
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Send email with tracking
    const result3 = await sendEmailAndLogTime(userId, session3.sessionId, businessEmailData);
    
    console.log('✅ Business Email Results:');
    console.log('Is Billable:', result3.isBillable);
    console.log('Category:', result3.billableCategory);
    console.log('Confidence:', result3.confidence);
    console.log('Time Spent:', result3.timeSpent, 'ms');
    console.log('Summary:', result3.billingSummary?.summary);
    
    console.log('\n🎉 Billable Email Detection Test Complete!');
    console.log('\n📊 Summary:');
    console.log('- Legal Email: Billable =', result.isBillable, 'Category =', result.billableCategory);
    console.log('- Personal Email: Billable =', result2.isBillable, 'Category =', result2.billableCategory);
    console.log('- Business Email: Billable =', result3.isBillable, 'Category =', result3.billableCategory);
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testBillableEmail(); 