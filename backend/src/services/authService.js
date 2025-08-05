import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { validatePassword } from '../utils/passwordValidator.js';
import { JWT_SECRET } from '../config.js';

// Generate JWT token
export const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

// Hash password
export const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Compare password
export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Check if database is available
const checkDatabaseConnection = () => {
  try {
    // Check if mongoose is connected
    const connection = mongoose.connection;
    return connection && connection.readyState === 1; // 1 = connected
  } catch (error) {
    console.error('Database connection check error:', error);
    return false;
  }
};

// Register user
export const registerUser = async (userData) => {
  try {
    // Check if database is available
    if (!checkDatabaseConnection()) {
      throw new Error('Database is not available. Please check if MongoDB is running.');
    }

    const { username, email, name, password, profession, gender } = userData;
    
    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }]
    });
    
    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        throw new Error('Email already registered');
      }
      if (existingUser.username === username) {
        throw new Error('Username already taken');
      }
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Create user
    const user = new User({
      username,
      email: email.toLowerCase(),
      name,
      password: hashedPassword,
      profession,
      gender
    });
    
    await user.save();
    
    // Generate token
    const token = generateToken(user._id);
    
    return {
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        profession: user.profession,
        gender: user.gender,
        avatar: user.avatar,
        hasCompletedOnboarding: user.hasCompletedOnboarding
      }
    };
  } catch (error) {
    console.error('Registration error:', error);
    
    // Provide user-friendly error messages
    if (error.message.includes('Database is not available')) {
      throw new Error('Database is not available. Please check if MongoDB is running.');
    } else if (error.message.includes('Password validation failed')) {
      throw new Error(error.message);
    } else if (error.message.includes('Email already registered')) {
      throw new Error('Email already registered');
    } else if (error.message.includes('Username already taken')) {
      throw new Error('Username already taken');
    } else if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    } else {
      throw new Error('Registration failed. Please try again.');
    }
  }
};

// Login user
export const loginUser = async (credentials) => {
  try {
    // Check if database is available
    if (!checkDatabaseConnection()) {
      throw new Error('Database is not available. Please check if MongoDB is running.');
    }

    const { username, password } = credentials;
    
    // Find user by username or email
    const user = await User.findOne({
      $or: [{ username }, { email: username.toLowerCase() }]
    }).select('+password');
    
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    // Check if user has a password (some old users might not have passwords)
    if (!user.password) {
      throw new Error('Account not properly set up. Please register again.');
    }
    
    // Check password
    const isPasswordValid = await comparePassword(password, user.password);
    
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }
    
    // Generate token
    const token = generateToken(user._id);
    
    return {
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        profession: user.profession,
        gender: user.gender,
        avatar: user.avatar,
        hasCompletedOnboarding: user.hasCompletedOnboarding
      }
    };
  } catch (error) {
    console.error('Login error:', error);
    
    // Provide user-friendly error messages
    if (error.message.includes('Database is not available')) {
      throw new Error('Database is not available. Please check if MongoDB is running.');
    } else if (error.message.includes('Invalid credentials')) {
      throw new Error('Invalid username or password');
    } else if (error.message.includes('Account not properly set up')) {
      throw new Error('Account not properly set up. Please register again.');
    } else {
      throw new Error('Login failed. Please try again.');
    }
  }
};

// Get user by ID
export const getUserById = async (userId) => {
  try {
    // Check if database is available
    if (!checkDatabaseConnection()) {
      throw new Error('Database is not available. Please check if MongoDB is running.');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  } catch (error) {
    console.error('Get user by ID error:', error);
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (userId, updateData) => {
  try {
    // Check if database is available
    if (!checkDatabaseConnection()) {
      throw new Error('Database is not available. Please check if MongoDB is running.');
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  } catch (error) {
    console.error('Update user profile error:', error);
    throw error;
  }
}; 