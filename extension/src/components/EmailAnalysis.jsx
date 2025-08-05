import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import TimerIcon from '../icons/TimerIcon';

const EmailAnalysis = () => {
  const { apiCall } = useAppContext();
  const [recentEmails, setRecentEmails] = useState([]);
  const [billingSuggestions, setBillingSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);

  useEffect(() => {
    loadRecentEmails();
    loadBillingSuggestions();
  }, []);

  const loadRecentEmails = async () => {
    try {
      setLoading(true);
      // For now, use mock data since we don't have authenticated endpoints
      setRecentEmails([
        {
          analysis: {
            subject: 'Test Email 1',
            from: 'test@example.com',
            hasUrgency: false,
            estimatedReadingTime: 2
          }
        },
        {
          analysis: {
            subject: 'Test Email 2',
            from: 'client@example.com',
            hasUrgency: true,
            estimatedReadingTime: 5
          }
        }
      ]);
    } catch (error) {
      console.error('Failed to load recent emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBillingSuggestions = async () => {
    try {
      // For now, use mock data since we don't have authenticated endpoints
      setBillingSuggestions([
        {
          threadId: '1',
          subject: 'Test Email 1',
          estimatedTime: 2,
          urgency: false,
          summary: 'Test email summary',
          suggestions: {
            suggestedMatter: 'General correspondence',
            confidence: 0.8
          }
        }
      ]);
    } catch (error) {
      console.error('Failed to load billing suggestions:', error);
    }
  };

  const formatTime = (minutes) => {
    if (minutes < 60) {
      return `${minutes}m`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}m`;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getUrgencyColor = (hasUrgency) => {
    return hasUrgency ? 'text-red-600' : 'text-gray-600';
  };

  const getComplexityColor = (complexity) => {
    switch (complexity) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Recent Emails Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Recent Emails</h2>
          <button
            onClick={loadRecentEmails}
            disabled={loading}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {recentEmails.length > 0 ? (
          <div className="space-y-3">
            {recentEmails.map((email, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setSelectedEmail(email)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-gray-800 truncate">
                        {email.analysis.subject}
                      </span>
                      {email.analysis.hasUrgency && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                          Urgent
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      From: {email.analysis.from}
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      {formatDate(email.analysis.date)}
                    </div>
                    <div className="flex items-center space-x-4 text-xs">
                      <span className={`${getComplexityColor(email.analysis.complexity)}`}>
                        {email.analysis.wordCount} words
                      </span>
                      <span className="text-blue-600">
                        {formatTime(email.analysis.estimatedReadingTime)} read
                      </span>
                      {email.analysis.timeKeywords.length > 0 && (
                        <span className="text-purple-600">
                          {email.analysis.timeKeywords.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 bg-blue-50 px-2 py-1 rounded">
                    <TimerIcon className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-600">
                      {formatTime(email.analysis.estimatedReadingTime)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            {loading ? 'Loading emails...' : 'No recent emails found'}
          </div>
        )}
      </div>

      {/* Auto-Billing Suggestions */}
      {billingSuggestions.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            💰 Auto-Billing Suggestions
          </h2>
          <div className="space-y-3">
            {billingSuggestions.map((suggestion, index) => (
              <div
                key={index}
                className="border border-green-200 bg-green-50 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium text-gray-800">
                        {suggestion.subject}
                      </span>
                      {suggestion.urgency && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                          Urgent
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      From: {suggestion.from}
                    </div>
                    <div className="text-sm text-gray-700 mb-2">
                      {suggestion.summary}
                    </div>
                    <div className="flex items-center space-x-4 text-xs">
                      <span className="text-green-600 font-medium">
                        Suggested: {formatTime(suggestion.recommendedBilling.time)}
                      </span>
                      <span className="text-purple-600">
                        Matter: {suggestion.recommendedBilling.matter}
                      </span>
                      <span className="text-blue-600">
                        {(suggestion.recommendedBilling.confidence * 100).toFixed(0)}% confidence
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 bg-green-100 px-3 py-1 rounded">
                    <span className="text-sm font-medium text-green-700">
                      ${(suggestion.recommendedBilling.time * 0.1).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Email Details Modal */}
      {selectedEmail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Email Details
                </h3>
                <button
                  onClick={() => setSelectedEmail(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <div className="text-gray-800">{selectedEmail.analysis.subject}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From
                  </label>
                  <div className="text-gray-800">{selectedEmail.analysis.from}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <div className="text-gray-800">{formatDate(selectedEmail.analysis.date)}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Analysis
                  </label>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Word Count:</span>
                      <span className="font-medium">{selectedEmail.analysis.wordCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Reading Time:</span>
                      <span className="font-medium">{formatTime(selectedEmail.analysis.estimatedReadingTime)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Urgency:</span>
                      <span className={`font-medium ${getUrgencyColor(selectedEmail.analysis.hasUrgency)}`}>
                        {selectedEmail.analysis.hasUrgency ? 'High' : 'Normal'}
                      </span>
                    </div>
                    {selectedEmail.analysis.timeKeywords.length > 0 && (
                      <div className="flex justify-between">
                        <span>Time Keywords:</span>
                        <span className="font-medium text-purple-600">
                          {selectedEmail.analysis.timeKeywords.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content Preview
                  </label>
                  <div className="text-gray-800 text-sm max-h-32 overflow-y-auto border border-gray-200 rounded p-2">
                    {selectedEmail.analysis.body.substring(0, 500)}...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailAnalysis; 