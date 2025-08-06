import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import crypto from 'crypto';
import User from '../models/User.js';
import { validatePassword } from '../utils/passwordValidator.js';
import { JWT_SECRET } from '../config.js';

// Token configuration
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days

// Generate access token
export const generateAccessToken = (userId, expiresIn = ACCESS_TOKEN_EXPIRY) => {
  return jwt.sign({ userId, type: 'access' }, JWT_SECRET, { expiresIn });
};

// Generate refresh token
export const generateRefreshToken = (userId) => {
  const token = crypto.randomBytes(40).toString('hex');
  return {
    token,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  };
};

// Legacy token generation for backward compatibility
export const generateToken = (userId) => {
  return generateAccessToken(userId, '7d'); // Longer expiry for legacy compatibility
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
    const connection = mongoose.connection;
    return connection && connection.readyState === 1; // 1 = connected
  } catch (error) {
    console.error('Database connection check error:', error);
    return false;
  }
};

// Register user with enhanced authentication
export const registerUser = async (userData) => {
  try {
    if (!checkDatabaseConnection()) {
      throw new Error('Database is not available. Please check if MongoDB is running.');
    }

    const { username, email, name, password, profession, gender, device } = userData;
    
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
    
    // Create user with enhanced defaults
    const user = new User({
      username,
      email: email.toLowerCase(),
      name,
      password: hashedPassword,
      profession,
      gender,
      lastActiveAt: new Date()
    });
    
    await user.save();
    
    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshTokenData = generateRefreshToken(user._id);
    
    // Store refresh token
    await user.addRefreshToken(refreshTokenData.token, refreshTokenData.expiresAt, device || 'unknown');
    
    return {
      success: true,
      token: accessToken, // Keep 'token' for backward compatibility
      accessToken: accessToken, // Add 'accessToken' for frontend
      refreshToken: refreshTokenData.token,
      expiresIn: 900, // 15 minutes in seconds
      expiresAt: new Date(Date.now() + 900 * 1000).toISOString(), // Add expiry timestamp
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        profession: user.profession,
        gender: user.gender,
        avatar: user.avatar,
        hasCompletedOnboarding: user.hasCompletedOnboarding,
        aiPreferences: user.aiPreferences,
        billableLogging: user.billableLogging,
        notificationSettings: user.notificationSettings,
        assistantContext: user.assistantContext,
        workHistory: user.workHistory,
        isConnectedToClio: user.isConnectedToClio
      }
    };
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// Login user with enhanced authentication
export const loginUser = async (credentials) => {
  try {
    if (!checkDatabaseConnection()) {
      throw new Error('Database is not available. Please check if MongoDB is running.');
    }

    const { username, password, device } = credentials;
    
    if (!username || !password) {
      throw new Error('Missing username/email or password');
    }
    
    // Find user by username or email
    const user = await User.findOne({
      $or: [{ username }, { email: username.toLowerCase() }]
    }).select('+password');
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Verify password
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }
    
    // Clean up expired tokens
    await user.cleanupExpiredTokens();
    
    // Update last active
    await user.updateLastActive();
    
    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshTokenData = generateRefreshToken(user._id);
    
    // Store refresh token
    await user.addRefreshToken(refreshTokenData.token, refreshTokenData.expiresAt, device || 'unknown');
    
    return {
      success: true,
      token: accessToken, // Keep 'token' for backward compatibility
      accessToken: accessToken, // Add 'accessToken' for frontend
      refreshToken: refreshTokenData.token,
      expiresIn: 900, // 15 minutes in seconds
      expiresAt: new Date(Date.now() + 900 * 1000).toISOString(), // Add expiry timestamp
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        profession: user.profession,
        gender: user.gender,
        avatar: user.avatar,
        hasCompletedOnboarding: user.hasCompletedOnboarding,
        aiPreferences: user.aiPreferences,
        billableLogging: user.billableLogging,
        notificationSettings: user.notificationSettings,
        assistantContext: user.assistantContext,
        workHistory: user.workHistory,
        isConnectedToClio: user.isConnectedToClio
      }
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Refresh access token
export const refreshAccessToken = async (refreshToken) => {
  try {
    if (!checkDatabaseConnection()) {
      throw new Error('Database is not available. Please check if MongoDB is running.');
    }

    if (!refreshToken) {
      throw new Error('Refresh token is required');
    }
    
    // Find user with this refresh token
    const user = await User.findOne({
      'refreshTokens.token': refreshToken,
      'refreshTokens.expiresAt': { $gt: new Date() }
    });
    
    if (!user) {
      throw new Error('Invalid or expired refresh token');
    }
    
    // Update last active
    await user.updateLastActive();
    
    // Generate new access token
    const accessToken = generateAccessToken(user._id);
    
    // Optionally rotate refresh token for better security
    const shouldRotateRefreshToken = Math.random() < 0.1; // 10% chance
    let newRefreshToken = refreshToken;
    
    if (shouldRotateRefreshToken) {
      // Remove old refresh token
      await user.removeRefreshToken(refreshToken);
      
      // Generate new refresh token
      const refreshTokenData = generateRefreshToken(user._id);
      await user.addRefreshToken(refreshTokenData.token, refreshTokenData.expiresAt);
      newRefreshToken = refreshTokenData.token;
    }
    
    return {
      success: true,
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: 900, // 15 minutes in seconds
      rotated: shouldRotateRefreshToken
    };
  } catch (error) {
    console.error('Token refresh error:', error);
    throw error;
  }
};

// Verify token (enhanced)
export const verifyToken = async (token) => {
  try {
    if (!checkDatabaseConnection()) {
      return { success: false, error: 'Database not available' };
    }

    // Handle mock tokens for testing
    if (token.startsWith('mock_jwt_token_')) {
      return {
        success: true,
        user: {
          userId: 'mock_user_persistent',
          email: 'test@example.com',
          name: 'Test User'
        }
      };
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    // Update last active
    await user.updateLastActive();
    
    return {
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        profession: user.profession,
        lastActiveAt: user.lastActiveAt
      }
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return { success: false, error: error.message };
  }
};

// Logout user (invalidate refresh token)
export const logoutUser = async (refreshToken, userId) => {
  try {
    if (!checkDatabaseConnection()) {
      return { success: false, error: 'Database not available' };
    }

    if (refreshToken && userId) {
      const user = await User.findById(userId);
      if (user) {
        await user.removeRefreshToken(refreshToken);
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }
};

// Logout from all devices
export const logoutAllDevices = async (userId) => {
  try {
    if (!checkDatabaseConnection()) {
      return { success: false, error: 'Database not available' };
    }

    const user = await User.findById(userId);
    if (user) {
      user.refreshTokens = [];
      await user.save();
    }
    
    return { success: true };
  } catch (error) {
    console.error('Logout all devices error:', error);
    return { success: false, error: error.message };
  }
};

// Get user by ID
export const getUserById = async (userId) => {
  try {
    if (!checkDatabaseConnection()) {
      throw new Error('Database is not available. Please check if MongoDB is running.');
    }

    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return {
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        profession: user.profession,
        gender: user.gender,
        avatar: user.avatar,
        hasCompletedOnboarding: user.hasCompletedOnboarding,
        aiPreferences: user.aiPreferences,
        billableLogging: user.billableLogging,
        notificationSettings: user.notificationSettings,
        assistantContext: user.assistantContext,
        workHistory: user.workHistory,
        isConnectedToClio: user.isConnectedToClio,
        lastActiveAt: user.lastActiveAt
      }
    };
  } catch (error) {
    console.error('Get user error:', error);
    throw error;
  }
};

// Update user profile with enhanced data
export const updateUserProfile = async (userId, updates) => {
  try {
    if (!checkDatabaseConnection()) {
      throw new Error('Database is not available. Please check if MongoDB is running.');
    }

    const allowedUpdates = [
      'name', 'profession', 'gender', 'avatar', 
      'aiPreferences', 'billableLogging', 'notificationSettings',
      'assistantContext'
    ];
    
    const filteredUpdates = {};
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });
    
    const user = await User.findByIdAndUpdate(
      userId, 
      { ...filteredUpdates, lastActiveAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return {
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        profession: user.profession,
        gender: user.gender,
        avatar: user.avatar,
        hasCompletedOnboarding: user.hasCompletedOnboarding,
        aiPreferences: user.aiPreferences,
        billableLogging: user.billableLogging,
        notificationSettings: user.notificationSettings,
        assistantContext: user.assistantContext,
        workHistory: user.workHistory
      }
    };
  } catch (error) {
    console.error('Update user profile error:', error);
    throw error;
  }
}; 