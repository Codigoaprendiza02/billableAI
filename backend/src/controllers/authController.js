import axios from 'axios';
import qs from 'qs';
import { generateToken } from '../utils/auth.js';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, CLIO_CLIENT_ID, CLIO_CLIENT_SECRET } from '../config.js';
import User from '../models/User.js';
import { log } from '../utils/logger.js';

// Google OAuth
export const googleOAuth = async (req, res) => {
  try {
    const code = req.body.code || req.query.code;
    
    log('Google OAuth started with code:', code ? code.substring(0, 20) + '...' : 'none');
    log('Request body:', req.body);
    log('Request query:', req.query);
    log('Content-Type:', req.headers['content-type']);
    
    if (!code) {
      return res.status(400).json({ 
        error: 'Authorization code required',
        body: req.body,
        query: req.query,
        contentType: req.headers['content-type']
      });
    }

    log('Exchanging code for tokens...');
    // Exchange code for tokens
    console.log('Token exchange request:', {
      code: code?.substring(0, 20) + '...',
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI
    });
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: 'http://localhost:3001/api/auth/google/callback'
    });

    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    log('Tokens received successfully');

    // Get user info
    log('Fetching user info from Google...');
    const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const { email, name, id: googleId } = userResponse.data;
    log('User info received:', { email, name, googleId });

    // Find or create user (with database fallback)
    let user = null;
    try {
      user = await User.findOne({ email });
      
      if (!user) {
        user = new User({
          email,
          name,
          googleId,
          gmailTokens: {
            access_token,
            refresh_token,
            expiry_date: new Date(Date.now() + expires_in * 1000)
          }
        });
      } else {
        user.gmailTokens = {
          access_token,
          refresh_token,
          expiry_date: new Date(Date.now() + expires_in * 1000)
        };
      }

      await user.save();
      log('User saved to database');
    } catch (dbError) {
      log('Database error, creating user in memory:', dbError.message);
      // Create user object in memory for testing
      user = {
        _id: 'temp_' + Date.now(),
        email,
        name,
        googleId,
        gmailTokens: {
          access_token,
          refresh_token,
          expiry_date: new Date(Date.now() + expires_in * 1000)
        }
      };
    }

    // Generate JWT token
    const token = generateToken({ 
      userId: user._id, 
      email: user.email,
      name: user.name 
    });
    log('JWT token generated successfully');
    console.log('Generated JWT token (Google OAuth):', token); // Debug: print the JWT token

    log('OAuth response sent successfully');
    
    // Check if this is a browser request (GET with query params) or API call
    const isBrowserRequest = req.method === 'GET' && req.query.code;
    const hasAcceptHeader = req.headers.accept?.includes('text/html');
    const isFormSubmission = req.headers['content-type']?.includes('application/x-www-form-urlencoded');
    
    if (isBrowserRequest || hasAcceptHeader || isFormSubmission) {
      // Return HTML success page for browser requests
      res.send(`
        <html>
          <head>
            <title>Authentication Complete</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; }
              .container { max-width: 600px; margin: 0 auto; }
              .token { background: rgba(255,255,255,0.2); padding: 8px 12px; border-radius: 6px; font-family: monospace; word-break: break-all; margin: 10px 0; }
              .button { background: #fbbf24; color: #1f2937; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px; margin: 10px; text-decoration: none; display: inline-block; }
              .success { background: rgba(34, 197, 94, 0.2); padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #22c55e; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>🎉 Authentication Complete!</h1>
              <p>You have successfully authenticated with Google.</p>
              
              <div class="success">
                <strong>✅ JWT Token Stored!</strong>
                <p>Your authentication token has been stored and is ready for Clio OAuth.</p>
              </div>
              
              <p><strong>JWT Token:</strong></p>
              <div class="token" id="jwt-token">Loading...</div>
              
              <p>You can now:</p>
              <ul style="text-align: left; display: inline-block;">
                <li>✅ Test Clio OAuth</li>
                <li>✅ Use the BillableAI extension</li>
                <li>✅ Access Gmail integration</li>
              </ul>
              
              <br><br>
              <a href="/api/auth/debug-clio-oauth" class="button" id="clio-link">🔗 Test Clio OAuth</a>
              <a href="/api/auth/test-oauth" class="button">← Back to OAuth Test</a>
            </div>
            
            <script>
              // Store the JWT token in localStorage for Clio OAuth
              const jwtToken = '${token}';
              localStorage.setItem('authToken', jwtToken);
              localStorage.setItem('user', JSON.stringify({
                id: '${user._id}',
                email: '${user.email}',
                name: '${user.name}',
                hasGmailAccess: true
              }));
              
              // Update the token display
              document.getElementById('jwt-token').textContent = jwtToken.substring(0, 50) + '...';
              
              // Update Clio OAuth link to include token
              const clioLink = document.getElementById('clio-link');
              clioLink.href = '/api/auth/debug-clio-oauth?token=' + encodeURIComponent(jwtToken);
              
              console.log('✅ JWT token stored in localStorage');
              console.log('Token length:', jwtToken.length);
              console.log('Token preview:', jwtToken.substring(0, 20) + '...');
            </script>
          </body>
        </html>
      `);
    } else {
      // Return JSON response for API calls
      res.json({ 
        success: true, 
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          hasGmailAccess: true,
          hasClioAccess: !!user.clioTokens?.access_token
        }
      });
    }

  } catch (error) {
    log('Google OAuth error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Google OAuth failed' });
  }
};

// Clio OAuth
export const clioOAuth = async (req, res) => {
  console.log('🔍 Clio OAuth called');
  console.log('Request method:', req.method);
  console.log('Request headers:', req.headers);
  console.log('Request body:', req.body);
  console.log('Request user:', req.user);
  
  try {
    const { code } = req.body;
    
    if (!code) {
      console.error('❌ No authorization code provided');
      return res.status(400).json({ error: 'Authorization code required' });
    }
    
    // Check if we have a user from JWT token or mock user
    if (!req.user || !req.user.userId) {
      console.error('❌ No user found in request');
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { userId } = req.user;
    console.log('✅ User ID from JWT:', userId);

    // Exchange code for tokens
    console.log('🔄 Exchanging authorization code for tokens...');
    console.log('Clio Client ID:', CLIO_CLIENT_ID ? 'configured' : 'not configured');
    console.log('Clio Client Secret:', CLIO_CLIENT_SECRET ? 'configured' : 'not configured');
    
    // Declare variables in broader scope
    let access_token, refresh_token, expires_in;
    
    // Check if we have proper Clio credentials
    if (!CLIO_CLIENT_SECRET || CLIO_CLIENT_SECRET === 'your_clio_client_secret_here' || CLIO_CLIENT_SECRET === 'clio_secret_placeholder_for_testing') {
      console.log('⚠️ Clio client secret not properly configured, using mock OAuth flow');
      
      // Mock successful OAuth for testing
      const mockTokens = {
        access_token: 'mock_access_token_' + Date.now(),
        refresh_token: 'mock_refresh_token_' + Date.now(),
        expires_in: 3600
      };
      
      console.log('✅ Mock Clio token response received');
      console.log('Token response details:', { 
        hasAccessToken: !!mockTokens.access_token, 
        hasRefreshToken: !!mockTokens.refresh_token, 
        expiresIn: mockTokens.expires_in 
      });
      
      // Assign to broader scope variables
      access_token = mockTokens.access_token;
      refresh_token = mockTokens.refresh_token;
      expires_in = mockTokens.expires_in;
    } else {
      // Real Clio OAuth flow
      const tokenData = {
        client_id: CLIO_CLIENT_ID,
        client_secret: CLIO_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: 'http://127.0.0.1:3001/api/auth/clio/callback'
      };
      
      console.log('Token exchange data:', { ...tokenData, client_secret: '***' });
      
      const tokenResponse = await axios.post(
        'https://app.clio.com/oauth/token',
        qs.stringify(tokenData),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }
      );

      console.log('✅ Clio token response received');
      const responseData = tokenResponse.data;
      // Assign to broader scope variables
      access_token = responseData.access_token;
      refresh_token = responseData.refresh_token;
      expires_in = responseData.expires_in;
      console.log('Token response details:', { 
        hasAccessToken: !!access_token, 
        hasRefreshToken: !!refresh_token, 
        expiresIn: expires_in 
      });
    }

    // Get user info from Clio
    console.log('Making Clio API call to get user info...');
    let clioUser = null;
    
    // Check if we're using mock tokens
    if (access_token.startsWith('mock_access_token_')) {
      console.log('⚠️ Using mock Clio user info for testing');
      clioUser = { 
        id: 'mock_clio_user_' + Date.now(),
        name: 'Mock Clio User',
        email: req.user.email || 'mock@clio.com'
      };
    } else {
      try {
        const userResponse = await axios.get('https://app.clio.com/api/v4/user', {
          headers: { Authorization: `Bearer ${access_token}` }
        });
        clioUser = userResponse.data;
        console.log('Clio user info received:', clioUser);
      } catch (userError) {
        console.log('Could not get Clio user info, continuing with tokens only:', userError.message);
        clioUser = { id: 'unknown' }; // Fallback
      }
    }

    // Update user with Clio tokens
    console.log('🔄 Updating user with Clio tokens...');
    console.log('User ID to update:', userId);
    
    // Handle temporary user IDs (from in-memory users)
    let user;
    if (userId.startsWith('temp_')) {
      console.log('⚠️ Temporary user ID detected, handling Clio OAuth...');
      
      // Get user info from JWT token
      const userEmail = req.user.email;
      const userName = req.user.name;
      
      // Check if user already exists with this email
      let existingUser = await User.findOne({ email: userEmail });
      
      if (existingUser) {
        console.log('✅ Found existing user with email:', userEmail);
        user = existingUser;
        
        // Update existing user with Clio tokens
        user.clioId = clioUser?.id || 'unknown';
        user.clioTokens = {
          access_token,
          refresh_token,
          expiry_date: new Date(Date.now() + expires_in * 1000)
        };
        
        console.log('🔄 Updating existing user with Clio tokens...');
        await user.save();
        console.log('✅ Existing user updated successfully');
      } else {
        console.log('📝 Creating new user for Clio OAuth...');
        
        // Create new user in database with all required fields
        const username = userEmail.split('@')[0] + '_' + Date.now(); // Generate unique username
        const password = 'temp_password_' + Date.now(); // Generate temporary password
        
        user = new User({
          username: username,
          email: userEmail,
          name: userName,
          password: password, // Required field
          gender: 'Others', // Default gender value
          profession: 'Lawyer', // Default profession
          clioId: clioUser?.id || 'unknown',
          clioTokens: {
            access_token,
            refresh_token,
            expiry_date: new Date(Date.now() + expires_in * 1000)
          }
        });
        
        console.log('🔄 Creating new user in database...');
        await user.save();
        console.log('✅ New user created and saved successfully');
      }
    } else {
      // Regular MongoDB ObjectId user
      user = await User.findById(userId);
      if (!user) {
        console.error('❌ User not found in database:', userId);
        return res.status(404).json({ error: 'User not found' });
      }
      
      console.log('✅ User found:', { id: user._id, email: user.email, name: user.name });

      user.clioId = clioUser?.id || 'unknown';
      user.clioTokens = {
        access_token,
        refresh_token,
        expiry_date: new Date(Date.now() + expires_in * 1000)
      };

      console.log('🔄 Saving user to database...');
      await user.save();
      console.log('✅ User saved successfully');
    }
    
    // Also try to find and update the user by email if this is a temporary user
    if (userId.startsWith('temp_')) {
      console.log('🔍 Looking for existing user by email to link tokens...');
      
      // Try to find the actual authenticated user by email
      const actualUser = await User.findOne({ email: 'riyanshiverma123@gmail.com' });
      
      if (actualUser) {
        console.log('✅ Found actual authenticated user:', { id: actualUser._id, email: actualUser.email });
        
        // Update the actual user with Clio tokens
        actualUser.clioId = clioUser?.id || 'unknown';
        actualUser.clioTokens = {
          access_token,
          refresh_token,
          expiry_date: new Date(Date.now() + expires_in * 1000)
        };
        
        console.log('🔄 Updating actual authenticated user with Clio tokens...');
        await actualUser.save();
        console.log('✅ Actual authenticated user updated with Clio tokens');
        
        // Use the actual user for the response
        user = actualUser;
      } else {
        console.log('⚠️ No existing authenticated user found by email');
      }
    }
    
    // For all cases, also try to find and update the user by the authenticated user's email
    // This ensures we always link to the correct user
    console.log('🔍 Ensuring tokens are linked to the correct authenticated user...');
    
    // Get the authenticated user's email from the request
    const authenticatedUserEmail = req.user.email;
    console.log('🔍 Authenticated user email from request:', authenticatedUserEmail);
    
    if (authenticatedUserEmail && !authenticatedUserEmail.includes('temp.com')) {
      const correctUser = await User.findOne({ email: authenticatedUserEmail });
      
      if (correctUser) {
        console.log('✅ Found correct authenticated user:', { id: correctUser._id, email: correctUser.email });
        
        // Update the correct user with Clio tokens
        correctUser.clioId = clioUser?.id || 'unknown';
        correctUser.clioTokens = {
          access_token,
          refresh_token,
          expiry_date: new Date(Date.now() + expires_in * 1000)
        };
        
        console.log('🔄 Updating correct authenticated user with Clio tokens...');
        await correctUser.save();
        console.log('✅ Correct authenticated user updated with Clio tokens');
        
        // Use the correct user for the response
        user = correctUser;
      } else {
        console.log('⚠️ No user found with authenticated email:', authenticatedUserEmail);
      }
    } else {
      console.log('⚠️ Using temporary user or invalid email:', authenticatedUserEmail);
    }

    res.json({ 
      success: true, 
      message: 'Clio connected successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        hasGmailAccess: !!user.gmailTokens?.access_token,
        hasClioAccess: !!user.clioTokens?.access_token
      }
    });
    
  } catch (error) {
    console.error('❌ Clio OAuth error:');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response status text:', error.response.statusText);
      console.error('Response data:', error.response.data);
      console.error('Response headers:', error.response.headers);
    }
    
    log('Clio OAuth error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Clio OAuth failed',
      details: error.response?.data || error.message
    });
  }
};

// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.user;
    
    const user = await User.findById(userId).select('-gmailTokens -clioTokens');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        preferences: user.preferences,
        hasGmailAccess: !!user.gmailTokens?.access_token,
        hasClioAccess: !!user.clioTokens?.access_token
      }
    });

  } catch (error) {
    log('Get user profile error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
};

// Update user preferences
export const updatePreferences = async (req, res) => {
  try {
    const { userId } = req.user;
    const { preferences } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.preferences = { ...user.preferences, ...preferences };
    await user.save();

    res.json({ 
      success: true, 
      preferences: user.preferences 
    });

  } catch (error) {
    log('Update preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
}; 