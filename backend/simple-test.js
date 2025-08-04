// Simple test to check registration endpoint
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001/api';

async function simpleTest() {
  console.log('🧪 Simple Authentication Test...\n');

  try {
    // Test registration
    console.log('1️⃣ Testing registration endpoint...');
    const registerData = {
      username: 'testuser_' + Date.now(),
      email: 'test' + Date.now() + '@example.com',
      name: 'Test User',
      password: 'TestPassword123!@#',
      profession: 'Lawyer',
      gender: 'Male'
    };

    console.log('📤 Sending registration request...');
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(registerData)
    });

    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', response.headers);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Registration failed with status:', response.status);
      console.error('❌ Error response:', errorText);
      try {
        const errorJson = JSON.parse(errorText);
        console.error('❌ Parsed error:', errorJson);
      } catch (e) {
        console.error('❌ Could not parse error as JSON');
      }
      return;
    }

    const result = await response.json();
    console.log('✅ Registration successful:', {
      success: result.success,
      hasToken: !!result.token,
      hasUser: !!result.user
    });

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

simpleTest(); 