// Create Test User for Enhanced Functionality Testing
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Import User model
const { default: User } = await import('./src/models/User.js');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/billableai');
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Create test user
const createTestUser = async () => {
  try {
    // Check if test user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { email: 'test@billableai.com' },
        { username: 'testuser' }
      ]
    });
    
    if (existingUser) {
      console.log('✅ Test user already exists:', existingUser._id);
      return existingUser._id;
    }
    
    // Create new test user
    const testUser = new User({
      username: 'testuser',
      email: 'test@billableai.com',
      name: 'Test User',
      password: 'testpassword123',
      gender: 'Male',
      profession: 'Lawyer',
      isConnectedToClio: true,
      hasCompletedOnboarding: true
    });
    
    const savedUser = await testUser.save();
    console.log('✅ Test user created successfully:', savedUser._id);
    return savedUser._id;
    
  } catch (error) {
    console.error('❌ Failed to create test user:', error);
    throw error;
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    const userId = await createTestUser();
    
    console.log('\n📋 Test User Information:');
    console.log('=' .repeat(40));
    console.log(`User ID: ${userId}`);
    console.log('Email: test@billableai.com');
    console.log('Name: Test User');
    console.log('\n✅ Test user setup complete!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
};

main(); 