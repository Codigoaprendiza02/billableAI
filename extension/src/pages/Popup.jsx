import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import WorkHistoryComponent from '../components/WorkHistoryComponent';
import GreetingComponent from '../components/GreetingComponent';

const Popup = () => {
<<<<<<< HEAD
  const { navigateTo, user, isConnectedToClio, updateClioConnection, refreshClioConnectionStatus } = useAppContext();
=======
  const { navigateTo, user, isConnectedToClio } = useAppContext();
>>>>>>> 5189f8f (updations)
  const [workHistory, setWorkHistory] = useState({
    emailLogs: 0,
    timeSpent: '0 mins',
    summaries: 0
  });
  const [trackingStatus, setTrackingStatus] = useState({
    isTracking: false,
    currentTime: 0,
    isPaused: false
  });
  const [currentEmail, setCurrentEmail] = useState({
    to: '',
    subject: '',
    content: ''
  });

  // Safe localStorage wrapper functions
  const safeLocalStorageGet = (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('🎯 BillableAI: localStorage error:', error);
      return defaultValue;
    }
  };

  // Load user data and work history
  useEffect(() => {
    const loadData = () => {
      try {
        // Load work history from localStorage only (no chrome.storage to prevent context invalidation)
        const storedSummaries = safeLocalStorageGet('billableai_summaries', []);
        const storedWorkHistory = safeLocalStorageGet('billableai_workHistory', {});
        
        setWorkHistory({
          emailLogs: storedSummaries.length,
          timeSpent: storedWorkHistory.timeSpent || '0 mins',
          summaries: storedWorkHistory.summaries || 0
        });
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
    
    // Set up periodic refresh
    const interval = setInterval(loadData, 2000);
    
    return () => clearInterval(interval);
  }, []);

<<<<<<< HEAD
  // Auto-refresh Clio connection status when popup opens
  useEffect(() => {
    const refreshConnectionStatus = async () => {
      try {
        console.log('🔄 Auto-refreshing Clio connection status on popup open...');
        await refreshClioConnectionStatus();
      } catch (error) {
        console.error('❌ Error auto-refreshing Clio status:', error);
      }
    };

    refreshConnectionStatus();
  }, [refreshClioConnectionStatus]);
=======

>>>>>>> 5189f8f (updations)

  // Timer effect to update tracking status
  useEffect(() => {
    const updateTimer = () => {
      // Get tracking status from localStorage only (no chrome.storage to prevent context invalidation)
      try {
        const status = safeLocalStorageGet('billableai_trackingStatus');
        if (status) {
          setTrackingStatus({
            isTracking: status.isTracking || false,
            currentTime: status.currentTime || 0,
            isPaused: status.isPaused || false
          });
        }

        // Get current email data
        const currentEmailData = safeLocalStorageGet('billableai_currentEmail');
        if (currentEmailData) {
          setCurrentEmail(currentEmailData);
        }
      } catch (error) {
        console.error('🎯 BillableAI: Error updating timer:', error);
      }
    };

    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000); // Update every second for real-time timer
    
    return () => clearInterval(timerInterval);
  }, []);

  const formatTime = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    } else if (minutes > 0) {
      return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
    } else {
      return `0:${String(seconds).padStart(2, '0')}`;
    }
  };

  const getGreetingMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

<<<<<<< HEAD
  const handleConnectClio = async () => {
    try {
      if (!isConnectedToClio) {
        // Show loading state
        showNotification('Connecting to Clio...', 'info');
        
        await updateClioConnection(true);
        
        // The OAuth flow will be handled by the context
        // Connection status will be updated when OAuth completes
      } else {
        // Disconnect from Clio
        await updateClioConnection(false);
        showNotification('Disconnected from Clio', 'success');
      }
    } catch (error) {
      console.error('Clio connection error:', error);
      showNotification(error.message || 'Failed to connect to Clio', 'error');
    }
  };

  // Refresh Clio connection status
  const refreshClioStatus = async () => {
    try {
      console.log('🔄 Refreshing Clio connection status...');
      
      const connectionStatus = await refreshClioConnectionStatus();
      console.log('🔄 Updated Clio connection status:', connectionStatus);
      
      if (connectionStatus.isConnected) {
        showNotification('Clio connection confirmed!', 'success');
      } else {
        showNotification('Not connected to Clio', 'warning');
      }
    } catch (error) {
      console.error('❌ Error refreshing Clio status:', error);
      showNotification('Failed to refresh Clio status', 'error');
    }
  };

  // Clear Clio connection for testing
  const clearClioConnection = async () => {
    try {
      console.log('🧹 Clearing Clio connection...');
      
      const { clearTestConnections } = await import('../services/oauthService.js');
      const result = await clearTestConnections();
      
      if (result.success) {
        showNotification('Connection cleared!', 'success');
        // Refresh the connection status
        await refreshClioStatus();
      } else {
        showNotification('Failed to clear connection', 'error');
      }
    } catch (error) {
      console.error('❌ Error clearing Clio connection:', error);
      showNotification('Clear failed', 'error');
    }
  };
=======

>>>>>>> 5189f8f (updations)

  // Handle one-click billing
  const handleOneClickBilling = async () => {
    try {
      // Send message to content script to trigger one-click billing
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url && tab.url.includes('mail.google.com')) {
          await chrome.tabs.sendMessage(tab.id, { type: 'ONE_CLICK_BILLING' });
          showNotification('One-click billing initiated!', 'success');
        } else {
          showNotification('Please open Gmail to use one-click billing', 'warning');
        }
      }
    } catch (error) {
      console.error('One-click billing error:', error);
      showNotification('One-click billing failed', 'error');
    }
  };

  // Show notification
  const showNotification = (message, type = 'info') => {
    // This would be handled by the content script
    console.log('🎯 BillableAI: Notification:', message, type);
  };

  // User profile avatar with cat image - using global state context
  const profileAvatar = (
    <div className="w-20 h-20 rounded-full bg-white border-2 border-dotted border-white/30 flex items-center justify-center shadow-lg overflow-hidden">
      <img 
        src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRkZGRkZGIi8+CjxwYXRoIGQ9Ik0yMCAyNEMyMCAyMi44OTU0IDIwLjg5NTQgMjIgMjIgMjJIMzJDMzMuMTA0NiAyMiAzNCAyMi44OTU0IDM0IDI0VjQwQzM0IDQxLjEwNDYgMzMuMTA0NiA0MiAzMiA0MkgyMkMyMC44OTU0IDQyIDIwIDQxLjEwNDYgMjAgNDBWMjRaIiBmaWxsPSIjRkZGRkZGIi8+CjxwYXRoIGQ9Ik0xOCAyNkMxOCAyNC44OTU0IDE4Ljg5NTQgMjQgMjAgMjRIMjJDMjMuMTA0NiAyNCAyNCAyNC44OTU0IDI0IDI2VjM4QzI0IDM5LjEwNDYgMjMuMTA0NiA0MCAyMiA0MEgyMEMxOC44OTU0IDQwIDE4IDM5LjEwNDYgMTggMzhWMjZaIiBmaWxsPSIjRkZGRkZGIi8+CjxwYXRoIGQ9Ik0yOCAyNkMyOCAyNC44OTU0IDI4Ljg5NTQgMjQgMzAgMjRIMzJDMzMuMTA0NiAyNCAzNCAyNC44OTU0IDM0IDI2VjM4QzM0IDM5LjEwNDYgMzMuMTA0NiA0MCAzMiA0MEgzMEMyOC44OTU0IDQwIDI4IDM5LjEwNDYgMjggMzhWMjRaIiBmaWxsPSIjRkZGRkZGIi8+CjxwYXRoIGQ9Ik0yMiAzMkMyMiAzMC44OTU0IDIyLjg5NTQgMzAgMjQgMzBIMzBWMzRIMjRDMjIuODk1NCAzNCAyMiAzMy4xMDQ2IDIyIDMyWiIgZmlsbD0iI0ZGRkZGRiIvPgo8cGF0aCBkPSJNMjYgMzZDMjYgMzQuODk1NCAyNi44OTU0IDM0IDI4IDM0SDM2QzM3LjEwNDYgMzQgMzggMzQuODk1NCAzOCAzNlY0MEMzOCA0MS4xMDQ2IDM3LjEwNDYgNDIgMzYgNDJIMjhDMjYuODk1NCA0MiAyNiA0MS4xMDQ2IDI2IDQwVjM2WiIgZmlsbD0iI0ZGRkZGRiIvPgo8Y2lyY2xlIGN4PSIyOCIgY3k9IjI4IiByPSIyIiBmaWxsPSIjMDAwIi8+CjxjaXJjbGUgY3g9IjM2IiBjeT0iMjgiIHI9IjIiIGZpbGw9IiMwMDAiLz4KPHBhdGggZD0iTTMwIDM0QzMwIDMyLjg5NTQgMzAuODk1NCAzMiAzMiAzMkMzMy4xMDQ2IDMyIDM0IDMyLjg5NTQgMzQgMzRWMzZDMzQgMzcuMTA0NiAzMy4xMDQ2IDM4IDMyIDM4QzMwLjg5NTQgMzggMzAgMzcuMTA0NiAzMCAzNlYzNFoiIGZpbGw9IiMwMDAiLz4KPC9zdmc+" 
        alt="Cat Avatar" 
        className="w-16 h-16 rounded-full object-cover"
      />
    </div>
  );

  return (
    <div className="w-96 h-[600px] bg-gradient-to-br from-black via-blue-900 to-purple-600 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/20">
        <div className="flex items-center space-x-2">
          {/* Real-time Timer on Top Left */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${trackingStatus.isTracking ? 'bg-green-400 animate-pulse' : trackingStatus.isPaused ? 'bg-yellow-400' : 'bg-gray-400'}`}></div>
            <span className="text-white text-sm font-mono">
              {formatTime(trackingStatus.currentTime)}
            </span>
            {trackingStatus.isTracking && (
              <span className="text-green-400 text-xs">LIVE</span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
<<<<<<< HEAD
          {/* Refresh Clio Status Button */}
          <button
            onClick={refreshClioStatus}
            className="w-8 h-8 rounded-full bg-transparent border border-white/30 flex items-center justify-center hover:bg-white/10 hover:scale-105 transition-all duration-200"
            title="Refresh Clio Status"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          
          {/* Connect to Clio Button */}
          <button
            onClick={handleConnectClio}
            className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all duration-200 hover:scale-105 flex items-center space-x-1 ${
              isConnectedToClio
                ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg'
                : 'bg-white text-black hover:bg-gray-100 shadow-lg'
            }`}
          >
            {/* Connection Status Indicator */}
            <div className={`w-2 h-2 rounded-full ${
              isConnectedToClio ? 'bg-white' : 'bg-gray-400'
            }`}></div>
            <span>{isConnectedToClio ? 'Clio ✓' : 'Connect to Clio'}</span>
          </button>
=======

>>>>>>> 5189f8f (updations)
          
          {/* Settings Button */}
          <button
            onClick={() => navigateTo('settings')}
            className="w-8 h-8 rounded-full bg-transparent border border-white/30 flex items-center justify-center hover:bg-white/10 hover:scale-105 transition-all duration-200"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Left Section - Greeting Component with Left Spacing */}
        <div className="mb-8 pl-6">
          <GreetingComponent />
        </div>

        {/* Current Email Info (if tracking) */}
        {trackingStatus.isTracking && currentEmail.subject && (
          <div className="px-6 mb-4">
            <div className="bg-white/10 border border-white/20 rounded-lg p-3">
              <div className="text-white text-xs font-medium mb-1">Currently Tracking:</div>
              <div className="text-white/80 text-xs truncate">{currentEmail.subject}</div>
              <div className="text-white/60 text-xs truncate">To: {currentEmail.to}</div>
            </div>
          </div>
        )}

        {/* Start Generating Button - Reduced Size */}
        <div className="text-center px-6">
          <button
            onClick={() => navigateTo('assistant')}
            className="w-3/4 bg-white text-black py-3 px-6 rounded-lg font-bold text-base hover:bg-gray-100 transition-colors shadow-lg"
          >
            Start Generating
          </button>
        </div>

        {/* One-Click Billing Button (if connected to Clio) */}
        {isConnectedToClio && trackingStatus.isTracking && (
          <div className="text-center px-6 mt-3">
            <button
              onClick={handleOneClickBilling}
              className="w-3/4 bg-green-600 text-white py-2 px-4 rounded-lg font-semibold text-sm hover:bg-green-700 transition-colors shadow-lg"
            >
              💰 One-Click Billing
            </button>
          </div>
        )}

<<<<<<< HEAD
        {/* Clio Connection Section */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold text-sm">Clio Integration</h3>
            <div className="flex items-center space-x-2">
              {/* Refresh Clio Status Button */}
              <button
                onClick={refreshClioStatus}
                className="w-8 h-8 rounded-full bg-transparent border border-white/30 flex items-center justify-center hover:bg-white/10 hover:scale-105 transition-all duration-200"
                title="Refresh Clio Status"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              
              {/* Clear Clio Connection Button */}
              <button
                onClick={clearClioConnection}
                className="px-3 py-1.5 rounded-lg bg-red-500 text-white font-semibold text-xs hover:bg-red-400 transition-all duration-200"
                title="Clear Clio Connection"
              >
                Clear
              </button>
            </div>
          </div>
          
          <button
            onClick={handleConnectClio}
            className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all duration-200 hover:scale-105 flex items-center space-x-1 ${
              isConnectedToClio
                ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg'
                : 'bg-white text-black hover:bg-gray-100 shadow-lg'
            }`}
          >
            {/* Connection Status Indicator */}
            <div className={`w-2 h-2 rounded-full ${
              isConnectedToClio ? 'bg-white' : 'bg-gray-400'
            }`}></div>
            <span>{isConnectedToClio ? 'Clio ✓' : 'Connect to Clio'}</span>
          </button>
        </div>
=======

>>>>>>> 5189f8f (updations)

        {/* Work History Stats with Spacing */}
        <div className="mt-auto px-6 pb-6">
          <WorkHistoryComponent />
        </div>
      </div>
    </div>
  );
};

export default Popup; 