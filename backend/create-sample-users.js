import mongoose from 'mongoose';
import User from './src/models/User.js';
import { MONGODB_URI } from './src/config.js';
import { hashPassword } from './src/services/authService.js';

const sampleUsers = [
  {
    username: 'lawyer1',
    email: 'lawyer1@test.com',
    name: 'John Smith',
    profession: 'Lawyer',
    gender: 'Male',
    password: 'TestPassword123!@#'
  },
  {
    username: 'lawyer2',
    email: 'lawyer2@test.com',
    name: 'Sarah Johnson',
    profession: 'Lawyer',
    gender: 'Female',
    password: 'TestPassword123!@#'
  },
  {
    username: 'lawyer3',
    email: 'lawyer3@test.com',
    name: 'Michael Brown',
    profession: 'Lawyer',
    gender: 'Male',
    password: 'TestPassword123!@#'
  },
  {
    username: 'lawyer4',
    email: 'lawyer4@test.com',
    name: 'Emily Davis',
    profession: 'Lawyer',
    gender: 'Female',
    password: 'TestPassword123!@#'
  }
];

async function createSampleUsers() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    console.log('\n📝 Creating sample users...');
    
    for (const userData of sampleUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email: userData.email }, { username: userData.username }]
      });
      
      if (existingUser) {
        console.log(`⚠️  User ${userData.username} already exists, skipping...`);
        continue;
      }
      
      // Hash password
      const hashedPassword = await hashPassword(userData.password);
      
      // Create user
      const user = new User({
        username: userData.username,
        email: userData.email,
        name: userData.name,
        password: hashedPassword,
        profession: userData.profession,
        gender: userData.gender
      });
      
      await user.save();
      console.log(`✅ Created user: ${userData.username} (${userData.email})`);
    }
    
    console.log('\n🎯 Sample users created successfully!');
    console.log('\n📋 Test Credentials:');
    sampleUsers.forEach((user, index) => {
      console.log(`${index + 1}. Username: ${user.username} | Email: ${user.email} | Password: ${user.password}`);
    });
    
    console.log('\n💡 You can now test registration and login with these credentials');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

createSampleUsers(); 