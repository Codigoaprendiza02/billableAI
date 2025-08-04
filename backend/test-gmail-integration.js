import dotenv from 'dotenv';
import { parseEmailContent, getBillableEmails } from './src/services/gmailService.js';

// Load environment variables
dotenv.config({ path: './env.local' });

async function testGmailIntegration() {
  try {
    console.log('🧪 Testing Gmail Integration with Billable Email Detection...');
    
    // Test email content parsing
    const testEmailData = {
      headers: [
        { name: 'Subject', value: 'Contract Review for Client ABC Corp' },
        { name: 'From', value: 'client@abccorp.com' },
        { name: 'To', value: 'attorney@lawfirm.com' },
        { name: 'Date', value: 'Thu, 31 Jul 2025 10:00:00 +0000' }
      ],
      payload: {
        body: {
          data: Buffer.from(`
Dear Attorney,

I hope this email finds you well. I am writing regarding the contract review for our upcoming business partnership with XYZ Corp. 

The contract contains several clauses that require legal analysis, particularly:
1. Liability provisions in Section 3.2
2. Intellectual property rights in Section 4.1
3. Termination clauses in Section 5.3

We need your legal counsel on these matters as they are critical for our business interests. Please review the attached contract and provide your professional opinion on the legal implications.

This is urgent as we have a deadline of next Friday for finalizing the agreement.

Best regards,
John Smith
CEO, ABC Corp
          `).toString('base64')
        }
      }
    };
    
    console.log('📧 Testing email content parsing...');
    const analysis = parseEmailContent(testEmailData);
    
    console.log('✅ Email Analysis Results:');
    console.log('Subject:', analysis.subject);
    console.log('Is Billable:', analysis.isBillable);
    console.log('Category:', analysis.billableCategory);
    console.log('Confidence:', analysis.confidence);
    console.log('Billable Keywords:', analysis.billableKeywords);
    console.log('Word Count:', analysis.wordCount);
    console.log('Estimated Reading Time:', analysis.estimatedReadingTime, 'minutes');
    console.log('Billable Time:', analysis.billableTime, 'minutes');
    
    // Test with non-billable email
    const nonBillableEmailData = {
      headers: [
        { name: 'Subject', value: 'Lunch Plans' },
        { name: 'From', value: 'friend@email.com' },
        { name: 'To', value: 'me@email.com' }
      ],
      payload: {
        body: {
          data: Buffer.from(`
Hey there!

Want to grab lunch today? I was thinking we could try that new restaurant downtown.

Let me know if you're free!

Cheers,
Friend
          `).toString('base64')
        }
      }
    };
    
    console.log('\n📧 Testing non-billable email...');
    const nonBillableAnalysis = parseEmailContent(nonBillableEmailData);
    
    console.log('✅ Non-Billable Email Analysis:');
    console.log('Subject:', nonBillableAnalysis.subject);
    console.log('Is Billable:', nonBillableAnalysis.isBillable);
    console.log('Category:', nonBillableAnalysis.billableCategory);
    console.log('Confidence:', nonBillableAnalysis.confidence);
    console.log('Billable Keywords:', nonBillableAnalysis.billableKeywords);
    
    console.log('\n🎉 Gmail Integration Test Complete!');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testGmailIntegration(); 