// Test script to debug user registration issues
import mongoose from 'mongoose';
import { registerUser } from './src/services/authService.js';
import { validatePassword } from './src/utils/passwordValidator.js';

// Test database connection
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/billableai', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Test password validation
const testPasswordValidation = () => {
  console.log('\n🔍 Testing password validation...');
  
  const testPasswords = [
    'weak123',
    'StrongPassword123!',
    'VeryStrongPassword123!@#',
    'test@example.com',
    'Password123!@#$%^&*()'
  ];
  
  testPasswords.forEach(password => {
    const validation = validatePassword(password);
    console.log(`Password: "${password}"`);
    console.log(`Valid: ${validation.isValid}`);
    if (!validation.isValid) {
      console.log(`Errors: ${validation.errors.join(', ')}`);
    }
    console.log('---');
  });
};

// Test user registration
const testUserRegistration = async () => {
  console.log('\n🔍 Testing user registration...');
  
  const testUsers = [
    {
      username: 'testuser1',
      email: 'test1@example.com',
      name: 'Test User 1',
      password: 'StrongPassword123!',
      profession: 'Lawyer',
      gender: 'Male'
    },
    {
      username: 'testuser2',
      email: 'test2@example.com',
      name: 'Test User 2',
      password: 'VeryStrongPassword123!@#',
      profession: 'Attorney',
      gender: 'Female'
    }
  ];
  
  for (const userData of testUsers) {
    try {
      console.log(`\n📝 Testing registration for: ${userData.username}`);
      console.log('User data:', JSON.stringify(userData, null, 2));
      
      const result = await registerUser(userData);
      console.log('✅ Registration successful:', {
        userId: result.user.id,
        username: result.user.username,
        email: result.user.email,
        hasToken: !!result.token
      });
    } catch (error) {
      console.error('❌ Registration failed:', error.message);
      console.error('Error details:', error);
    }
  }
};

// Test duplicate user registration
const testDuplicateRegistration = async () => {
  console.log('\n🔍 Testing duplicate user registration...');
  
  const userData = {
    username: 'duplicateuser',
    email: 'duplicate@example.com',
    name: 'Duplicate User',
    password: 'StrongPassword123!',
    profession: 'Lawyer',
    gender: 'Male'
  };
  
  try {
    // First registration
    console.log('📝 First registration attempt...');
    const result1 = await registerUser(userData);
    console.log('✅ First registration successful');
    
    // Second registration (should fail)
    console.log('📝 Second registration attempt (should fail)...');
    const result2 = await registerUser(userData);
    console.log('❌ Second registration should have failed but succeeded');
  } catch (error) {
    console.log('✅ Duplicate registration correctly failed:', error.message);
  }
};

// Test validation errors
const testValidationErrors = async () => {
  console.log('\n🔍 Testing validation errors...');
  
  const invalidUsers = [
    {
      username: 'ab', // Too short
      email: 'invalid-email',
      name: 'A', // Too short
      password: 'weak',
      profession: 'Lawyer',
      gender: 'Invalid'
    },
    {
      username: 'testuser3',
      email: 'test3@example.com',
      name: 'Test User 3',
      password: 'WeakPassword', // Missing special character
      profession: 'Lawyer',
      gender: 'Male'
    }
  ];
  
  for (const userData of invalidUsers) {
    try {
      console.log(`\n📝 Testing invalid user: ${userData.username}`);
      const result = await registerUser(userData);
      console.log('❌ Registration should have failed but succeeded');
    } catch (error) {
      console.log('✅ Validation correctly failed:', error.message);
    }
  }
};

// Main test function
const runTests = async () => {
  console.log('🚀 Starting user registration tests...\n');
  
  try {
    // Connect to database
    await connectDB();
    
    // Run tests
    testPasswordValidation();
    await testUserRegistration();
    await testDuplicateRegistration();
    await testValidationErrors();
    
    console.log('\n✅ All tests completed');
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { runTests }; 