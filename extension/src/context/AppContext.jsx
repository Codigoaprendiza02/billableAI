import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, userAPI, preferencesAPI, clioAPI, workHistoryAPI } from '../utils/api.js';
import { initiateClioOAuth, handleClioOAuthCallback, checkClioConnection } from '../services/oauthService.js';
import { initAuth, loginUser, logoutUser, getCurrentUser, isAuthenticated, verifyToken, debugStorage } from '../utils/simpleAuth.js';
import simpleAuth from '../utils/simpleAuth.js';
import GeminiService from '../services/geminiService.js';

const AppContext = createContext();

export { AppContext };

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export const useAuth = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAuth must be used within an AppProvider');
  }
  return {
    login: context.login,
    register: context.register,
    logout: context.logout,
    isAuthenticatedUser: context.isAuthenticatedUser
  };
};

export const AppProvider = ({ children }) => {
  const [currentPage, setCurrentPage] = useState('onboarding');
  const [user, setUser] = useState({
    name: 'John Doe',
    profession: 'Lawyer',
    gender: '',
    avatar: null
  });
  const [isConnectedToClio, setIsConnectedToClio] = useState(false);
  
  // Load Clio connection state on startup
  useEffect(() => {
    const loadClioConnectionState = async () => {
      try {
        console.log('🎯 BillableAI: Loading Clio connection state...');
        
        // Try chrome.storage.local first
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          try {
            const result = await chrome.storage.local.get(['billableai_clio_connected']);
            if (result.billableai_clio_connected) {
              console.log('🎯 BillableAI: Clio connection state restored from chrome.storage.local');
              setIsConnectedToClio(true);
              return;
            }
          } catch (error) {
            console.log('🎯 BillableAI: Chrome storage error, trying localStorage:', error);
          }
        }
        
        // Fallback to localStorage
        const clioConnected = localStorage.getItem('billableai_clio_connected');
        if (clioConnected === 'true') {
          console.log('🎯 BillableAI: Clio connection state restored from localStorage');
          setIsConnectedToClio(true);
        } else {
          console.log('🎯 BillableAI: No stored Clio connection state found');
        }
      } catch (error) {
        console.error('🎯 BillableAI: Error loading Clio connection state:', error);
      }
    };
    
    loadClioConnectionState();
  }, []);
  const [workHistory, setWorkHistory] = useState({
    emailLogs: 10,
    timeSpent: '3 hrs',
    summaries: 10
  });
  const [aiPreferences, setAiPreferences] = useState({
    emailAutoSuggestions: true,
    defaultTone: 'Formal'
  });
  const [billableLogging, setBillableLogging] = useState({
    defaultTimeUnit: 'Hours',
    confirmationBeforeLogging: true,
    confirmationBeforeAttaching: true
  });
  const [twoFactorAuth, setTwoFactorAuth] = useState({
    enabled: true,
    method: 'Email',
    email: '',
    phone: ''
  });
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticatedUser, setIsAuthenticatedUser] = useState(false);
  
  // Initialize GeminiService
  const [geminiService, setGeminiService] = useState(null);
  
  // Initialize GeminiService when component mounts
  useEffect(() => {
    const initializeGeminiService = async () => {
      try {
        console.log('🎯 BillableAI: Initializing GeminiService in AppContext...');
        const service = new GeminiService();
        await service.initialize();
        setGeminiService(service);
        console.log('✅ BillableAI: GeminiService initialized successfully in AppContext');
      } catch (error) {
        console.log('❌ BillableAI: Error initializing GeminiService in AppContext:', error);
        // Still set the service even if initialization fails, so components can handle it
        const service = new GeminiService();
        setGeminiService(service);
      }
    };
    
    initializeGeminiService();
  }, []);
  
  // Onboarding state
  const [formData, setFormData] = useState({
    // User data (from authentication)
    user: null,
    
    // Basic info
    name: '',
    gender: '',
    profession: '',
    
    // AI preferences
    emailAutoSuggestions: 'Yes',
    defaultTone: 'Formal',
    
    // Billable logging preferences
    confirmationBeforeLogging: true,
    confirmationBeforeAttaching: true,
    
    // Time unit preference
    defaultTimeUnit: 'Hours'
  });
  const [authMode, setAuthMode] = useState('signup'); // 'signup' or 'signin'
  const [onboardingError, setOnboardingError] = useState('');

  const navigateTo = (page) => {
    setCurrentPage(page);
  };

  // Check if user has any history/work data
  const checkUserHistory = () => {
    try {
      // Check for various types of user history
      const summaries = localStorage.getItem('billableai_summaries');
      const workHistory = localStorage.getItem('billableai_workHistory');
      const chatMessages = localStorage.getItem('billableai_chatMessages');
      const trackingStatus = localStorage.getItem('billableai_trackingStatus');
      
      // If any history exists, user should go to popup
      return !!(summaries || workHistory || chatMessages || trackingStatus);
    } catch (error) {
      console.error('Error checking user history:', error);
      return false;
    }
  };

  // Check authentication status on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('🎯 BillableAI: Starting simple authentication check...');
        
        // Initialize simple auth (now async)
        const authRestored = await initAuth();
        
        if (authRestored) {
          console.log('🎯 BillableAI: Authentication restored successfully');
          
          // Get user data from simple auth
          const userData = getCurrentUser();
          if (userData) {
            // Set user data
            setUser(prevUser => ({
              ...prevUser,
              name: userData.name || prevUser.name,
              profession: userData.profession || prevUser.profession,
              gender: userData.gender || prevUser.gender,
              avatar: userData.avatar || prevUser.avatar
            }));
          }
          
          // Set authenticated state
          setIsAuthenticatedUser(true);
          
          // Try to verify token with backend (optional)
          try {
            const isValid = await verifyToken();
            if (!isValid) {
              console.log('🎯 BillableAI: Token verification failed, but keeping local auth');
            }
          } catch (error) {
            console.log('🎯 BillableAI: Token verification error, using local auth:', error.message);
          }
          
          // Check if user has completed onboarding
          const onboardingCompleted = localStorage.getItem('billableai_onboarding_completed') === 'true';
          
          // Navigate to appropriate page
          if (onboardingCompleted) {
            setCurrentPage('popup');
            console.log('🎯 BillableAI: Authentication complete, user has completed onboarding, page set to: popup');
          } else {
            setCurrentPage('onboarding');
            console.log('🎯 BillableAI: Authentication complete, user needs to complete onboarding, page set to: onboarding');
          }
        } else {
          console.log('🎯 BillableAI: No authentication found, starting fresh');
          setIsAuthenticatedUser(false);
          setCurrentPage('onboarding');
        }
      } catch (error) {
        console.error('🎯 BillableAI: Error during auth check:', error);
        setIsAuthenticatedUser(false);
        setCurrentPage('onboarding');
      }
    };

    checkAuth();
  }, []);

  // Listen for messages from background script
  useEffect(() => {
    const handleMessage = (request) => {
      if (request.type === 'NAVIGATE_TO_ASSISTANT') {
        console.log('🎯 BillableAI: Navigating to assistant from background script');
        
        // Store assistant data if provided
        if (request.data) {
          console.log('🎯 BillableAI: Assistant data received:', request.data);
          
          // Store in localStorage for assistant to access
          try {
            localStorage.setItem('billableai_assistant_data', JSON.stringify(request.data));
            console.log('🎯 BillableAI: Assistant data stored in localStorage');
          } catch (error) {
            console.error('🎯 BillableAI: Error storing assistant data:', error);
          }
          
          // Also store in chrome.storage.local if available
          if (chrome && chrome.storage && chrome.storage.local) {
            chrome.storage.local.set({ 'billableai_assistant_data': request.data }, () => {
              console.log('🎯 BillableAI: Assistant data stored in chrome.storage.local');
            });
          }
        }
        
        setCurrentPage('assistant');
      }
    };

    // Listen for runtime messages
    if (chrome && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener(handleMessage);
    }

    // Check for chrome.storage.local navigation intent (fallback for connection issues)
    const checkNavigationIntent = () => {
      if (chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['billableai_navigate_to_assistant', 'billableai_assistant_data'], (result) => {
          if (result.billableai_navigate_to_assistant) {
            console.log('🎯 BillableAI: Navigating to assistant from storage fallback');
            
            // Store assistant data if available
            if (result.billableai_assistant_data) {
              console.log('🎯 BillableAI: Assistant data found in chrome.storage.local');
              try {
                localStorage.setItem('billableai_assistant_data', JSON.stringify(result.billableai_assistant_data));
              } catch (error) {
                console.error('🎯 BillableAI: Error storing assistant data from chrome.storage:', error);
              }
            }
            
            setCurrentPage('assistant');
            chrome.storage.local.remove(['billableai_navigate_to_assistant', 'billableai_assistant_data']);
          }
        });
      }
    };

    // Check immediately
    checkNavigationIntent();

    // Also check periodically for navigation intent
    const navigationCheckInterval = setInterval(checkNavigationIntent, 1000);

    // Also check localStorage as additional fallback
    const navigateToAssistant = localStorage.getItem('billableai_navigate_to_assistant');
    if (navigateToAssistant === 'true') {
      console.log('🎯 BillableAI: Navigating to assistant from localStorage fallback');
      setCurrentPage('assistant');
      localStorage.removeItem('billableai_navigate_to_assistant');
    }

    return () => {
      if (chrome && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.removeListener(handleMessage);
      }
      clearInterval(navigationCheckInterval);
    };
  }, []);

  // User data is now handled by simple auth system in checkAuth()

  // Load user profile from backend
  const loadUserProfile = async () => {
    try {
      const response = await userAPI.getProfile();
      const userData = response.user;
      
      setUser({
        name: userData.name || 'John Doe',
        profession: userData.profession || 'Lawyer',
        gender: userData.gender || '',
        avatar: userData.avatar || null
      });
      
      setAiPreferences(userData.aiPreferences || {
        emailAutoSuggestions: true,
        defaultTone: 'Formal'
      });
      
      setBillableLogging(userData.billableLogging || {
        defaultTimeUnit: 'Hours',
        confirmationBeforeLogging: true,
        confirmationBeforeAttaching: true
      });
      
      setTwoFactorAuth(userData.twoFactorAuth || {
        enabled: true,
        method: 'Email',
        email: '',
        phone: ''
      });
      
      setIsConnectedToClio(userData.isConnectedToClio || false);
      setWorkHistory(userData.workHistory || {
        emailLogs: 0,
        timeSpent: '0 hrs',
        summaries: 0
      });
      
      setHasCompletedOnboarding(userData.hasCompletedOnboarding || false);
    } catch (error) {
      console.error('Failed to load user profile from API, trying localStorage:', error);
      
      // Fallback to localStorage (using simple auth keys)
      try {
        const storedUser = localStorage.getItem('billableai_user_data');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser({
            name: userData.name || 'John Doe',
            profession: userData.profession || 'Lawyer',
            gender: userData.gender || '',
            avatar: userData.avatar || null
          });
          console.log('Loaded user data from localStorage:', userData);
        }
      } catch (localStorageError) {
        console.error('Failed to load user data from localStorage:', localStorageError);
      }
    }
  };

  const completeOnboarding = async (onboardingData) => {
    setIsLoading(true);
    setOnboardingError(''); // Clear any previous errors
    
    try {
      // Check if user is already registered (from Step1SignUp)
      const authToken = localStorage.getItem('billableai_auth_token');
      const userData = localStorage.getItem('billableai_user_data');
      
      if (!authToken || !userData) {
        throw new Error('User not registered. Please complete registration first.');
      }

      // Parse user data
      const user = JSON.parse(userData);
      
      // Update local state with user data
      setUser({
        name: user.name,
        profession: user.profession,
        gender: user.gender,
        avatar: user.avatar
      });
      
      // Set onboarding preferences locally
      const emailAutoSuggestions = onboardingData.emailAutoSuggestions === 'Yes' || onboardingData.emailAutoSuggestions === true;
      setAiPreferences({
        emailAutoSuggestions: emailAutoSuggestions,
        defaultTone: onboardingData.defaultTone || 'Formal'
      });

      setBillableLogging({
        defaultTimeUnit: onboardingData.defaultTimeUnit || 'Hours',
        confirmationBeforeLogging: onboardingData.confirmationBeforeLogging !== false,
        confirmationBeforeAttaching: onboardingData.confirmationBeforeAttaching !== false
      });

      setHasCompletedOnboarding(true);
      setIsAuthenticatedUser(true);

      // Store onboarding completion status
      localStorage.setItem('billableai_onboarding_completed', 'true');
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        try {
          await chrome.storage.local.set({ 'billableai_onboarding_completed': true });
        } catch (error) {
          console.error('Failed to store onboarding completion in chrome.storage:', error);
        }
      }

      navigateTo('popup');
    } catch (error) {
      // Set user-friendly error message
      let userMessage = 'Onboarding completion failed. Please try again.';
      
      if (error.message.includes('User not registered')) {
        userMessage = 'Please complete registration first.';
      } else if (error.message.includes('Missing')) {
        userMessage = error.message;
      }
      
      // Set the error and navigate back to signup step
      setOnboardingError(userMessage);
      setCurrentPage('onboarding');
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserAvatar = async (avatarUrl) => {
    setUser(prev => ({
      ...prev,
      avatar: avatarUrl
    }));

    // Sync with backend
    try {
      await userAPI.updateProfile({ avatar: avatarUrl });
    } catch (error) {
      console.error('Failed to update avatar:', error);
    }
  };

  const updateUserProfile = async (profileData) => {
    setUser(prev => ({
      ...prev,
      ...profileData
    }));

    // Sync with backend
    try {
      await userAPI.updateProfile(profileData);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const updateAiPreferences = async (newPreferences) => {
    setAiPreferences(newPreferences);

    // Sync with backend
    try {
      await preferencesAPI.updateAIPreferences(newPreferences);
    } catch (error) {
      console.error('Failed to update AI preferences:', error);
    }
  };

  const updateBillableLogging = async (newPreferences) => {
    setBillableLogging(newPreferences);

    // Sync with backend
    try {
      await preferencesAPI.updateBillablePreferences(newPreferences);
    } catch (error) {
      console.error('Failed to update billable preferences:', error);
    }
  };

  const updateTwoFactorAuth = async (new2FA) => {
    setTwoFactorAuth(new2FA);

    // Sync with backend
    try {
      await preferencesAPI.update2FA(new2FA);
    } catch (error) {
      console.error('Failed to update 2FA:', error);
    }
  };

  const updateClioConnection = async (connected) => {
    try {
      if (connected && !isConnectedToClio) {
        // Initiate Clio OAuth flow
        console.log('🔗 Starting Clio OAuth flow...');
        
        // Check if user is authenticated first
        if (!isAuthenticatedUser) {
          throw new Error('Please login first before connecting to Clio');
        }
        
        // Initiate OAuth flow
        const oauthResult = await initiateClioOAuth();
        console.log('✅ Clio OAuth initiated:', oauthResult);
        
        // Set up listener for OAuth callback from background script
        const handleOAuthCallback = async (request) => {
          if (request.type === 'CLIO_OAUTH_CALLBACK') {
            try {
              console.log('🔄 Handling Clio OAuth callback from background script...');
              const result = await handleClioOAuthCallback(request.code);
              
              if (result.success) {
                // Check real connection status from backend
                const connectionStatus = await checkClioConnection();
                console.log('🔍 Real connection status after OAuth:', connectionStatus);
                
                if (connectionStatus.isConnected) {
                  setIsConnectedToClio(true);
                  await persistClioConnectionState(true);
                  console.log('✅ Clio OAuth completed successfully and connection confirmed');
                } else {
                  console.error('❌ OAuth completed but connection not confirmed');
                  throw new Error('OAuth completed but connection not confirmed');
                }
              } else {
                throw new Error(result.error || 'OAuth failed');
              }
            } catch (error) {
              console.error('❌ Clio OAuth callback error:', error);
            }
          }
        };
        
        // Add message listener
        chrome.runtime.onMessage.addListener(handleOAuthCallback);
        
        // Return early - connection will be updated when callback is received
        return;
      } else if (!connected && isConnectedToClio) {
        // Disconnect from Clio
        setIsConnectedToClio(false);
        
        // Persist Clio connection state
        await persistClioConnectionState(false);
        
        // Sync with backend
        try {
          await clioAPI.updateConnectionStatus(false);
        } catch (error) {
          console.error('Failed to update Clio connection:', error);
        }
      }
    } catch (error) {
      console.error('❌ Clio OAuth error:', error);
      throw error;
    }
  };

  // Function to refresh Clio connection status from backend
  const refreshClioConnectionStatus = async () => {
    try {
      console.log('🔄 Refreshing Clio connection status from backend...');
      
      const connectionStatus = await checkClioConnection();
      console.log('🔍 Backend connection status:', connectionStatus);
      
      // Update local state based on backend status
      setIsConnectedToClio(connectionStatus.isConnected);
      
      // Persist the updated status
      await persistClioConnectionState(connectionStatus.isConnected);
      
      console.log('✅ Clio connection status refreshed:', connectionStatus.isConnected);
      
      return connectionStatus;
    } catch (error) {
      console.error('❌ Error refreshing Clio connection status:', error);
      return { isConnected: false, error: error.message };
    }
  };

  // Helper function to persist Clio connection state
  const persistClioConnectionState = async (connected) => {
    try {
      console.log('🎯 BillableAI: Persisting Clio connection state:', connected);
      
      // Store in chrome.storage.local for cross-context persistence
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        try {
          await chrome.storage.local.set({ 'billableai_clio_connected': connected });
          console.log('🎯 BillableAI: Clio connection state stored in chrome.storage.local');
        } catch (error) {
          console.log('🎯 BillableAI: Chrome storage error, using localStorage:', error);
        }
      }
      
      // Also store in localStorage as fallback
      localStorage.setItem('billableai_clio_connected', connected.toString());
      console.log('🎯 BillableAI: Clio connection state stored in localStorage');
      
    } catch (error) {
      console.error('🎯 BillableAI: Error persisting Clio connection state:', error);
    }
  };

  const updateWorkHistory = async (newHistory) => {
    setWorkHistory(newHistory);

    // Sync with backend
    try {
      await workHistoryAPI.updateWorkHistory(newHistory);
    } catch (error) {
      console.error('Failed to update work history:', error);
    }
  };

  // Simple authentication functions
  const login = async (username, password) => {
    try {
      console.log('🎯 BillableAI: Login attempt for username:', username);
      const response = await authAPI.login({ username, password });
      console.log('🎯 BillableAI: Login response:', response);
      
      if (response.success) {
        console.log('🎯 BillableAI: Login successful, storing auth data...');
        
        // Store auth data using simple auth (now async)
        const success = await loginUser(response.token || 'mock_token', response.user);
        
        if (success) {
          // Set user data
          setUser(response.user);
          setIsAuthenticatedUser(true);
          
          // Check if user has completed onboarding
          const onboardingCompleted = localStorage.getItem('billableai_onboarding_completed') === 'true';
          
          // Navigate to appropriate page
          if (onboardingCompleted) {
            setCurrentPage('popup');
            console.log('🎯 BillableAI: Login complete, user has completed onboarding, page set to: popup');
          } else {
            setCurrentPage('onboarding');
            console.log('🎯 BillableAI: Login complete, user needs to complete onboarding, page set to: onboarding');
          }
          
          return response;
        } else {
          throw new Error('Failed to store authentication data');
        }
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error) {
      console.error('🎯 BillableAI: Login error:', error);
      
      // Convert error messages to user-friendly ones
      let userMessage = 'Login failed. Please try again.';
      
      if (error.message.includes('Invalid credentials')) {
        userMessage = 'Invalid username or password. Please check your credentials.';
      } else if (error.message.includes('User not found')) {
        userMessage = 'User not found. Please check your username or email.';
      } else if (error.message.includes('Email already registered')) {
        userMessage = 'This email is already registered. Please use a different email or try signing in.';
      } else if (error.message.includes('Username already exists')) {
        userMessage = 'This username is already taken. Please choose a different username.';
      } else if (error.message.includes('Missing')) {
        userMessage = error.message;
      }
      
      throw new Error(userMessage);
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      if (response.success) {
        console.log('🎯 BillableAI: Registration successful, storing auth data...');
        
        // Store auth data using simple auth (now async)
        const success = await loginUser(response.token || 'mock_token', response.user);
        
        if (success) {
          // Set user data
          setUser(response.user);
          setIsAuthenticatedUser(true);
          
          // For new registrations, always go to onboarding to complete setup
          setCurrentPage('onboarding');
          
          console.log('🎯 BillableAI: Registration complete, page set to: onboarding');
          return response;
        } else {
          throw new Error('Failed to store authentication data');
        }
      } else {
        throw new Error(response.error || 'Registration failed');
      }
    } catch (error) {
      console.error('🎯 BillableAI: Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('🎯 BillableAI: Logging out...');
      
      // Clear authentication using simple auth (now async)
      await logoutUser();
      
      // Clear all user history and data
      localStorage.removeItem('billableai_summaries');
      localStorage.removeItem('billableai_workHistory');
      localStorage.removeItem('billableai_chatMessages');
      localStorage.removeItem('billableai_trackingStatus');
      localStorage.removeItem('billableai_currentEmail');
      localStorage.removeItem('billableai_timerState');
      localStorage.removeItem('billableai_assistant_data');
      localStorage.removeItem('billableai_navigate_to_assistant');
      localStorage.removeItem('billableai_onboarding_completed');
      
      // Clear from Chrome storage if available
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        try {
          await chrome.storage.local.remove([
            'billableai_auth_token',
            'billableai_user_data',
            'billableai_auth_expiry',
            'billableai_onboarding_completed'
          ]);
        } catch (error) {
          console.error('Failed to clear chrome.storage.local:', error);
        }
      }
      
      // Reset state
      setIsAuthenticatedUser(false);
      setCurrentPage('onboarding');
      
      // Reset all state to defaults
      setUser({
        name: 'John Doe',
        profession: 'Lawyer',
        gender: '',
        avatar: null
      });
      setAiPreferences({
        emailAutoSuggestions: true,
        defaultTone: 'Formal'
      });
      setBillableLogging({
        defaultTimeUnit: 'Hours',
        confirmationBeforeLogging: true,
        confirmationBeforeAttaching: true
      });
      setTwoFactorAuth({
        enabled: true,
        method: 'Email',
        email: '',
        phone: ''
      });
      setIsConnectedToClio(false);
      setWorkHistory({
        emailLogs: 0,
        timeSpent: '0 mins',
        summaries: 0
      });
      setHasCompletedOnboarding(false);
      
      console.log('🎯 BillableAI: Logout successful');
    } catch (error) {
      console.error('🎯 BillableAI: Logout error:', error);
    }
  };

  const updateFormData = (field, value) => {
    if (field === 'authMode') {
      setAuthMode(value);
      return;
    }
    
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      return newData;
    });
  };

  // Debug function to check storage status
  const debugStorageStatus = async () => {
    try {
      console.log('🎯 BillableAI: === DEBUGGING STORAGE STATUS ===');
      await debugStorage();
    } catch (error) {
      console.error('🎯 BillableAI: Debug storage error:', error);
    }
  };

  // Expose debug function globally for console access
  if (typeof window !== 'undefined') {
    window.debugStorageStatus = debugStorageStatus;
    window.simpleAuth = simpleAuth;
  }

  // API call function for email tracking
  const apiCall = async (endpoint, options = {}) => {
    const token = localStorage.getItem('billableai_auth_token');
    
    // Ensure body is properly stringified if it exists
    let body = options.body;
    if (body && typeof body === 'object') {
      body = JSON.stringify(body);
    }
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers
      },
      ...options,
      ...(body && { body })
    };

    try {
      console.log(`🌐 Making API call to: ${endpoint}`);
      console.log('📤 Request config:', { 
        method: config.method || 'GET', 
        body: config.body,
        headers: config.headers 
      });
      
      const response = await fetch(`http://localhost:3001${endpoint}`, config);
      
      console.log(`📥 Response status: ${response.status}`);
      
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        try {
          const contentType = response.headers.get('content-type');
          console.log('📥 Error response content-type:', contentType);
          
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            console.log('📥 Parsed error data:', errorData);
            errorMessage = errorData.error || errorData.message || errorData.details || errorMessage;
          } else {
            const textResponse = await response.text();
            console.log('📥 Error text response:', textResponse);
            errorMessage = textResponse || errorMessage;
          }
        } catch (parseError) {
          console.error('❌ Error parsing error response:', parseError);
          console.error('❌ Parse error details:', {
            message: parseError.message,
            name: parseError.name
          });
          try {
            const textResponse = await response.text();
            console.log('📥 Fallback error text response:', textResponse);
            errorMessage = textResponse || errorMessage;
          } catch (textError) {
            console.error('❌ Error reading error response text:', textError);
          }
        }
        
        console.error(`❌ API Error (${response.status}):`, errorMessage);
        console.error(`❌ Error message type:`, typeof errorMessage);
        throw new Error(String(errorMessage));
      }
      
      // Check if response has content before parsing JSON
      const contentType = response.headers.get('content-type');
      let data;
      
      try {
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
          console.log('✅ API JSON Response:', data);
          console.log('✅ Response data type:', typeof data);
        } else {
          // Handle non-JSON responses
          const textResponse = await response.text();
          console.log('✅ API Text Response:', textResponse);
          data = { success: true, message: textResponse };
        }
        
        return data;
      } catch (parseError) {
        console.error('❌ Error parsing response:', parseError);
        console.error('❌ Parse error details:', {
          message: parseError.message,
          name: parseError.name,
          stack: parseError.stack
        });
        // Try to get text response as fallback
        try {
          const textResponse = await response.text();
          console.log('✅ API Fallback Text Response:', textResponse);
          return { success: true, message: textResponse };
        } catch (textError) {
          console.error('❌ Error reading response text:', textError);
          return { success: false, error: 'Failed to parse response', fallback: true };
        }
      }
    } catch (error) {
      console.error('❌ API call failed:', error);
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error details:', {
        message: error?.message,
        name: error?.name,
        stack: error?.stack
      });
      
      // Extract meaningful error message
      let errorMessage = 'An unknown API error occurred.';
      if (error && error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        try {
          errorMessage = JSON.stringify(error);
        } catch (stringifyError) {
          console.error('❌ Error stringifying error object:', stringifyError);
          errorMessage = 'An unknown API error occurred.';
        }
      }
      
      // Return a fallback response instead of throwing
      return { 
        success: false, 
        error: errorMessage,
        fallback: true 
      };
    }
  };

  const value = {
    currentPage,
    setCurrentPage,
    navigateTo,
    user,
    setUser,
    updateUserAvatar,
    updateUserProfile,
    isConnectedToClio,
    setIsConnectedToClio,
    updateClioConnection,
    refreshClioConnectionStatus,
    workHistory,
    setWorkHistory,
    updateWorkHistory,
    aiPreferences,
    setAiPreferences,
    updateAiPreferences,
    billableLogging,
    setBillableLogging,
    updateBillableLogging,
    twoFactorAuth,
    setTwoFactorAuth,
    updateTwoFactorAuth,
    hasCompletedOnboarding,
    setHasCompletedOnboarding,
    completeOnboarding,
    isLoading,
    isAuthenticatedUser,
    login,
    register,
    logout,
    updateFormData,
    formData,
    setFormData,
    authMode,
    setAuthMode,
    onboardingError,
    setOnboardingError,
    apiCall,
    debugStorageStatus,
    geminiService
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}; 