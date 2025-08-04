// Test script to verify authentication flow
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001/api';

async function testAuthFlow() {
  console.log('🧪 Testing Authentication Flow...\n');

  try {
    // Test 1: Register a new user
    console.log('1️⃣ Testing user registration...');
    const registerData = {
      username: 'testuser_' + Date.now(),
      email: 'test' + Date.now() + '@example.com',
      name: 'Test User',
      password: 'TestPassword123!@#',
      profession: 'Lawyer',
      gender: 'Male'
    };

    const registerResponse = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(registerData)
    });

    if (!registerResponse.ok) {
      const errorData = await registerResponse.json();
      console.error('❌ Registration failed:', errorData);
      return;
    }

    const registerResult = await registerResponse.json();
    console.log('✅ Registration successful:', {
      success: registerResult.success,
      hasToken: !!registerResult.token,
      hasUser: !!registerResult.user,
      userId: registerResult.user?.id
    });

    // Test 2: Login with the registered user
    console.log('\n2️⃣ Testing user login...');
    const loginData = {
      username: registerData.username,
      password: registerData.password
    };

    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(loginData)
    });

    if (!loginResponse.ok) {
      const errorData = await loginResponse.json();
      console.error('❌ Login failed:', errorData);
      return;
    }

    const loginResult = await loginResponse.json();
    console.log('✅ Login successful:', {
      success: loginResult.success,
      hasToken: !!loginResult.token,
      hasUser: !!loginResult.user,
      userId: loginResult.user?.id
    });

    // Test 3: Verify token
    console.log('\n3️⃣ Testing token verification...');
    const verifyResponse = await fetch(`${API_BASE}/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${loginResult.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!verifyResponse.ok) {
      const errorData = await verifyResponse.json();
      console.error('❌ Token verification failed:', errorData);
      return;
    }

    const verifyResult = await verifyResponse.json();
    console.log('✅ Token verification successful:', verifyResult);

    // Test 4: Get user profile
    console.log('\n4️⃣ Testing profile retrieval...');
    const profileResponse = await fetch(`${API_BASE}/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${loginResult.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!profileResponse.ok) {
      const errorData = await profileResponse.json();
      console.error('❌ Profile retrieval failed:', errorData);
      return;
    }

    const profileResult = await profileResponse.json();
    console.log('✅ Profile retrieval successful:', {
      success: profileResult.success,
      hasUser: !!profileResult.user,
      userName: profileResult.user?.name,
      userEmail: profileResult.user?.email
    });

    console.log('\n🎉 All authentication tests passed!');
    console.log('\n📋 Summary:');
    console.log('- User registration: ✅');
    console.log('- User login: ✅');
    console.log('- Token verification: ✅');
    console.log('- Profile retrieval: ✅');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testAuthFlow(); 