import React, { useState, useEffect } from 'react';

const WorkHistoryComponent = () => {
  const [localWorkHistory, setLocalWorkHistory] = useState({
    emailLogs: 0,
    timeSpent: '0 mins',
    summaries: 0
  });

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

  const loadWorkHistory = () => {
    try {
      // Load work history from localStorage only (no chrome.storage to prevent context invalidation)
      const storedSummaries = safeLocalStorageGet('billableai_summaries', []);
      const storedWorkHistory = safeLocalStorageGet('billableai_workHistory', {});
      
      setLocalWorkHistory({
        emailLogs: storedSummaries.length,
        timeSpent: storedWorkHistory.timeSpent || '0 mins',
        summaries: storedWorkHistory.summaries || 0
      });
    } catch (error) {
      console.error('Error loading work history:', error);
    }
  };

  // Load work history from chrome.storage
  useEffect(() => {
    loadWorkHistory();
    
    // Set up periodic refresh
    const interval = setInterval(loadWorkHistory, 2000);
    
    return () => clearInterval(interval);
  }, []);

  return (
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
  );
};

export default WorkHistoryComponent; 