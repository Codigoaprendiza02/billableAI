import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';

const WorkHistoryComponent = () => {
  const { apiCall, user, isAuthenticatedUser } = useAppContext();
  const [localWorkHistory, setLocalWorkHistory] = useState({
    emailLogs: 0,
    timeSpent: '0 mins',
    summaries: 0,
    totalBillableTime: 0,
    weeklyTimeSpent: 0,
    monthlyTimeSpent: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Safe localStorage wrapper function
  const safeLocalStorageGet = (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('🎯 BillableAI: localStorage error:', error);
      return defaultValue;
    }
  };

  // Load work history from backend database
  const loadWorkHistoryFromBackend = useCallback(async () => {
    if (!isAuthenticatedUser) {
      return;
    }

    try {
      setIsLoading(true);
      console.log('🎯 WorkHistory: Loading from backend...');
      
      // Get user profile with work history
      const response = await apiCall('/api/auth/profile');
      
      if (response.success && response.user.workHistory) {
        const backendHistory = response.user.workHistory;
        console.log('🎯 WorkHistory: Backend data received:', backendHistory);
        
        setLocalWorkHistory({
          emailLogs: backendHistory.emailLogs || 0,
          timeSpent: backendHistory.timeSpent || '0 mins',
          summaries: backendHistory.summaries || 0,
          totalBillableTime: backendHistory.totalBillableTime || 0,
          weeklyTimeSpent: backendHistory.weeklyTimeSpent || 0,
          monthlyTimeSpent: backendHistory.monthlyTimeSpent || 0
        });
        
        setLastSyncTime(new Date());
        console.log('🎯 WorkHistory: Successfully loaded from backend');
      }
    } catch (error) {
      console.error('🎯 WorkHistory: Error loading from backend:', error);
      // Fallback to local storage
      loadWorkHistoryFromLocal();
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticatedUser, apiCall]);

  // Load work history from local storage (fallback)
  const loadWorkHistoryFromLocal = useCallback(() => {
    try {
      console.log('🎯 WorkHistory: Loading from localStorage...');
      
      // Load work history from localStorage as fallback
      const storedSummaries = safeLocalStorageGet('billableai_summaries', []);
      const storedWorkHistory = safeLocalStorageGet('billableai_workHistory', {});
      
      setLocalWorkHistory({
        emailLogs: storedSummaries.length,
        timeSpent: storedWorkHistory.timeSpent || '0 mins',
        summaries: storedWorkHistory.summaries || 0,
        totalBillableTime: storedWorkHistory.totalBillableTime || 0,
        weeklyTimeSpent: storedWorkHistory.weeklyTimeSpent || 0,
        monthlyTimeSpent: storedWorkHistory.monthlyTimeSpent || 0
      });
      
      console.log('🎯 WorkHistory: Loaded from localStorage');
    } catch (error) {
      console.error('Error loading work history from localStorage:', error);
    }
  }, []);

  // Update work history in backend
  const updateWorkHistoryInBackend = useCallback(async (updates) => {
    if (!isAuthenticatedUser) {
      return false;
    }

    try {
      console.log('🎯 WorkHistory: Updating backend with:', updates);
      
      const response = await apiCall('/api/auth/profile', {
        method: 'PUT',
        body: {
          workHistory: {
            ...localWorkHistory,
            ...updates
          }
        }
      });
      
      if (response.success) {
        console.log('🎯 WorkHistory: Backend updated successfully');
        setLastSyncTime(new Date());
        return true;
      } else {
        console.error('🎯 WorkHistory: Backend update failed:', response.error);
        return false;
      }
    } catch (error) {
      console.error('🎯 WorkHistory: Error updating backend:', error);
      return false;
    }
  }, [isAuthenticatedUser, apiCall, localWorkHistory]);

  // Handle summary confirmation (called when user clicks "I confirm")
  const handleSummaryConfirmation = useCallback(async (summaryData) => {
    try {
      console.log('🎯 WorkHistory: Handling summary confirmation:', summaryData);
      
      // Calculate new values
      const newSummaryCount = localWorkHistory.summaries + 1;
      const newEmailLogCount = localWorkHistory.emailLogs + 1;
      
      // Parse time spent and add to totals
      let additionalMinutes = 0;
      if (summaryData.timeSpent) {
        // Convert time spent to minutes
        if (typeof summaryData.timeSpent === 'number') {
          additionalMinutes = Math.round(summaryData.timeSpent / 60); // Convert seconds to minutes
        } else if (typeof summaryData.timeSpent === 'string') {
          const timeMatch = summaryData.timeSpent.match(/(\d+)/);
          if (timeMatch) {
            additionalMinutes = parseInt(timeMatch[1]);
            if (summaryData.timeSpent.includes('hr') || summaryData.timeSpent.includes('hour')) {
              additionalMinutes *= 60; // Convert hours to minutes
            }
          }
        }
      }
      
      const newTotalBillableTime = localWorkHistory.totalBillableTime + additionalMinutes;
      const newWeeklyTime = localWorkHistory.weeklyTimeSpent + additionalMinutes;
      const newMonthlyTime = localWorkHistory.monthlyTimeSpent + additionalMinutes;
      
      // Format total time display
      let timeDisplay;
      if (newTotalBillableTime >= 60) {
        const hours = Math.floor(newTotalBillableTime / 60);
        const minutes = newTotalBillableTime % 60;
        timeDisplay = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
      } else {
        timeDisplay = `${newTotalBillableTime}m`;
      }
      
      const updates = {
        emailLogs: newEmailLogCount,
        summaries: newSummaryCount,
        totalBillableTime: newTotalBillableTime,
        weeklyTimeSpent: newWeeklyTime,
        monthlyTimeSpent: newMonthlyTime,
        timeSpent: timeDisplay
      };
      
      // Update local state immediately for responsive UI
      setLocalWorkHistory(prev => ({
        ...prev,
        ...updates
      }));
      
      // Update localStorage for persistence
      const updatedLocalHistory = { ...localWorkHistory, ...updates };
      localStorage.setItem('billableai_workHistory', JSON.stringify(updatedLocalHistory));
      
      // Update backend database
      const backendSuccess = await updateWorkHistoryInBackend(updates);
      
      if (backendSuccess) {
        console.log('🎯 WorkHistory: Summary confirmation processed successfully');
        
        // Store the confirmed summary
        const summaries = safeLocalStorageGet('billableai_summaries', []);
        summaries.push({
          ...summaryData,
          confirmedAt: new Date().toISOString(),
          id: `summary_${Date.now()}`
        });
        localStorage.setItem('billableai_summaries', JSON.stringify(summaries));
        
        return true;
      } else {
        console.error('🎯 WorkHistory: Failed to update backend, reverting local changes');
        // Revert local changes if backend update failed
        setLocalWorkHistory(prev => ({
          ...prev,
          emailLogs: prev.emailLogs - 1,
          summaries: prev.summaries - 1,
          totalBillableTime: prev.totalBillableTime - additionalMinutes,
          weeklyTimeSpent: prev.weeklyTimeSpent - additionalMinutes,
          monthlyTimeSpent: prev.monthlyTimeSpent - additionalMinutes
        }));
        return false;
      }
    } catch (error) {
      console.error('🎯 WorkHistory: Error handling summary confirmation:', error);
      return false;
    }
  }, [localWorkHistory, updateWorkHistoryInBackend]);

  // Sync local storage with backend periodically
  const syncWithBackend = useCallback(async () => {
    if (!isAuthenticatedUser || isLoading) {
      return;
    }

    try {
      // Get local summaries that might not be synced
      const localSummaries = safeLocalStorageGet('billableai_summaries', []);
      const localHistory = safeLocalStorageGet('billableai_workHistory', {});
      
      // If local data is newer than last sync, update backend
      if (localSummaries.length > localWorkHistory.summaries || 
          (localHistory.totalBillableTime || 0) > localWorkHistory.totalBillableTime) {
        
        console.log('🎯 WorkHistory: Local data is newer, syncing to backend...');
        await updateWorkHistoryInBackend({
          summaries: localSummaries.length,
          emailLogs: localSummaries.length,
          totalBillableTime: localHistory.totalBillableTime || 0,
          timeSpent: localHistory.timeSpent || '0 mins'
        });
      }
      
      // Always load fresh data from backend to get latest updates
      await loadWorkHistoryFromBackend();
    } catch (error) {
      console.error('🎯 WorkHistory: Error during sync:', error);
    }
  }, [isAuthenticatedUser, isLoading, localWorkHistory, updateWorkHistoryInBackend, loadWorkHistoryFromBackend]);

  // Listen for summary confirmation events
  useEffect(() => {
    const handleSummaryConfirmed = (event) => {
      if (event.detail && event.detail.summaryData) {
        console.log('🎯 WorkHistory: Received summary confirmation event:', event.detail);
        handleSummaryConfirmation(event.detail.summaryData);
      }
    };

    // Listen for custom events from other components
    window.addEventListener('billableai-summary-confirmed', handleSummaryConfirmed);
    
    return () => {
      window.removeEventListener('billableai-summary-confirmed', handleSummaryConfirmed);
    };
  }, [handleSummaryConfirmation]);

  // Expose confirmation handler globally for other components
  useEffect(() => {
    window.billableAI = window.billableAI || {};
    window.billableAI.confirmSummary = handleSummaryConfirmation;
    
    return () => {
      if (window.billableAI) {
        delete window.billableAI.confirmSummary;
      }
    };
  }, [handleSummaryConfirmation]);

  // Initial load
  useEffect(() => {
    if (isAuthenticatedUser) {
      loadWorkHistoryFromBackend();
    } else {
      loadWorkHistoryFromLocal();
    }
  }, [isAuthenticatedUser, loadWorkHistoryFromBackend, loadWorkHistoryFromLocal]);

  // Periodic sync with backend
  useEffect(() => {
    if (isAuthenticatedUser) {
      const syncInterval = setInterval(syncWithBackend, 30000); // Sync every 30 seconds
      return () => clearInterval(syncInterval);
    }
  }, [isAuthenticatedUser, syncWithBackend]);

  // Manual refresh handler
  const handleRefresh = useCallback(async () => {
    if (isAuthenticatedUser) {
      await loadWorkHistoryFromBackend();
    } else {
      loadWorkHistoryFromLocal();
    }
  }, [isAuthenticatedUser, loadWorkHistoryFromBackend, loadWorkHistoryFromLocal]);

  return (
    <div className="relative">
      {/* Refresh button */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Work History</h3>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className={`p-2 rounded-lg transition-colors ${
            isLoading 
              ? 'bg-gray-600 cursor-not-allowed' 
              : 'bg-white/10 hover:bg-white/20'
          }`}
          title="Refresh work history"
        >
          <svg 
            className={`w-4 h-4 text-white ${isLoading ? 'animate-spin' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
            />
          </svg>
        </button>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center z-10">
          <div className="flex items-center gap-2 text-white">
            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-sm">Syncing...</span>
          </div>
        </div>
      )}

      {/* Work history grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* Email Logs */}
        <div className="glass-card dotted-border p-4 text-center">
          <div className="text-white text-2xl font-bold mb-1">{localWorkHistory.emailLogs}</div>
          <div className="text-white text-sm">Email Logs</div>
        </div>

        {/* Time Spent */}
        <div className="glass-card dotted-border p-4 text-center">
          <div className="text-white text-2xl font-bold mb-1">{localWorkHistory.timeSpent}</div>
          <div className="text-white text-sm">Time spent</div>
        </div>

        {/* Summaries */}
        <div className="glass-card dotted-border p-4 text-center">
          <div className="text-white text-2xl font-bold mb-1">{localWorkHistory.summaries}</div>
          <div className="text-white text-sm">Summaries</div>
        </div>
      </div>

      {/* Sync status */}
      {lastSyncTime && (
        <div className="text-xs text-white/60 mt-2 text-center">
          Last synced: {lastSyncTime.toLocaleTimeString()}
        </div>
      )}

      {/* Offline indicator */}
      {!isAuthenticatedUser && (
        <div className="text-xs text-yellow-400 mt-2 text-center">
          📱 Offline mode - Data stored locally
        </div>
      )}
    </div>
  );
};

export default WorkHistoryComponent; 