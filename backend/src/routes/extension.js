import express from 'express';
import { registerUser, loginUser, getUserById } from '../services/authService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Health check for extension
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Extension API is running',
    timestamp: new Date().toISOString()
  });
});

// Register user (for extension)
router.post('/register', async (req, res) => {
  try {
    const result = await registerUser(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('Extension registration error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Login user (for extension)
router.post('/login', async (req, res) => {
  try {
    const result = await loginUser(req.body);
    res.json(result);
  } catch (error) {
    console.error('Extension login error:', error);
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
});

// Get user profile (protected route)
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Profile request for user ID:', req.user.userId);
    
    const user = await getUserById(req.user.userId);
    console.log('🔍 User data retrieved:', {
      id: user._id,
      email: user.email,
      hasClioTokens: !!user.clioTokens,
      clioTokens: user.clioTokens,
      hasGmailTokens: !!user.gmailTokens
    });
    
    const hasClioAccess = !!user.clioTokens?.access_token;
    console.log('🔍 hasClioAccess calculated:', hasClioAccess);
    
    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        profession: user.profession,
        gender: user.gender,
        avatar: user.avatar,
        aiPreferences: user.aiPreferences,
        billableLogging: user.billableLogging,
        isConnectedToClio: user.isConnectedToClio,
        workHistory: user.workHistory,
        hasCompletedOnboarding: user.hasCompletedOnboarding,
        hasClioAccess: hasClioAccess,
        hasGmailAccess: !!user.gmailTokens?.access_token
      }
    });
  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

// Verify token
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    userId: req.user.userId
  });
});

export default router; 