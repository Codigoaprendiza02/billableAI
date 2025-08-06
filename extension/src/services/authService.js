// Enhanced Authentication Service for BillableAI Extension
// Uses Chrome storage for persistent authentication across extension sessions

class AuthService {
  constructor() {
    this.isInitialized = false;
    this.authToken = null;
    this.user = null;
    this.isAuthenticated = false;
    this.refreshTimer = null;
  }

  // Initialize authentication service
  async initialize() {
    try {
      console.log('🎯 BillableAI: Initializing authentication service...');
      
      // Load stored authentication data from Chrome storage
      await this.loadAuthData();
      
      // Verify token if we have one
      if (this.authToken) {
        const isValid = await this.verifyToken();
        if (!isValid) {
          console.log('🎯 BillableAI: Stored token is invalid, clearing authentication');
          await this.logout();
        } else {
          // Start automatic token refresh
          this.startTokenRefreshTimer();
        }
      }
      
      this.isInitialized = true;
      console.log('🎯 BillableAI: Authentication service initialized');
      return true;
    } catch (error) {
      console.error('🎯 BillableAI: Error initializing authentication service:', error);
      return false;
    }
  }

  // Load authentication data from Chrome storage
  async loadAuthData() {
    try {
      const result = await chrome.storage.local.get([
        'billableai_auth_token',
        'billableai_user_data',
        'billableai_auth_expiry',
        'billableai_refresh_token'
      ]);

      this.authToken = result.billableai_auth_token || null;
      this.user = result.billableai_user_data ? JSON.parse(result.billableai_user_data) : null;
      this.refreshToken = result.billableai_refresh_token || null;
      
      // Check if token is expired
      if (result.billableai_auth_expiry) {
        const expiryTime = new Date(result.billableai_auth_expiry).getTime();
        const now = Date.now();
        
        if (now >= expiryTime) {
          console.log('🎯 BillableAI: Stored token has expired');
          this.authToken = null;
          this.user = null;
          this.refreshToken = null;
        }
      }

      this.isAuthenticated = !!(this.authToken && this.user);
      console.log('🎯 BillableAI: Auth data loaded from Chrome storage:', {
        hasToken: !!this.authToken,
        hasUser: !!this.user,
        hasRefreshToken: !!this.refreshToken,
        isAuthenticated: this.isAuthenticated
      });
    } catch (error) {
      console.error('🎯 BillableAI: Error loading auth data from Chrome storage:', error);
      // Fallback to localStorage if Chrome storage fails
      await this.loadAuthDataFromLocalStorage();
    }
  }

  // Fallback to localStorage
  async loadAuthDataFromLocalStorage() {
    try {
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('user');
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (token && userData) {
        this.authToken = token;
        this.user = JSON.parse(userData);
        this.refreshToken = refreshToken;
        this.isAuthenticated = true;
        
        // Migrate to Chrome storage
        await this.saveAuthData();
        console.log('🎯 BillableAI: Migrated auth data from localStorage to Chrome storage');
      }
    } catch (error) {
      console.error('🎯 BillableAI: Error loading auth data from localStorage:', error);
    }
  }

  // Save authentication data to Chrome storage
  async saveAuthData() {
    try {
      const authData = {
        billableai_auth_token: this.authToken,
        billableai_user_data: this.user ? JSON.stringify(this.user) : null,
        billableai_auth_expiry: this.user?.tokenExpiry || null,
        billableai_refresh_token: this.refreshToken || null
      };

      await chrome.storage.local.set(authData);
      console.log('🎯 BillableAI: Auth data saved to Chrome storage');
    } catch (error) {
      console.error('🎯 BillableAI: Error saving auth data to Chrome storage:', error);
      // Fallback to localStorage
      this.saveAuthDataToLocalStorage();
    }
  }

  // Fallback to localStorage
  saveAuthDataToLocalStorage() {
    try {
      if (this.authToken) {
        localStorage.setItem('authToken', this.authToken);
      }
      if (this.user) {
        localStorage.setItem('user', JSON.stringify(this.user));
      }
      if (this.refreshToken) {
        localStorage.setItem('refreshToken', this.refreshToken);
      }
      console.log('🎯 BillableAI: Auth data saved to localStorage as fallback');
    } catch (error) {
      console.error('🎯 BillableAI: Error saving auth data to localStorage:', error);
    }
  }

  // Start automatic token refresh timer
  startTokenRefreshTimer() {
    this.stopTokenRefreshTimer();
    
    if (!this.user?.tokenExpiry) {
      return;
    }

    const expiryTime = new Date(this.user.tokenExpiry).getTime();
    const now = Date.now();
    const timeUntilExpiry = expiryTime - now;
    const refreshTime = Math.max(timeUntilExpiry - 5 * 60 * 1000, 30 * 1000); // 5 minutes before expiry

    this.refreshTimer = setTimeout(async () => {
      console.log('🎯 BillableAI: Automatic token refresh triggered');
      await this.refreshToken();
      this.startTokenRefreshTimer(); // Schedule next refresh
    }, refreshTime);

    console.log('🎯 BillableAI: Token refresh timer set for', Math.round(refreshTime / 60000), 'minutes');
  }

  // Stop automatic token refresh timer
  stopTokenRefreshTimer() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  // Login user
  async login(credentials) {
    try {
      console.log('🎯 BillableAI: Attempting login...');
      
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      
      // Set authentication data - handle both 'token' and 'accessToken' fields
      this.authToken = data.token || data.accessToken;
      this.refreshToken = data.refreshToken || null;
      this.user = {
        ...data.user,
        tokenExpiry: data.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours default
      };
      this.isAuthenticated = true;

      // Save to persistent storage
      await this.saveAuthData();
      
      // Start automatic token refresh
      this.startTokenRefreshTimer();
      
      console.log('🎯 BillableAI: Login successful');
      return { success: true, user: this.user };
    } catch (error) {
      console.error('🎯 BillableAI: Login error:', error);
      throw error;
    }
  }

  // Register user
  async register(userData) {
    try {
      console.log('🎯 BillableAI: Attempting registration...');
      
      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      const data = await response.json();
      
      // Set authentication data - handle both 'token' and 'accessToken' fields
      this.authToken = data.token || data.accessToken;
      this.refreshToken = data.refreshToken || null;
      this.user = {
        ...data.user,
        tokenExpiry: data.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };
      this.isAuthenticated = true;

      // Save to persistent storage
      await this.saveAuthData();
      
      // Start automatic token refresh
      this.startTokenRefreshTimer();
      
      console.log('🎯 BillableAI: Registration successful');
      return { success: true, user: this.user };
    } catch (error) {
      console.error('🎯 BillableAI: Registration error:', error);
      throw error;
    }
  }

  // Verify token with backend
  async verifyToken() {
    try {
      if (!this.authToken) {
        return false;
      }

      const response = await fetch('http://localhost:3001/api/auth/verify', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Update user data if needed
        if (data.user) {
          this.user = { ...this.user, ...data.user };
          await this.saveAuthData();
        }
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('🎯 BillableAI: Token verification error:', error);
      return false;
    }
  }

  // Refresh token
  async refreshToken() {
    try {
      if (!this.refreshToken) {
        throw new Error('No refresh token to refresh');
      }

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
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      
      // Update authentication data
      this.authToken = data.accessToken || data.token;
      if (data.refreshToken) {
        this.refreshToken = data.refreshToken;
      }
      this.user = {
        ...this.user,
        tokenExpiry: data.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

      // Save to persistent storage
      await this.saveAuthData();
      
      console.log('🎯 BillableAI: Token refreshed successfully');
      return true;
    } catch (error) {
      console.error('🎯 BillableAI: Token refresh error:', error);
      return false;
    }
  }

  // Logout user
  async logout() {
    try {
      console.log('🎯 BillableAI: Logging out...');
      
      // Stop token refresh timer
      this.stopTokenRefreshTimer();
      
      // Clear authentication data
      this.authToken = null;
      this.user = null;
      this.refreshToken = null;
      this.isAuthenticated = false;

      // Clear from Chrome storage
      await chrome.storage.local.remove([
        'billableai_auth_token',
        'billableai_user_data',
        'billableai_auth_expiry',
        'billableai_refresh_token'
      ]);

      // Also clear localStorage for compatibility
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('refreshToken');
      
      console.log('🎯 BillableAI: Logout successful');
    } catch (error) {
      console.error('🎯 BillableAI: Logout error:', error);
    }
  }

  // Get current user
  getCurrentUser() {
    return this.user;
  }

  // Get auth token
  getAuthToken() {
    return this.authToken;
  }

  // Check if user is authenticated
  isUserAuthenticated() {
    return this.isAuthenticated && this.authToken && this.user;
  }

  // Get authentication headers for API requests
  getAuthHeaders() {
    if (!this.authToken) {
      return {};
    }
    return {
      'Authorization': `Bearer ${this.authToken}`,
      'Content-Type': 'application/json'
    };
  }

  // Auto-refresh token if needed
  async ensureValidToken() {
    if (!this.authToken) {
      return false;
    }

    // Check if token is about to expire (within 5 minutes)
    if (this.user?.tokenExpiry) {
      const expiryTime = new Date(this.user.tokenExpiry).getTime();
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;

      if (expiryTime - now < fiveMinutes) {
        console.log('🎯 BillableAI: Token expiring soon, refreshing...');
        return await this.refreshToken();
      }
    }

    return true;
  }

  // Get user profile
  async getUserProfile() {
    try {
      await this.ensureValidToken();
      
      const response = await fetch('http://localhost:3001/api/auth/profile', {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to get user profile');
      }

      const profile = await response.json();
      
      // Update user data
      this.user = { ...this.user, ...profile };
      await this.saveAuthData();
      
      return profile;
    } catch (error) {
      console.error('🎯 BillableAI: Get user profile error:', error);
      throw error;
    }
  }

  // Update user profile
  async updateUserProfile(profileData) {
    try {
      await this.ensureValidToken();
      
      const response = await fetch('http://localhost:3001/api/auth/profile', {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(profileData)
      });

      if (!response.ok) {
        throw new Error('Failed to update user profile');
      }

      const updatedProfile = await response.json();
      
      // Update user data
      this.user = { ...this.user, ...updatedProfile };
      await this.saveAuthData();
      
      return updatedProfile;
    } catch (error) {
      console.error('🎯 BillableAI: Update user profile error:', error);
      throw error;
    }
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService; 