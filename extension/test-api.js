// Test if the frontend can connect to the backend
const API_BASE_URL = 'http://localhost:3001/api';

async function testFrontendBackendConnection() {
  try {
    console.log('🧪 Testing frontend-backend connection...');
    
    // Test health endpoint
    const healthResponse = await fetch('http://localhost:3001/health');
    console.log('✅ Health check:', await healthResponse.json());
    
    // Test registration endpoint with existing email
    const testData = {
      email: 'newuser@example.com',
      name: 'Test User',
      profession: 'Lawyer',
      gender: 'Male',
      username: 'testuser',
      password: 'TestPassword123!@#'
    };
    
    console.log('📝 Testing registration with existing email...');
    const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    console.log('📊 Response status:', registerResponse.status);
    const responseData = await registerResponse.json();
    console.log('📊 Response data:', responseData);
    
    if (!registerResponse.ok) {
      console.log('✅ Expected error received:', responseData.error);
    } else {
      console.log('❌ Unexpected success');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testFrontendBackendConnection(); 