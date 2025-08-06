import { getAuthHeaders, getAuthToken } from './simpleAuth.js';

const API_BASE_URL = 'http://localhost:3001/api';

// Helper function for API requests with persistent authentication
const apiRequest = async (endpoint, options = {}) => {
  // Get auth headers from simple auth
  const headers = {
    ...getAuthHeaders(),
    ...options.headers
  };
  
  const config = {
    headers,
    ...options
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      // Try to parse JSON error response
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || `HTTP error! status: ${response.status}`;
      } catch (parseError) {
        // If JSON parsing fails, use text response
        const textResponse = await response.text();
        errorMessage = textResponse || `HTTP error! status: ${response.status}`;
      }
      
      // Handle authentication errors
      if (response.status === 401) {
        console.log('🎯 BillableAI: Authentication failed, clearing stored auth');
        // Simple auth will handle clearing in its logout function
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    // Handle network errors gracefully
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      console.log('🎯 BillableAI: Network error during API request');
      throw new Error('Network error. Please check your connection.');
    }
    throw error;
  }
};

// Authentication API
export const authAPI = {
  // Register new user
  register: async (userData) => {
    const result = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    
    // Store authentication data - handled by simple auth in AppContext
    if (result.token && result.user) {
      console.log('🎯 BillableAI: Auth data will be stored by simple auth');
    }
    
    return result;
  },

  // Login user
  login: async (credentials) => {
    const result = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    
    // Store authentication data - handled by simple auth in AppContext
    if (result.token && result.user) {
      console.log('🎯 BillableAI: Auth data will be stored by simple auth');
    }
    
    return result;
  },

  // Get user profile
  getProfile: async () => {
    return await apiRequest('/auth/profile');
  },

  // Verify token
  verifyToken: async () => {
    try {
      return await apiRequest('/auth/verify');
    } catch (error) {
      // If network error, return mock valid response for stored tokens
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        const token = localStorage.getItem('billableai_auth_token');
        const user = localStorage.getItem('billableai_user_data');
        if (token && user) {
          console.log('🎯 BillableAI: Network error during token verification, using stored token');
          return { valid: true, message: 'Using stored token due to network error' };
        }
      }
      throw error;
    }
  },

  // Logout
  logout: async () => {
    try {
      // Logout handled by simple auth
      console.log('🎯 BillableAI: Logout handled by simple auth');
    } catch (error) {
      console.error('🎯 BillableAI: Error during logout:', error);
    }
  }
};

// User API
export const userAPI = {
  getProfile: async () => {
    return await apiRequest('/auth/profile');
  },

  updateProfile: async (profileData) => {
    return await apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }
};

// Preferences API
export const preferencesAPI = {
  updateAIPreferences: async (preferences) => {
    return await apiRequest('/preferences/ai', {
      method: 'PUT',
      body: JSON.stringify(preferences)
    });
  },

  updateBillablePreferences: async (preferences) => {
    return await apiRequest('/preferences/billable', {
      method: 'PUT',
      body: JSON.stringify(preferences)
    });
  },

  update2FA: async (twoFactorAuth) => {
    return await apiRequest('/preferences/2fa', {
      method: 'PUT',
      body: JSON.stringify(twoFactorAuth)
    });
  }
};

// Clio API
export const clioAPI = {
  updateConnectionStatus: async (connected) => {
    return await apiRequest('/clio/connection', {
      method: 'PUT',
      body: JSON.stringify({ isConnectedToClio: connected })
    });
  }
};

// Work History API
export const workHistoryAPI = {
  updateWorkHistory: async (history) => {
    return await apiRequest('/work-history', {
      method: 'PUT',
      body: JSON.stringify(history)
    });
  }
};

// Extension API
export const extensionAPI = {
  health: async () => {
    return await apiRequest('/extension/health');
  },

  register: async (userData) => {
    return await apiRequest('/extension/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  login: async (credentials) => {
    return await apiRequest('/extension/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  },

  getProfile: async () => {
    return await apiRequest('/extension/profile');
  },

  verifyToken: async () => {
    return await apiRequest('/extension/verify');
  }
};

// Assistant context API functions
export const assistantAPI = {
  // Get assistant context
  getAssistantContext: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/assistant-context`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to get assistant context');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get assistant context error:', error);
      throw error;
    }
  },

  // Update assistant context
  updateAssistantContext: async (assistantContext) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/assistant-context`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ assistantContext })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update assistant context');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Update assistant context error:', error);
      throw error;
    }
  }
};

import { isAuthenticated as simpleAuthIsAuthenticated, getCurrentUser } from './simpleAuth.js';

// Check if user is authenticated
export const isAuthenticated = async () => {
  return simpleAuthIsAuthenticated();
};

// Store authentication data
export const storeAuthData = async (token, user) => {
  // This function is now handled by simpleAuth.loginUser()
  console.log('🎯 BillableAI: storeAuthData called - use loginUser from simpleAuth instead');
};

// Get stored user data
export const getStoredUser = async () => {
  return getCurrentUser();
};

// Initialize authentication (no-op for localStorage approach)
export const initializeAuth = async () => {
  console.log('🎯 BillableAI: Authentication initialized (simple auth)');
  return true;
}; 