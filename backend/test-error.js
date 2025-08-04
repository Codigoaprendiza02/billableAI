import fetch from 'node-fetch';

async function testErrorResponse() {
  try {
    console.log('🧪 Testing error response...');
    
    // Test with missing required fields
    const response = await fetch('http://localhost:3001/api/test/email-tracking/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        // Missing 'to' and 'subject' fields
        content: 'This is a test email content.'
      })
    });
    
    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', response.headers);
    
    const data = await response.text();
    console.log('📥 Response body:', data);
    
    if (response.ok) {
      console.log('✅ API test successful!');
    } else {
      console.log('❌ API test failed as expected!');
    }
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testErrorResponse(); 