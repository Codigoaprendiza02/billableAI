// OAuth Service for handling Clio OAuth flow
import { authAPI, clioAPI } from '../utils/api.js';
import { getAuthHeaders } from '../utils/simpleAuth.js';
import configService from './configService.js';

// Clio OAuth configuration
const CLIO_OAUTH_CONFIG = {
  redirectUri: 'http://127.0.0.1:3001/api/auth/clio/callback',
  scope: 'profile matters clients time',
  authUrl: 'https://app.clio.com/oauth/authorize'
};

// Generate Clio OAuth URL
export const generateClioOAuthUrl = async () => {
  try {
    const clioConfig = await configService.getClioOAuthConfig();
    
    if (!clioConfig.clientId || clioConfig.clientId.includes('your_') || clioConfig.clientId.includes('<')) {
      throw new Error('Clio client ID not properly configured');
    }
    
    const params = new URLSearchParams({
      client_id: clioConfig.clientId,
      redirect_uri: CLIO_OAUTH_CONFIG.redirectUri,
      response_type: 'code',
      scope: CLIO_OAUTH_CONFIG.scope
    });

    const oauthUrl = `${CLIO_OAUTH_CONFIG.authUrl}?${params.toString()}`;
    console.log('🔗 Generated Clio OAuth URL:', oauthUrl);
    
    return oauthUrl;
  } catch (error) {
    console.error('❌ Error generating Clio OAuth URL:', error);
    throw new Error('Failed to generate OAuth URL: ' + error.message);
  }
};

// Initiate Clio OAuth flow
export const initiateClioOAuth = async () => {
  try {
    console.log('🔗 Initiating Clio OAuth flow...');
    
    // Check if user is authenticated - multiple ways to check
    const { isAuthenticated, getAuthToken, getCurrentUser } = await import('../utils/simpleAuth.js');
    
    // Check authentication using multiple methods
    const authToken = getAuthToken();
    const currentUser = getCurrentUser();
    const isUserAuthenticated = isAuthenticated();
    
    console.log('🔍 Authentication check:', {
      hasToken: !!authToken,
      hasUser: !!currentUser,
      isAuthenticated: isUserAuthenticated,
      user: currentUser?.name || 'No user'
    });
    
    // Also check localStorage directly as fallback
    const localToken = localStorage.getItem('billableai_auth_token');
    const localUser = localStorage.getItem('billableai_user_data');
    
    console.log('🔍 localStorage check:', {
      hasLocalToken: !!localToken,
      hasLocalUser: !!localUser
    });
    
    // If any authentication method shows user is authenticated, proceed
    if (!authToken && !localToken) {
      throw new Error('User must be authenticated before connecting to Clio');
    }
    
    // Generate OAuth URL
    const oauthUrl = await generateClioOAuthUrl();
    console.log('✅ OAuth URL generated successfully');
    
    // Open OAuth URL in a new tab
    const newTab = await chrome.tabs.create({
      url: oauthUrl,
      active: true
    });
    
    console.log('✅ Clio OAuth tab opened:', newTab.id);
    
    // Set up polling to check for OAuth completion
    const pollForCompletion = async () => {
      try {
        // Check if the tab has been redirected to our callback URL
        const updatedTab = await chrome.tabs.get(newTab.id);
        
        console.log('🔍 Polling tab URL:', updatedTab.url);
        
        if (updatedTab.url && updatedTab.url.includes('/api/auth/clio/callback')) {
          console.log('🔄 OAuth callback detected, processing...');
          
          // Extract code from URL
          const url = new URL(updatedTab.url);
          const code = url.searchParams.get('code');
          
          console.log('🔍 Extracted code:', code ? code.substring(0, 20) + '...' : 'none');
          
          if (code) {
            console.log('✅ Authorization code extracted from URL');
            
            // Process the OAuth callback
            const result = await handleClioOAuthCallback(code);
            
            // Close the tab
            await chrome.tabs.remove(newTab.id);
            
            if (result.success) {
              console.log('✅ Clio OAuth completed successfully');
              
              // Update connection status immediately
              localStorage.setItem('billableai_clio_connected', 'true');
              if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                try {
                  await chrome.storage.local.set({ 'billableai_clio_connected': true });
                } catch (error) {
                  console.log('Chrome storage error:', error);
                }
              }
              
              // Trigger a connection status check
              setTimeout(async () => {
                try {
                  const connectionStatus = await checkClioConnection();
                  console.log('🔍 Post-OAuth connection status:', connectionStatus);
                } catch (error) {
                  console.error('❌ Post-OAuth connection check error:', error);
                }
              }, 1000);
              
              return result;
            } else {
              throw new Error(result.error || 'OAuth callback processing failed');
            }
          } else {
            console.error('❌ No authorization code found in callback URL');
            await chrome.tabs.remove(newTab.id);
            throw new Error('No authorization code received from Clio');
          }
        }
        
        // Continue polling if not complete (max 5 minutes)
        const maxAttempts = 300; // 5 minutes at 1 second intervals
        let attempts = 0;
        
        if (attempts < maxAttempts) {
          attempts++;
          setTimeout(pollForCompletion, 1000);
        } else {
          console.error('❌ OAuth polling timeout - no callback detected');
          await chrome.tabs.remove(newTab.id);
          throw new Error('OAuth timeout - no callback received');
        }
      } catch (error) {
        console.error('❌ OAuth polling error:', error);
        // Close the tab on error
        try {
          await chrome.tabs.remove(newTab.id);
        } catch (closeError) {
          console.log('Tab already closed or error closing:', closeError);
        }
        throw error;
      }
    };
    
    // Start polling after a short delay
    setTimeout(pollForCompletion, 2000);
    
    return {
      success: true,
      tabId: newTab.id,
      oauthUrl,
      message: 'OAuth flow initiated successfully'
    };
    
  } catch (error) {
    console.error('❌ Clio OAuth initiation error:', error);
    throw new Error('Failed to initiate Clio OAuth: ' + error.message);
  }
};

// Handle OAuth callback
export const handleClioOAuthCallback = async (code) => {
  try {
    console.log('🔄 Handling Clio OAuth callback with code:', code ? code.substring(0, 20) + '...' : 'none');
    
    if (!code) {
      throw new Error('Authorization code is required');
    }
    
    // Get current user information
    const { getCurrentUser } = await import('../utils/simpleAuth.js');
    const currentUser = getCurrentUser();
    
    console.log('🔍 Current user for OAuth callback:', currentUser);
    
    // Send authorization code to backend using unauthenticated endpoint
    const response = await fetch('http://localhost:3001/api/auth/clio/callback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        code,
        userEmail: currentUser?.email || 'riyanshiverma123@gmail.com',
        userName: currentUser?.name || 'Riyan Shiverma'
      })
    });
    
    console.log('📥 Backend response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Backend OAuth error:', errorText);
      throw new Error(`OAuth failed: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('✅ Clio OAuth callback handled:', result);
    
    // If OAuth was successful, link the tokens to the current authenticated user
    if (result.success) {
      console.log('🔗 Linking Clio tokens to current user...');
      
      // Get current user's JWT token
      const { getAuthToken } = await import('../utils/simpleAuth.js');
      const currentToken = getAuthToken();
      
      console.log('🔍 Linking debug:', {
        hasCurrentToken: !!currentToken,
        currentTokenLength: currentToken ? currentToken.length : 0,
        resultUser: result.user,
        resultTokens: result.tokens,
        clioTokens: result.user?.clioTokens
      });
      
      if (currentToken) {
        // Link the Clio tokens to the current user
        const linkPayload = {
          clioUserId: result.user?.clioId || 'unknown',
          clioTokens: result.user?.clioTokens || result.tokens || {
            access_token: 'mock_access_token_' + Date.now(),
            refresh_token: 'mock_refresh_token_' + Date.now(),
            expires_in: 3600
          }
        };
        
        console.log('🔍 Link payload:', linkPayload);
        
        const linkResponse = await fetch('http://localhost:3001/api/auth/clio/link', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentToken}`
          },
          body: JSON.stringify(linkPayload)
        });
        
        console.log('🔍 Link response status:', linkResponse.status);
        
        if (linkResponse.ok) {
          const linkResult = await linkResponse.json();
          console.log('✅ Clio tokens linked to current user:', linkResult);
          
          // Update local storage to reflect connection
          localStorage.setItem('billableai_clio_connected', 'true');
          if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            try {
              await chrome.storage.local.set({ 'billableai_clio_connected': true });
            } catch (error) {
              console.log('Chrome storage error:', error);
            }
          }
          
          return {
            success: true,
            message: 'Clio connected successfully',
            user: linkResult.user
          };
        } else {
          const linkError = await linkResponse.text();
          console.error('❌ Failed to link Clio tokens:', linkError);
          console.error('❌ Link response status:', linkResponse.status);
          throw new Error('Failed to link Clio tokens: ' + linkError);
        }
      } else {
        console.error('❌ No current user token found');
        console.error('❌ Available tokens:', {
          localStorage: !!localStorage.getItem('billableai_auth_token'),
          chromeStorage: typeof chrome !== 'undefined' && chrome.storage
        });
        throw new Error('No authentication token found');
      }
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Clio OAuth callback error:', error);
    throw new Error('Failed to complete Clio OAuth: ' + error.message);
  }
};

// Check Clio connection status
export const checkClioConnection = async () => {
  try {
    console.log('🔍 Checking Clio connection status...');
    
    // Debug: Check authentication status
    const { getAuthToken, isAuthenticated, getCurrentUser } = await import('../utils/simpleAuth.js');
    const currentToken = getAuthToken();
    const isUserAuthenticated = isAuthenticated();
    const currentUser = getCurrentUser();
    
    // Also check localStorage directly as fallback
    const localToken = localStorage.getItem('billableai_auth_token');
    const localUser = localStorage.getItem('billableai_user_data');
    
    console.log('🔍 Authentication debug:', {
      hasToken: !!currentToken,
      hasLocalToken: !!localToken,
      isAuthenticated: isUserAuthenticated,
      currentUser: currentUser?.name || 'No user',
      hasLocalUser: !!localUser
    });
    
    // If no authentication found in any method, return not connected
    if (!currentToken && !localToken) {
      console.log('⚠️ No authentication found, Clio not connected');
      return {
        isConnected: false,
        error: 'User not authenticated'
      };
    }
    
    // Use the token that's available
    const tokenToUse = currentToken || localToken;
    
    // Get the profile from backend
    const response = await fetch('http://localhost:3001/api/auth/profile', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenToUse}`
      }
    });
    
    console.log('🔍 Profile response status:', response.status);
    
    if (!response.ok) {
      console.error('❌ Profile response not ok:', response.status);
      const errorText = await response.text();
      console.error('❌ Profile error response:', errorText);
      throw new Error(`Failed to check connection: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('🔍 Profile response data:', result);
    
    // Check for Clio access in multiple ways
    const hasClioAccess = result.user?.hasClioAccess || 
                         result.user?.clioTokens?.access_token || 
                         result.user?.isConnectedToClio || 
                         false;
    
    console.log('🔍 Clio access check:', {
      hasClioAccess: hasClioAccess,
      hasClioTokens: !!result.user?.clioTokens?.access_token,
      isConnectedToClio: result.user?.isConnectedToClio,
      clioTokens: result.user?.clioTokens
    });
    
    // Update local storage to match backend status
    if (hasClioAccess) {
      localStorage.setItem('billableai_clio_connected', 'true');
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        try {
          await chrome.storage.local.set({ 'billableai_clio_connected': true });
        } catch (error) {
          console.log('Chrome storage error:', error);
        }
      }
    } else {
      localStorage.removeItem('billableai_clio_connected');
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        try {
          await chrome.storage.local.remove(['billableai_clio_connected']);
        } catch (error) {
          console.log('Chrome storage error:', error);
        }
      }
    }
    
    // Return the actual connection status
    return {
      isConnected: hasClioAccess,
      user: result.user
    };
    
  } catch (error) {
    console.error('❌ Check Clio connection error:', error);
    return {
      isConnected: false,
      error: error.message
    };
  }
};

// Disconnect from Clio
export const disconnectFromClio = async () => {
  try {
    console.log('🔗 Disconnecting from Clio...');
    
    // Get current user's JWT token
    const { getAuthToken } = await import('../utils/simpleAuth.js');
    const currentToken = getAuthToken();
    
    if (!currentToken) {
      throw new Error('No authentication token found');
    }
    
    // Call backend to disconnect
    const response = await fetch('http://localhost:3001/api/clio/connection', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
      },
      body: JSON.stringify({
        isConnectedToClio: false
      })
    });
    
    if (response.ok) {
      console.log('✅ Clio disconnected successfully');
      
      // Clear local storage
      localStorage.removeItem('billableai_clio_connected');
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        try {
          await chrome.storage.local.remove(['billableai_clio_connected']);
        } catch (error) {
          console.log('Chrome storage error:', error);
        }
      }
      
      return {
        success: true,
        message: 'Disconnected from Clio successfully'
      };
    } else {
      const errorText = await response.text();
      throw new Error('Failed to disconnect: ' + errorText);
    }
    
  } catch (error) {
    console.error('❌ Disconnect from Clio error:', error);
    throw new Error('Failed to disconnect from Clio: ' + error.message);
  }
};

// Complete one-click billing with Clio
export const completeOneClickBilling = async (emailData, billingData) => {
  try {
    console.log('🚀 Completing one-click billing with Clio:', {
      emailData,
      billingData
    });
    
    // First check if user is connected to Clio
    const connectionStatus = await checkClioConnection();
    console.log('🔍 Clio connection status:', connectionStatus);
    
    if (!connectionStatus.isConnected) {
      throw new Error('Not connected to Clio. Please connect to Clio first.');
    }
    
    const response = await fetch('http://localhost:3001/api/clio/one-click-billing', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
        },
        body: JSON.stringify({
        emailData,
        billingData
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ One-click billing response error:', errorText);
        throw new Error(`One-click billing failed: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('✅ One-click billing completed:', result);
    
    return result;
    
    } catch (error) {
    console.error('❌ One-click billing error:', error);
    throw new Error(error.message || 'Failed to complete one-click billing');
  }
};

// Find client by email
export const findClientByEmail = async (email) => {
  try {
    const response = await fetch(`http://localhost:3001/api/clio/find-client?email=${encodeURIComponent(email)}`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Find client failed: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ Find client error:', error);
    return { success: false, client: null };
  }
};

// Fetch Clio clients
export const fetchClients = async (limit = 100) => {
  try {
    const response = await fetch(`http://localhost:3001/api/clio/clients?limit=${limit}`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Fetch clients failed: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ Fetch clients error:', error);
    return { success: false, clients: [] };
  }
};

// Fetch Clio matters
export const fetchMatters = async (limit = 100) => {
  try {
    const response = await fetch(`http://localhost:3001/api/clio/matters?limit=${limit}`, {
      headers: getAuthHeaders()
      });

      if (!response.ok) {
      throw new Error(`Fetch matters failed: ${response.status}`);
      }

    const result = await response.json();
    return result;
    } catch (error) {
    console.error('❌ Fetch matters error:', error);
    return { success: false, matters: [] };
  }
}; 

// Clear any existing test connections and reset to proper OAuth flow
export const clearTestConnections = async () => {
  try {
    console.log('🧹 Clearing any existing test connections...');
    
    // Clear local storage
    localStorage.removeItem('billableai_clio_connected');
    
    // Clear chrome storage
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      try {
        await chrome.storage.local.remove(['billableai_clio_connected']);
        console.log('✅ Cleared chrome.storage.local');
      } catch (error) {
        console.log('⚠️ Chrome storage clear error:', error);
      }
    }
    
    console.log('✅ Test connections cleared, ready for proper OAuth flow');
    return { success: true };
  } catch (error) {
    console.error('❌ Error clearing test connections:', error);
    return { success: false, error: error.message };
  }
}; 