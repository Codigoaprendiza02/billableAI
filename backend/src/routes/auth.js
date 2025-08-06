import express from 'express';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import { 
  registerUser, 
  loginUser, 
  getUserById, 
  updateUserProfile,
  refreshAccessToken,
  verifyToken,
  logoutUser,
  logoutAllDevices
} from '../services/authService.js';
import { authenticateToken } from '../middleware/auth.js';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, CLIO_CLIENT_ID, CLIO_CLIENT_SECRET } from '../config.js';
import { googleOAuth } from '../controllers/authController.js';
import axios from 'axios'; // Added for refreshGmailToken
import User from '../models/User.js'; // Added for refreshGmailToken

const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: { error: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

// Validation middleware
const validateSignup = [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('name')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .trim(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
  body('profession')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Profession must be less than 50 characters'),
  body('gender')
    .optional()
    .isIn(['Male', 'Female', 'Others'])
    .withMessage('Gender must be Male, Female, or Others')
];

const validateLogin = [
  body('username')
    .notEmpty()
    .withMessage('Username or email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Register user
router.post('/register', authLimiter, validateSignup, async (req, res) => {
  try {
    // Debug: Log the received data
    console.log('🔍 Debug: Registration request received:');
    console.log('📤 Request body:', JSON.stringify(req.body, null, 2));
    console.log('📤 Request headers:', req.headers);
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const result = await registerUser(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Login user
router.post('/login', authLimiter, validateLogin, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const result = await loginUser(req.body);
    res.status(200).json(result);
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Token refresh endpoint
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      });
    }
    
    const result = await refreshAccessToken(refreshToken);
    res.status(200).json(result);
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
});

// Enhanced token verification endpoint
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const result = await verifyToken(token);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        user: result.user,
        valid: true
      });
    } else {
      res.status(401).json({
        success: false,
        error: result.error,
        valid: false
      });
    }
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      error: 'Token verification failed',
      valid: false
    });
  }
});

// Enhanced logout endpoint
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const userId = req.user.userId;
    
    const result = await logoutUser(refreshToken, userId);
    res.status(200).json(result);
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Logout from all devices
router.post('/logout-all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await logoutAllDevices(userId);
    res.status(200).json(result);
  } catch (error) {
    console.error('Logout all devices error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get current user profile with enhanced data
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await getUserById(userId);
    res.status(200).json(result);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

// Update user profile with enhanced data
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await updateUserProfile(userId, req.body);
    res.status(200).json(result);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Update assistant context
router.put('/assistant-context', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { assistantContext } = req.body;
    
    const result = await updateUserProfile(userId, { assistantContext });
    res.status(200).json({
      success: true,
      message: 'Assistant context updated successfully',
      assistantContext: result.user.assistantContext
    });
  } catch (error) {
    console.error('Update assistant context error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get assistant context
router.get('/assistant-context', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await getUserById(userId);
    
    res.status(200).json({
      success: true,
      assistantContext: result.user.assistantContext || {
        conversationHistory: [],
        preferences: {},
        lastUsedEmail: null
      }
    });
  } catch (error) {
    console.error('Get assistant context error:', error);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

// Update notification settings
router.put('/notification-settings', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { notificationSettings } = req.body;
    
    const result = await updateUserProfile(userId, { notificationSettings });
    res.status(200).json({
      success: true,
      message: 'Notification settings updated successfully',
      notificationSettings: result.user.notificationSettings
    });
  } catch (error) {
    console.error('Update notification settings error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Test OAuth configuration endpoint
router.get('/test-oauth', (req, res) => {
  try {
    const hasClientId = GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_ID.includes('your_') && !GOOGLE_CLIENT_ID.includes('<');
    const hasClientSecret = GOOGLE_CLIENT_SECRET && !GOOGLE_CLIENT_SECRET.includes('your_') && !GOOGLE_CLIENT_SECRET.includes('<');
    
    const clientIdStart = hasClientId ? GOOGLE_CLIENT_ID.substring(0, 10) : '';
    const clientIdEnd = hasClientId ? GOOGLE_CLIENT_ID.substring(GOOGLE_CLIENT_ID.length - 4) : '';
    
    res.json({
      hasClientId,
      hasClientSecret,
      clientIdStart,
      clientIdEnd
    });
  } catch (error) {
    res.status(500).json({ error: 'OAuth configuration test failed' });
  }
});

// Debug OAuth URL generation endpoint
router.get('/debug-oauth', (req, res) => {
  try {
    const redirectUri = 'http://localhost:3001/api/auth/google/callback';
    const scope = 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile';
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scope)}&` +
      `access_type=offline`;
    
    res.json({
      fullAuthUrl: authUrl,
      clientId: GOOGLE_CLIENT_ID ? 'configured' : 'not configured',
      redirectUri,
      scope
    });
  } catch (error) {
    res.status(500).json({ error: 'OAuth URL generation failed' });
  }
});

// Google OAuth callback route
router.post('/google/callback', async (req, res) => {
  await googleOAuth(req, res);
});

// Google OAuth callback route (GET method for browser redirects)
router.get('/google/callback', async (req, res) => {
  await googleOAuth(req, res);
});

// Clio OAuth URL generation endpoint
router.get('/debug-clio-oauth', (req, res) => {
  try {
    const { token } = req.query;
    // Use 127.0.0.1 to match the actual callback URL being used
    const redirectUri = 'http://127.0.0.1:3001/api/auth/clio/callback';
    // Try basic scopes that Clio typically accepts
    const scopeOptions = [
      'profile',
      'matters',
      'clients',
      'time_entries',
      'profile matters',
      'profile clients',
      'profile time_entries',
      'profile matters clients time_entries'
    ];
    
    // Start with the most basic scope
    const scope = scopeOptions[0];
    
    const authUrl = `https://app.clio.com/oauth/authorize?` +
      `client_id=${encodeURIComponent(CLIO_CLIENT_ID)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scope)}`;
    
    console.log('🔍 Generated Clio OAuth URL:');
    console.log('Client ID:', CLIO_CLIENT_ID);
    console.log('Redirect URI:', redirectUri);
    console.log('Scope:', scope);
    console.log('Full URL:', authUrl);
    
    res.json({
      fullAuthUrl: authUrl,
      clientId: CLIO_CLIENT_ID ? 'configured' : 'not configured',
      redirectUri,
      scope,
      hasToken: !!token,
      scopeOptions,
      instructions: [
        '1. Open this URL in your browser',
        '2. Complete the Clio OAuth process', 
        '3. You will be redirected back to the callback page',
        '4. Make sure you have a valid JWT token first (complete Google OAuth)',
        '5. If you have a JWT token, you can manually add it on the callback page',
        '6. If this fails, try different scope combinations'
      ]
    });
  } catch (error) {
    res.status(500).json({ error: 'Clio OAuth URL generation failed' });
  }
});



// Clio OAuth route (POST - for callback processing without authentication)
router.post('/clio/callback', async (req, res) => {
  try {
    console.log('🔍 Clio OAuth callback processing (no auth required)');
    const { code, userEmail, userName } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code required' });
    }
    
    // Use the provided user information or fallback to defaults
    const actualEmail = userEmail || 'riyanshiverma123@gmail.com';
    const actualName = userName || 'Riyan Shiverma';
    
    console.log('🔍 Using user information for OAuth:', { email: actualEmail, name: actualName });
    
    // Create a mock user with the actual user's information
    const mockUser = {
      userId: 'temp_clio_' + Date.now(),
      email: actualEmail,
      name: actualName
    };
    
    // Add the mock user to the request
    req.user = mockUser;
    
    console.log('🔍 Mock user created with actual user info:', req.user);
    
    // Process the OAuth
    const { clioOAuth } = await import('../controllers/authController.js');
    await clioOAuth(req, res);
    
  } catch (error) {
    console.error('❌ Clio OAuth callback processing error:', error);
    res.status(500).json({ error: 'OAuth callback processing failed' });
  }
});

// Clio OAuth route (POST - for direct API calls with authentication)
router.post('/clio', authenticateToken, async (req, res) => {
  // This will be handled by the clioOAuth function in authController
  const { clioOAuth } = await import('../controllers/authController.js');
  await clioOAuth(req, res);
});

// Link Clio tokens to current authenticated user
router.post('/clio/link', authenticateToken, async (req, res) => {
  try {
    console.log('🔗 Linking Clio tokens to current user...');
    console.log('User ID:', req.user.userId);
    console.log('Request body:', req.body);
    
    const { clioUserId, clioTokens } = req.body;
    
    if (!clioTokens || !clioTokens.access_token) {
      return res.status(400).json({ error: 'Clio tokens required' });
    }
    
    // Handle mock users by creating a proper user record
    let user;
    if (req.user.userId.startsWith('mock_user_')) {
      console.log('⚠️ Mock user detected, creating proper user record...');
      
      // Create a new user in the database
      const { User } = await import('../models/User.js');
      
      // For persistent mock user, try to find existing user first
      if (req.user.userId === 'mock_user_persistent') {
        user = await User.findOne({ email: 'test@example.com' });
        if (user) {
          console.log('✅ Found existing persistent mock user:', { id: user._id, email: user.email });
        }
      }
      
      // If no existing user found, create a new one
      if (!user) {
        const username = req.user.userId === 'mock_user_persistent' ? 'testuser_persistent' : 'testuser_' + Date.now();
        const password = 'temp_password_' + Date.now();
        
        user = new User({
          username: username,
          email: req.user.email || 'test@example.com',
          name: req.user.name || 'Test User',
          password: password,
          gender: 'Others',
          profession: 'Lawyer',
          clioId: clioUserId || 'unknown',
          clioTokens: {
            access_token: clioTokens.access_token,
            refresh_token: clioTokens.refresh_token,
            expiry_date: clioTokens.expiry_date || new Date(Date.now() + (clioTokens.expires_in || 3600) * 1000)
          }
        });
        
        console.log('🔄 Creating new user for mock authentication...');
        await user.save();
        console.log('✅ New user created for mock authentication');
      } else {
        // Update existing user with Clio tokens
        user.clioId = clioUserId || 'unknown';
        user.clioTokens = {
          access_token: clioTokens.access_token,
          refresh_token: clioTokens.refresh_token,
          expiry_date: clioTokens.expiry_date || new Date(Date.now() + (clioTokens.expires_in || 3600) * 1000)
        };
        
        console.log('🔄 Updating existing user with Clio tokens...');
        await user.save();
        console.log('✅ Existing user updated with Clio tokens');
      }
    } else {
      // Get current user from database
      user = await getUserById(req.user.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      console.log('✅ Found existing user:', { id: user._id, email: user.email });
      
      // Update user with Clio tokens
      user.clioId = clioUserId || 'unknown';
      user.clioTokens = {
        access_token: clioTokens.access_token,
        refresh_token: clioTokens.refresh_token,
        expiry_date: clioTokens.expiry_date || new Date(Date.now() + (clioTokens.expires_in || 3600) * 1000)
      };
      
      console.log('🔄 Saving user with Clio tokens...');
      await user.save();
      console.log('✅ User updated with Clio tokens successfully');
    }
    
    res.json({
      success: true,
      message: 'Clio tokens linked successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        hasGmailAccess: !!user.gmailTokens?.access_token,
        hasClioAccess: !!user.clioTokens?.access_token
      }
    });
    
  } catch (error) {
    console.error('❌ Link Clio tokens error:', error);
    res.status(500).json({ error: 'Failed to link Clio tokens' });
  }
});

// Clio OAuth callback route (GET - for browser redirects from Clio)
router.get('/clio/callback', async (req, res) => {
  try {
    console.log('🔍 Clio OAuth callback received:');
    console.log('Query params:', req.query);
    console.log('Headers:', req.headers);
    
    // For browser redirects, we need to handle the code parameter
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code required' });
    }
    
    // Since this is a browser redirect, we'll return an HTML page
    // that can handle the OAuth flow with JavaScript
    const html = `
      <html>
        <head>
          <title>Clio OAuth Callback</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; }
            .container { max-width: 600px; margin: 0 auto; }
            .button { background: #fbbf24; color: #1f2937; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px; margin: 10px; text-decoration: none; display: inline-block; }
            .code { background: rgba(255,255,255,0.2); padding: 8px 12px; border-radius: 6px; font-family: monospace; word-break: break-all; margin: 10px 0; }
            .warning { background: rgba(251, 191, 36, 0.2); padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #fbbf24; }
            .success { background: rgba(34, 197, 94, 0.2); padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #22c55e; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🔄 Clio OAuth Callback</h1>
            <p>Authorization code received:</p>
            <div class="code" id="auth-code">${code}</div>
            
            <div id="status-container">
              <div class="success" id="success-message">
                <strong>✅ Success:</strong> Clio OAuth code received. Processing...
              </div>
              
              <p>Processing OAuth callback...</p>
              <div id="status">⏳ Processing...</div>
            </div>
            
            <br>
            <div id="result-container"></div>
          </div>
          
          <script>
            const code = '${code}';
            const statusElement = document.getElementById('status');
            const resultContainer = document.getElementById('result-container');
            
            console.log('🔍 Processing Clio OAuth callback with code:', code);
            
            // Process the OAuth callback directly
            async function processOAuthCallback() {
              try {
                statusElement.innerHTML = '🔄 Processing OAuth callback...';
                
                // Send the authorization code to the backend
                const response = await fetch('/api/auth/clio/callback', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ code })
                });
                
                if (!response.ok) {
                  throw new Error('OAuth failed: ' + response.status);
                }
                
                const result = await response.json();
                console.log('✅ Clio OAuth completed:', result);
                
                statusElement.innerHTML = '✅ Clio OAuth completed successfully!';
                
                // Show success message
                resultContainer.innerHTML = '<div class="success"><h3>🎉 Clio Connected Successfully!</h3><p>Your Clio account has been connected to BillableAI.</p><p>You can now close this tab and return to the extension.</p></div>';
                
                // Close the tab after 3 seconds
                setTimeout(() => {
                  window.close();
                }, 3000);
                
              } catch (error) {
                console.error('❌ OAuth callback error:', error);
                statusElement.innerHTML = '❌ OAuth failed: ' + error.message;
                
                resultContainer.innerHTML = '<div class="warning"><h3>❌ OAuth Failed</h3><p>Error: ' + error.message + '</p><p>Please try again or contact support.</p></div>';
              }
            }
            
            // Start processing
            processOAuthCallback();
          </script>
        </body>
      </html>
    `;
    
    res.send(html);
    
  } catch (error) {
    console.error('❌ Clio OAuth callback error:', error);
    res.status(500).json({ error: 'OAuth callback failed' });
  }
});

// Get Gmail access token
router.get('/gmail/token', authenticateToken, async (req, res) => {
  try {
    console.log('🔐 Auth: Getting Gmail access token for user:', req.user.id);
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.gmailTokens || !user.gmailTokens.access_token) {
      return res.status(401).json({ error: 'No Gmail access token available' });
    }

    // Check if token is expired
    const tokenExpiry = user.gmailTokens.expiry_date;
    if (tokenExpiry && new Date() > new Date(tokenExpiry)) {
      console.log('🔐 Auth: Gmail token expired, attempting refresh...');
      
      try {
        const newTokens = await refreshGmailToken(user.gmailTokens.refresh_token);
        user.gmailTokens = newTokens;
        await user.save();
        console.log('🔐 Auth: Gmail token refreshed successfully');
      } catch (refreshError) {
        console.error('❌ Auth: Failed to refresh Gmail token:', refreshError);
        return res.status(401).json({ error: 'Gmail token expired and refresh failed' });
      }
    }

    res.json({
      accessToken: user.gmailTokens.access_token,
      expiresAt: user.gmailTokens.expiry_date
    });
  } catch (error) {
    console.error('❌ Auth: Error getting Gmail token:', error);
    res.status(500).json({ error: 'Failed to get Gmail access token' });
  }
});

// Refresh Gmail token
async function refreshGmailToken(refreshToken) {
  try {
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    });

    const tokens = response.data;
    return {
      access_token: tokens.access_token,
      refresh_token: refreshToken, // Keep the same refresh token
      expiry_date: new Date(Date.now() + tokens.expires_in * 1000)
    };
  } catch (error) {
    console.error('❌ Auth: Error refreshing Gmail token:', error);
    throw error;
  }
}

export default router; 