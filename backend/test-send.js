import fetch from 'node-fetch';

async function testEmailSend() {
  try {
    console.log('🧪 Testing email send API...');
    
    // First, start a tracking session
    const startResponse = await fetch('http://localhost:3001/api/test/email-tracking/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: 'test@example.com',
        subject: 'Test Email',
        content: 'This is a test email content.'
      })
    });
    
    const startData = await startResponse.json();
    console.log('📥 Start response:', startData);
    
    if (!startData.success) {
      console.log('❌ Failed to start tracking');
      return;
    }
    
    // Now test the send endpoint
    const sendResponse = await fetch('http://localhost:3001/api/test/email-tracking/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId: startData.sessionId,
        emailData: {
          to: 'test@example.com',
          subject: 'Test Email',
          content: 'This is a test email content.'
        }
      })
    });
    
    console.log('📥 Send response status:', sendResponse.status);
    
    const sendData = await sendResponse.text();
    console.log('📥 Send response body:', sendData);
    
    if (sendResponse.ok) {
      console.log('✅ Email send test successful!');
    } else {
      console.log('❌ Email send test failed!');
    }
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testEmailSend(); 