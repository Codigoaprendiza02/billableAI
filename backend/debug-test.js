import axios from 'axios';

const BASE_URL = 'http://localhost:3001';

async function debugEmailTracking() {
  console.log('🔍 Debugging Email Tracking...');
  try {
    const response = await axios.post(`${BASE_URL}/api/email-tracking/start`, {
      to: 'client@example.com',
      subject: 'Test Email Subject',
      content: 'This is a test email content for billing tracking.'
    }, {
      headers: {
        'Authorization': 'Bearer test_token_123',
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Success:', response.data);
  } catch (error) {
    console.error('❌ Error Details:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Data:', error.response?.data);
    console.error('Headers:', error.response?.headers);
    console.error('Message:', error.message);
  }
}

debugEmailTracking(); 