import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import EmailComposer from '../components/EmailComposer';
import EmailAnalysis from '../components/EmailAnalysis';
import TimerIcon from '../icons/TimerIcon';

const EmailTracking = () => {
  const { setCurrentPage } = useAppContext();
  const [showComposer, setShowComposer] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [recentEmails, setRecentEmails] = useState([]);

  const handleSendEmail = (result) => {
    // Add to recent emails
    setRecentEmails(prev => [{
      id: Date.now(),
      to: result.emailData?.to || 'Unknown',
      subject: result.emailData?.subject || 'No Subject',
      timeSpent: result.timeSpent,
      hours: (result.timeSpent / 3600).toFixed(2),
      timestamp: new Date().toISOString(),
      billingSummary: result.billingSummary
    }, ...prev.slice(0, 4)]); // Keep only last 5 emails
    
    setShowComposer(false);
  };

  const handleCancel = () => {
    setShowComposer(false);
  };

  const handleShowAnalysis = () => {
    setShowAnalysis(true);
  };

  const handleHideAnalysis = () => {
    setShowAnalysis(false);
  };

  const formatTime = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <TimerIcon className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">Email Tracking</h1>
          </div>
          <button
            onClick={() => setCurrentPage('popup')}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← Back
          </button>
        </div>

        {!showComposer && !showAnalysis ? (
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setShowComposer(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <TimerIcon className="w-5 h-5" />
                  <span>Start New Email</span>
                </button>
                <button
                  onClick={handleShowAnalysis}
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <span>📊</span>
                  <span>Email Analysis</span>
                </button>
                <button
                  onClick={() => setCurrentPage('assistant')}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <span>🤖</span>
                  <span>AI Assistant</span>
                </button>
              </div>
            </div>

            {/* Recent Emails */}
            {recentEmails.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Recent Emails
                </h2>
                <div className="space-y-3">
                  {recentEmails.map((email) => (
                    <div
                      key={email.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-gray-800">
                              {email.to}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(email.timestamp)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 mb-2">
                            {email.subject}
                          </div>
                          {email.billingSummary && (
                            <div className="text-xs text-gray-500">
                              <span className="font-medium">Activity:</span> {email.billingSummary.metadata.activityType}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1 bg-blue-50 px-2 py-1 rounded">
                            <TimerIcon className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-600">
                              {formatTime(email.timeSpent)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <TimerIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-800">
                      {recentEmails.length}
                    </div>
                    <div className="text-sm text-gray-600">Emails Tracked</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 p-3 rounded-full">
                    <span className="text-2xl">⏱️</span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-800">
                      {recentEmails.reduce((total, email) => total + email.timeSpent, 0) / 1000 / 60 / 60 > 1 
                        ? `${(recentEmails.reduce((total, email) => total + email.timeSpent, 0) / 1000 / 60 / 60).toFixed(1)}h`
                        : `${(recentEmails.reduce((total, email) => total + email.timeSpent, 0) / 1000 / 60).toFixed(0)}m`
                      }
                    </div>
                    <div className="text-sm text-gray-600">Total Time</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <span className="text-2xl">💰</span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-800">
                      {recentEmails.length > 0 ? recentEmails.length : 0}
                    </div>
                    <div className="text-sm text-gray-600">Time Entries</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : showComposer ? (
          <EmailComposer
            onSend={handleSendEmail}
            onCancel={handleCancel}
          />
        ) : showAnalysis ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Email Analysis</h2>
              <button
                onClick={handleHideAnalysis}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                ← Back
              </button>
            </div>
            <EmailAnalysis />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default EmailTracking; 