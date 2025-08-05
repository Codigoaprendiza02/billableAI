// Simple Authentication Utility for BillableAI Extension
// Uses chrome.storage.local for cross-context persistence with localStorage fallback
// Based on Chrome Storage API documentation: https://developer.chrome.com/docs/extensions/reference/api/storage

const AUTH_TOKEN_KEY = 'billableai_auth_token';
const USER_DATA_KEY = 'billableai_user_data';

// Simple authentication class
class SimpleAuth {
  constructor() {
    this.isAuthenticated = false;
    this.user = null;
    this.token = null;
  }

  // Initialize authentication on startup
  async init() {
    try {
      console.log('🎯 SimpleAuth: Initializing authentication...');
      
      // Try chrome.storage.local first (for cross-context persistence)
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        try {
          console.log('🎯 SimpleAuth: Attempting to read from chrome.storage.local...');
          
          // Use Promise-based API as recommended in Chrome documentation
          const result = await chrome.storage.local.get([AUTH_TOKEN_KEY, USER_DATA_KEY]);
          const token = result[AUTH_TOKEN_KEY];
          const userData = result[USER_DATA_KEY];
          
          console.log('🎯 SimpleAuth: Chrome storage - Token found:', !!token);
          console.log('🎯 SimpleAuth: Chrome storage - User data found:', !!userData);
          console.log('🎯 SimpleAuth: Chrome storage result:', result);
          
          if (token && userData) {
            this.token = token;
            this.user = typeof userData === 'string' ? JSON.parse(userData) : userData;
            this.isAuthenticated = true;
            console.log('🎯 SimpleAuth: Authentication restored from chrome.storage.local');
            console.log('🎯 SimpleAuth: User:', this.user.name);
            
            // Also sync to localStorage for immediate access
            localStorage.setItem(AUTH_TOKEN_KEY, token);
            localStorage.setItem(USER_DATA_KEY, JSON.stringify(this.user));
            
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
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      const userData = localStorage.getItem(USER_DATA_KEY);
      
      console.log('🎯 SimpleAuth: localStorage - Token found:', !!token);
      console.log('🎯 SimpleAuth: localStorage - User data found:', !!userData);
      
      if (token && userData) {
        this.token = token;
        this.user = JSON.parse(userData);
        this.isAuthenticated = true;
        console.log('🎯 SimpleAuth: Authentication restored from localStorage');
        console.log('🎯 SimpleAuth: User:', this.user.name);
        
        // Sync to chrome.storage.local if available
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          try {
            await chrome.storage.local.set({
              [AUTH_TOKEN_KEY]: token,
              [USER_DATA_KEY]: userData
            });
            console.log('🎯 SimpleAuth: Synced to chrome.storage.local');
          } catch (syncError) {
            console.error('🎯 SimpleAuth: Failed to sync to chrome.storage.local:', syncError);
          }
        }
        
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

  // Login user
  async login(token, user) {
    try {
      console.log('🎯 SimpleAuth: Logging in user:', user.name);
      
      // Store in localStorage (immediate access)
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
      console.log('🎯 SimpleAuth: Data stored in localStorage');
      
      // Store in chrome.storage.local (cross-context persistence)
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        try {
          console.log('🎯 SimpleAuth: Storing in chrome.storage.local...');
          
          // Use Promise-based API as recommended
          await chrome.storage.local.set({
            [AUTH_TOKEN_KEY]: token,
            [USER_DATA_KEY]: JSON.stringify(user)
          });
          
          console.log('🎯 SimpleAuth: Data stored in chrome.storage.local');
          
          // Verify the data was stored correctly
          const verifyResult = await chrome.storage.local.get([AUTH_TOKEN_KEY, USER_DATA_KEY]);
          console.log('🎯 SimpleAuth: Verification - Token stored:', !!verifyResult[AUTH_TOKEN_KEY]);
          console.log('🎯 SimpleAuth: Verification - User stored:', !!verifyResult[USER_DATA_KEY]);
          
        } catch (chromeError) {
          console.error('🎯 SimpleAuth: Failed to store in chrome.storage.local:', chromeError);
          console.log('🎯 SimpleAuth: Using localStorage only');
        }
      } else {
        console.log('🎯 SimpleAuth: Chrome storage not available, using localStorage only');
      }
      
      // Update state
      this.token = token;
      this.user = user;
      this.isAuthenticated = true;
      
      console.log('🎯 SimpleAuth: Login successful, data stored');
      console.log('🎯 SimpleAuth: Token stored:', !!token);
      console.log('🎯 SimpleAuth: User stored:', !!user);
      return true;
    } catch (error) {
      console.error('🎯 SimpleAuth: Login error:', error);
      return false;
    }
  }

  // Logout user
  async logout() {
    try {
      console.log('🎯 SimpleAuth: Logging out...');
      
      // Clear localStorage
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(USER_DATA_KEY);
      console.log('🎯 SimpleAuth: Cleared localStorage');
      
      // Clear chrome.storage.local
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        try {
          await chrome.storage.local.remove([AUTH_TOKEN_KEY, USER_DATA_KEY]);
          console.log('🎯 SimpleAuth: Cleared chrome.storage.local');
        } catch (chromeError) {
          console.error('🎯 SimpleAuth: Failed to clear chrome.storage.local:', chromeError);
        }
      }
      
      // Clear state
      this.token = null;
      this.user = null;
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

  // Get auth token
  getToken() {
    return this.token;
  }

  // Check if authenticated
  isUserAuthenticated() {
    return this.isAuthenticated;
  }

  // Get auth headers for API calls
  getAuthHeaders() {
    if (this.token) {
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      };
    } else {
      return {
        'Content-Type': 'application/json'
      };
    }
  }

  // Clear all data
  clear() {
    this.token = null;
    this.user = null;
    this.isAuthenticated = false;
  }

  // Verify token with backend
  async verifyToken() {
    if (!this.token) {
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
    const localUser = localStorage.getItem(USER_DATA_KEY);
    console.log('🎯 SimpleAuth: localStorage token:', !!localToken);
    console.log('🎯 SimpleAuth: localStorage user:', !!localUser);
    
    // Check chrome.storage.local
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      try {
        const chromeResult = await chrome.storage.local.get([AUTH_TOKEN_KEY, USER_DATA_KEY]);
        console.log('🎯 SimpleAuth: chrome.storage.local result:', chromeResult);
        console.log('🎯 SimpleAuth: chrome.storage.local token:', !!chromeResult[AUTH_TOKEN_KEY]);
        console.log('🎯 SimpleAuth: chrome.storage.local user:', !!chromeResult[USER_DATA_KEY]);
      } catch (error) {
        console.error('🎯 SimpleAuth: chrome.storage.local debug error:', error);
      }
    } else {
      console.log('🎯 SimpleAuth: chrome.storage.local not available');
    }
    
    // Check current state
    console.log('🎯 SimpleAuth: Current state - authenticated:', this.isAuthenticated);
    console.log('🎯 SimpleAuth: Current state - user:', this.user?.name);
    console.log('🎯 SimpleAuth: Current state - token:', !!this.token);
  }
}

// Create singleton instance
const simpleAuth = new SimpleAuth();

// Export functions (now async)
export const initAuth = () => simpleAuth.init();
export const loginUser = (token, user) => simpleAuth.login(token, user);
export const logoutUser = () => simpleAuth.logout();
export const getCurrentUser = () => simpleAuth.getCurrentUser();
export const getAuthToken = () => simpleAuth.getToken();
export const isAuthenticated = () => simpleAuth.isUserAuthenticated();
export const getAuthHeaders = () => simpleAuth.getAuthHeaders();
export const verifyToken = () => simpleAuth.verifyToken();
export const debugStorage = () => simpleAuth.debugStorage();

export default simpleAuth; 