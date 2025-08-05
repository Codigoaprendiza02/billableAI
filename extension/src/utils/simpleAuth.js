// Simple Authentication Utility for BillableAI Extension
// Uses chrome.storage.local for cross-context persistence with localStorage fallback
// Based on Chrome Storage API documentation: https://developer.chrome.com/docs/extensions/reference/api/storage

const AUTH_TOKEN_KEY = 'billableai_auth_token';
const REFRESH_TOKEN_KEY = 'billableai_refresh_token';
const USER_DATA_KEY = 'billableai_user_data';
const TOKEN_EXPIRY_KEY = 'billableai_token_expiry';

// Simple authentication class with token refresh support
class SimpleAuth {
  constructor() {
    this.isAuthenticated = false;
    this.user = null;
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    this.refreshTimer = null;
  }

  // Initialize authentication on startup
  async init() {
    try {
      console.log('🎯 SimpleAuth: Initializing authentication...');
      
      // Try chrome.storage.local first (for cross-context persistence)
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        try {
          console.log('🎯 SimpleAuth: Attempting to read from chrome.storage.local...');
          
          const result = await chrome.storage.local.get([
            AUTH_TOKEN_KEY, 
            REFRESH_TOKEN_KEY, 
            USER_DATA_KEY, 
            TOKEN_EXPIRY_KEY
          ]);
          
          const accessToken = result[AUTH_TOKEN_KEY];
          const refreshToken = result[REFRESH_TOKEN_KEY];
          const userData = result[USER_DATA_KEY];
          const tokenExpiry = result[TOKEN_EXPIRY_KEY];
          
          console.log('🎯 SimpleAuth: Chrome storage - Access token found:', !!accessToken);
          console.log('🎯 SimpleAuth: Chrome storage - Refresh token found:', !!refreshToken);
          console.log('🎯 SimpleAuth: Chrome storage - User data found:', !!userData);
          console.log('🎯 SimpleAuth: Chrome storage - Token expiry:', tokenExpiry);
          
          if (accessToken && userData) {
            this.accessToken = accessToken;
            this.refreshToken = refreshToken;
            this.user = typeof userData === 'string' ? JSON.parse(userData) : userData;
            this.tokenExpiry = tokenExpiry ? new Date(tokenExpiry) : null;
            this.isAuthenticated = true;
            
            console.log('🎯 SimpleAuth: Authentication restored from chrome.storage.local');
            console.log('🎯 SimpleAuth: User:', this.user.name);
            
            // Sync to localStorage for immediate access
            this.syncToLocalStorage();
            
            // Check if token needs refresh
            await this.checkAndRefreshToken();
            
            // Start automatic refresh timer
            this.startRefreshTimer();
            
            return true;
          }
        } catch (chromeError) {
          console.error('🎯 SimpleAuth: Chrome storage error:', chromeError);
          console.log('🎯 SimpleAuth: Chrome storage not available, trying localStorage');
        }
      } else {
        console.log('🎯 SimpleAuth: Chrome storage API not available');
      }
      
      // Fallback to localStorage
      const accessToken = localStorage.getItem(AUTH_TOKEN_KEY);
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      const userData = localStorage.getItem(USER_DATA_KEY);
      const tokenExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
      
      console.log('🎯 SimpleAuth: localStorage - Access token found:', !!accessToken);
      console.log('🎯 SimpleAuth: localStorage - Refresh token found:', !!refreshToken);
      console.log('🎯 SimpleAuth: localStorage - User data found:', !!userData);
      
      if (accessToken && userData) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.user = JSON.parse(userData);
        this.tokenExpiry = tokenExpiry ? new Date(tokenExpiry) : null;
        this.isAuthenticated = true;
        
        console.log('🎯 SimpleAuth: Authentication restored from localStorage');
        console.log('🎯 SimpleAuth: User:', this.user.name);
        
        // Sync to chrome.storage.local if available
        await this.syncToChromeStorage();
        
        // Check if token needs refresh
        await this.checkAndRefreshToken();
        
        // Start automatic refresh timer
        this.startRefreshTimer();
        
        return true;
      } else {
        this.clear();
        console.log('🎯 SimpleAuth: No stored authentication found');
        return false;
      }
    } catch (error) {
      console.error('🎯 SimpleAuth: Error initializing auth:', error);
      this.clear();
      return false;
    }
  }

  // Login user with token refresh support
  async login(tokenData, user) {
    try {
      console.log('🎯 SimpleAuth: Logging in user:', user.name);
      
      // Handle both legacy and new token formats
      const accessToken = tokenData.accessToken || tokenData.token || tokenData;
      const refreshToken = tokenData.refreshToken || null;
      const expiresIn = tokenData.expiresIn || 900; // Default 15 minutes
      
      // Calculate token expiry
      const tokenExpiry = new Date(Date.now() + expiresIn * 1000);
      
      // Store in localStorage (immediate access)
      localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
      if (refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
      localStorage.setItem(TOKEN_EXPIRY_KEY, tokenExpiry.toISOString());
      console.log('🎯 SimpleAuth: Data stored in localStorage');
      
      // Store in chrome.storage.local (cross-context persistence)
      await this.syncToChromeStorage();
      
      // Update state
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      this.user = user;
      this.tokenExpiry = tokenExpiry;
      this.isAuthenticated = true;
      
      // Start automatic refresh timer
      this.startRefreshTimer();
      
      console.log('🎯 SimpleAuth: Login successful, data stored');
      console.log('🎯 SimpleAuth: Token expires at:', tokenExpiry);
      return true;
    } catch (error) {
      console.error('🎯 SimpleAuth: Login error:', error);
      return false;
    }
  }

  // Check if token needs refresh and refresh if necessary
  async checkAndRefreshToken() {
    if (!this.refreshToken || !this.tokenExpiry) {
      console.log('🎯 SimpleAuth: No refresh token or expiry available');
      return false;
    }

    const now = new Date();
    const timeUntilExpiry = this.tokenExpiry.getTime() - now.getTime();
    const refreshThreshold = 5 * 60 * 1000; // 5 minutes

    if (timeUntilExpiry <= refreshThreshold) {
      console.log('🎯 SimpleAuth: Token needs refresh, attempting refresh...');
      return await this.refreshAccessToken();
    }

    console.log('🎯 SimpleAuth: Token is still valid for', Math.round(timeUntilExpiry / 60000), 'minutes');
    return true;
  }

  // Refresh access token
  async refreshAccessToken() {
    if (!this.refreshToken) {
      console.log('🎯 SimpleAuth: No refresh token available');
      return false;
    }

    try {
      console.log('🎯 SimpleAuth: Refreshing access token...');
      
      const response = await fetch('http://localhost:3001/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          refreshToken: this.refreshToken
        })
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('🎯 SimpleAuth: Token refreshed successfully');
        
        // Update tokens
        this.accessToken = data.accessToken;
        if (data.refreshToken && data.refreshToken !== this.refreshToken) {
          console.log('🎯 SimpleAuth: Refresh token rotated');
          this.refreshToken = data.refreshToken;
        }
        
        // Update expiry
        const expiresIn = data.expiresIn || 900;
        this.tokenExpiry = new Date(Date.now() + expiresIn * 1000);
        
        // Store updated tokens
        localStorage.setItem(AUTH_TOKEN_KEY, this.accessToken);
        if (data.refreshToken) {
          localStorage.setItem(REFRESH_TOKEN_KEY, this.refreshToken);
        }
        localStorage.setItem(TOKEN_EXPIRY_KEY, this.tokenExpiry.toISOString());
        
        await this.syncToChromeStorage();
        
        console.log('🎯 SimpleAuth: New token expires at:', this.tokenExpiry);
        return true;
      } else {
        throw new Error(data.error || 'Token refresh failed');
      }
    } catch (error) {
      console.error('🎯 SimpleAuth: Token refresh error:', error);
      
      // If refresh fails, clear authentication
      console.log('🎯 SimpleAuth: Clearing authentication due to refresh failure');
      await this.logout();
      return false;
    }
  }

  // Start automatic token refresh timer
  startRefreshTimer() {
    this.stopRefreshTimer();

    if (!this.tokenExpiry) {
      return;
    }

    const now = new Date();
    const timeUntilExpiry = this.tokenExpiry.getTime() - now.getTime();
    const refreshTime = Math.max(timeUntilExpiry - 2 * 60 * 1000, 30 * 1000); // 2 minutes before expiry, minimum 30 seconds

    this.refreshTimer = setTimeout(async () => {
      console.log('🎯 SimpleAuth: Automatic token refresh triggered');
      await this.checkAndRefreshToken();
      this.startRefreshTimer(); // Schedule next refresh
    }, refreshTime);

    console.log('🎯 SimpleAuth: Refresh timer set for', Math.round(refreshTime / 60000), 'minutes');
  }

  // Stop automatic refresh timer
  stopRefreshTimer() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  // Sync data to chrome.storage.local
  async syncToChromeStorage() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      try {
        const dataToStore = {
          [AUTH_TOKEN_KEY]: this.accessToken,
          [USER_DATA_KEY]: JSON.stringify(this.user)
        };
        
        if (this.refreshToken) {
          dataToStore[REFRESH_TOKEN_KEY] = this.refreshToken;
        }
        if (this.tokenExpiry) {
          dataToStore[TOKEN_EXPIRY_KEY] = this.tokenExpiry.toISOString();
        }
        
        await chrome.storage.local.set(dataToStore);
        console.log('🎯 SimpleAuth: Data synced to chrome.storage.local');
      } catch (error) {
        console.error('🎯 SimpleAuth: Failed to sync to chrome.storage.local:', error);
      }
    }
  }

  // Sync data to localStorage
  syncToLocalStorage() {
    try {
      localStorage.setItem(AUTH_TOKEN_KEY, this.accessToken);
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(this.user));
      
      if (this.refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, this.refreshToken);
      }
      if (this.tokenExpiry) {
        localStorage.setItem(TOKEN_EXPIRY_KEY, this.tokenExpiry.toISOString());
      }
      
      console.log('🎯 SimpleAuth: Data synced to localStorage');
    } catch (error) {
      console.error('🎯 SimpleAuth: Failed to sync to localStorage:', error);
    }
  }

  // Logout user
  async logout() {
    try {
      console.log('🎯 SimpleAuth: Logging out...');
      
      // Stop refresh timer
      this.stopRefreshTimer();
      
      // Call logout endpoint if we have tokens
      if (this.refreshToken) {
        try {
          await fetch('http://localhost:3001/api/auth/logout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.accessToken}`
            },
            body: JSON.stringify({
              refreshToken: this.refreshToken
            })
          });
        } catch (logoutError) {
          console.error('🎯 SimpleAuth: Logout API error:', logoutError);
          // Continue with local cleanup even if API call fails
        }
      }
      
      // Clear localStorage
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_DATA_KEY);
      localStorage.removeItem(TOKEN_EXPIRY_KEY);
      console.log('🎯 SimpleAuth: Cleared localStorage');
      
      // Clear chrome.storage.local
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        try {
          await chrome.storage.local.remove([
            AUTH_TOKEN_KEY, 
            REFRESH_TOKEN_KEY, 
            USER_DATA_KEY, 
            TOKEN_EXPIRY_KEY
          ]);
          console.log('🎯 SimpleAuth: Cleared chrome.storage.local');
        } catch (chromeError) {
          console.error('🎯 SimpleAuth: Failed to clear chrome.storage.local:', chromeError);
        }
      }
      
      // Clear state
      this.accessToken = null;
      this.refreshToken = null;
      this.user = null;
      this.tokenExpiry = null;
      this.isAuthenticated = false;
      
      console.log('🎯 SimpleAuth: Logout successful');
      return true;
    } catch (error) {
      console.error('🎯 SimpleAuth: Logout error:', error);
      return false;
    }
  }

  // Get current user
  getCurrentUser() {
    return this.user;
  }

  // Get auth token (always return access token)
  getToken() {
    return this.accessToken;
  }

  // Check if authenticated
  isUserAuthenticated() {
    return this.isAuthenticated && !!this.accessToken;
  }

  // Get auth headers for API calls
  getAuthHeaders() {
    if (this.accessToken) {
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`
      };
    } else {
      return {
        'Content-Type': 'application/json'
      };
    }
  }

  // Clear all data
  clear() {
    this.stopRefreshTimer();
    this.accessToken = null;
    this.refreshToken = null;
    this.user = null;
    this.tokenExpiry = null;
    this.isAuthenticated = false;
  }

  // Verify token with backend
  async verifyToken() {
    if (!this.accessToken) {
      return false;
    }

    try {
      const response = await fetch('http://localhost:3001/api/auth/verify', {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        return data.success || false;
      } else if (response.status === 401) {
        // Token is invalid, try to refresh
        console.log('🎯 SimpleAuth: Token verification failed, attempting refresh...');
        return await this.refreshAccessToken();
      } else {
        console.log('🎯 SimpleAuth: Token verification failed');
        return false;
      }
    } catch (error) {
      console.error('🎯 SimpleAuth: Token verification error:', error);
      return false;
    }
  }

  // Debug method to check storage status
  async debugStorage() {
    console.log('🎯 SimpleAuth: === STORAGE DEBUG ===');
    
    // Check localStorage
    const localToken = localStorage.getItem(AUTH_TOKEN_KEY);
    const localRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const localUser = localStorage.getItem(USER_DATA_KEY);
    const localExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    console.log('🎯 SimpleAuth: localStorage token:', !!localToken);
    console.log('🎯 SimpleAuth: localStorage refresh token:', !!localRefreshToken);
    console.log('🎯 SimpleAuth: localStorage user:', !!localUser);
    console.log('🎯 SimpleAuth: localStorage expiry:', localExpiry);
    
    // Check chrome.storage.local
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      try {
        const chromeResult = await chrome.storage.local.get([
          AUTH_TOKEN_KEY, 
          REFRESH_TOKEN_KEY, 
          USER_DATA_KEY, 
          TOKEN_EXPIRY_KEY
        ]);
        console.log('🎯 SimpleAuth: chrome.storage.local result:', chromeResult);
        console.log('🎯 SimpleAuth: chrome.storage.local token:', !!chromeResult[AUTH_TOKEN_KEY]);
        console.log('🎯 SimpleAuth: chrome.storage.local refresh token:', !!chromeResult[REFRESH_TOKEN_KEY]);
        console.log('🎯 SimpleAuth: chrome.storage.local user:', !!chromeResult[USER_DATA_KEY]);
        console.log('🎯 SimpleAuth: chrome.storage.local expiry:', chromeResult[TOKEN_EXPIRY_KEY]);
      } catch (error) {
        console.error('🎯 SimpleAuth: chrome.storage.local debug error:', error);
      }
    } else {
      console.log('🎯 SimpleAuth: chrome.storage.local not available');
    }
    
    // Check current state
    console.log('🎯 SimpleAuth: Current state - authenticated:', this.isAuthenticated);
    console.log('🎯 SimpleAuth: Current state - user:', this.user?.name);
    console.log('🎯 SimpleAuth: Current state - access token:', !!this.accessToken);
    console.log('🎯 SimpleAuth: Current state - refresh token:', !!this.refreshToken);
    console.log('🎯 SimpleAuth: Current state - token expiry:', this.tokenExpiry);
  }
}

// Create singleton instance
const simpleAuth = new SimpleAuth();

// Export functions (now async)
export const initAuth = () => simpleAuth.init();
export const loginUser = (tokenData, user) => simpleAuth.login(tokenData, user);
export const logoutUser = () => simpleAuth.logout();
export const getCurrentUser = () => simpleAuth.getCurrentUser();
export const getAuthToken = () => simpleAuth.getToken();
export const isAuthenticated = () => simpleAuth.isUserAuthenticated();
export const getAuthHeaders = () => simpleAuth.getAuthHeaders();
export const verifyToken = () => simpleAuth.verifyToken();
export const refreshToken = () => simpleAuth.refreshAccessToken();
export const debugStorage = () => simpleAuth.debugStorage();

export default simpleAuth; 