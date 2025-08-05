import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import TimerIcon from '../icons/TimerIcon';

const EmailComposer = ({ onSend, onCancel }) => {
  const { apiCall } = useAppContext();
  const [emailData, setEmailData] = useState({
    to: '',
    subject: '',
    content: ''
  });
  const [sessionId, setSessionId] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [billingSummary, setBillingSummary] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  
  const activityInterval = useRef(null);
  const startTime = useRef(null);

  // Track typing activity with debouncing
  const typingTimeoutRef = useRef(null);
  const lastTypingTimeRef = useRef(null);
  const accumulatedTimeRef = useRef(0);
  const pauseTimeRef = useRef(null);

  // Handle typing activity
  useEffect(() => {
    if (emailData.content) {
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Resume tracking if paused
      if (!isTracking && accumulatedTimeRef.current > 0) {
        setIsTracking(true);
        startTime.current = Date.now() - accumulatedTimeRef.current;
      } else if (!isTracking && emailData.content.trim()) {
        // Start fresh tracking only if we have content
        startTracking();
      }

      // Update last typing time
      lastTypingTimeRef.current = Date.now();

      // Set timeout to pause tracking after 2 seconds of inactivity (but don't reset)
      typingTimeoutRef.current = setTimeout(() => {
        if (isTracking) {
          // Pause tracking but keep accumulated time
          setIsTracking(false);
          if (startTime.current) {
            accumulatedTimeRef.current = Date.now() - startTime.current;
          }
          pauseTimeRef.current = Date.now();
        }
      }, 2000); // Pause after 2 seconds of inactivity
    } else {
      // If no content, pause tracking but don't reset
      if (isTracking) {
        setIsTracking(false);
        if (startTime.current) {
          accumulatedTimeRef.current = Date.now() - startTime.current;
        }
        pauseTimeRef.current = Date.now();
      }
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [emailData.content]);

  // Update activity when typing
  useEffect(() => {
    if (isTracking && sessionId && emailData.content) {
      updateActivity();
    }
  }, [emailData.content]);

  // Real-time timer update
  useEffect(() => {
    if (isTracking && startTime.current) {
      const timer = setInterval(() => {
        const elapsed = Date.now() - startTime.current;
        setTimeSpent(elapsed);
      }, 1000); // Update every second

      return () => clearInterval(timer);
    } else if (!isTracking && accumulatedTimeRef.current > 0) {
      // Show accumulated time when paused
      setTimeSpent(accumulatedTimeRef.current);
    }
  }, [isTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (activityInterval.current) {
        clearInterval(activityInterval.current);
      }
      if (sessionId) {
        stopTracking();
      }
    };
  }, []);

  const startTracking = async () => {
    try {
      console.log('🔄 Starting tracking...');
      
      // Use fallback timer immediately to avoid delays
      setIsTracking(true);
      startTime.current = Date.now();
      
      // Ensure we have valid data for the API
      const requestData = {
        to: emailData.to || 'draft@example.com',
        subject: emailData.subject || 'Draft Email',
        content: emailData.content || ''
      };
      
      // Only make API call if we have meaningful content
      if (!emailData.content.trim()) {
        console.log('⚠️ No content to track, using fallback timer only');
        return;
      }
      
      console.log('📤 Sending data to API:', requestData);
      
      const response = await apiCall('/api/test/email-tracking/start', {
        method: 'POST',
        body: requestData
      });

      console.log('📥 Received response:', response);
      console.log('📥 Response type:', typeof response);
      console.log('📥 Response keys:', Object.keys(response || {}));

      if (response.success) {
        setSessionId(response.sessionId);
        startTime.current = response.startTime;
        
        // Start activity tracking interval
        activityInterval.current = setInterval(() => {
          updateActivity();
        }, 2000); // Update every 2 seconds
        
        console.log('✅ Email tracking started:', response.sessionId);
      } else if (response.fallback) {
        console.log('⚠️ Using fallback timer due to API response:', response);
        // Fallback timer is already started above
      } else {
        console.log('⚠️ API returned unexpected response:', response);
      }
    } catch (error) {
      console.error('❌ Failed to start tracking:', error);
      // Fallback timer is already started above
      // Don't throw error - let the fallback timer continue working
    }
  };

  const updateActivity = async () => {
    if (!sessionId) return;
    
    try {
      await apiCall('/api/test/email-tracking/activity', {
        method: 'POST',
        body: { sessionId }
      });
      
      // Update local time display
      if (startTime.current) {
        const elapsed = Date.now() - startTime.current;
        setTimeSpent(elapsed);
      }
    } catch (error) {
      console.error('❌ Failed to update activity:', error);
    }
  };

  const stopTracking = async () => {
    console.log('🛑 Stopping tracking...');
    
    // Stop local timer immediately
    setIsTracking(false);
    
    if (activityInterval.current) {
      clearInterval(activityInterval.current);
      activityInterval.current = null;
    }
    
    if (!sessionId) {
      console.log('⚠️ No session ID, stopping local timer only');
      return;
    }
    
    try {
      const response = await apiCall('/api/test/email-tracking/stop', {
        method: 'POST',
        body: {
          sessionId,
          finalContent: emailData.content
        }
      });

      if (response.success) {
        setBillingSummary(response.billingSummary);
        setTimeSpent(response.timeSpent);
        setShowSummary(true);
        console.log('✅ Email tracking stopped:', response);
      } else {
        console.log('⚠️ Stop tracking response:', response);
      }
    } catch (error) {
      console.error('❌ Failed to stop tracking:', error);
    }
  };

  const handleSend = async () => {
    setIsSending(true);
    try {
      console.log('📧 Sending email and generating GPT billing summary...');
      console.log('📊 Current sessionId:', sessionId);
      console.log('📊 Current timeSpent:', timeSpent);
      
      // Create a session ID if none exists (for immediate send without tracking)
      const currentSessionId = sessionId || `manual_${Date.now()}`;
      
      const response = await apiCall('/api/test/email-tracking/send', {
        method: 'POST',
        body: {
          sessionId: currentSessionId,
          emailData: {
            to: emailData.to,
            subject: emailData.subject,
            content: emailData.content
          }
        }
      });

      console.log('📥 Full response:', response);

      if (response.success) {
        console.log('✅ Email sent and GPT billing summary generated:', response);
        
        // Stop the timer when summary is generated
        if (isTracking) {
          console.log('🛑 Stopping timer after summary generation');
          await stopTracking();
        }
        
        // Display the GPT-generated billing summary
        if (response.billingSummary) {
          console.log('🤖 Setting billing summary:', response.billingSummary);
          setBillingSummary(response.billingSummary);
          setTimeSpent(response.timeSpent || timeSpent);
          setShowSummary(true);
          console.log('🤖 GPT Summary:', response.billingSummary.summary);
          console.log('📊 GPT Metadata:', response.billingSummary.metadata);
          console.log('💡 GPT Suggestions:', response.billingSummary.suggestions);
          
          // Add a small delay to ensure state updates are processed
          setTimeout(() => {
            console.log('✅ Summary should now be visible');
          }, 100);
        } else {
          console.log('⚠️ No billing summary in response');
          // Stop timer even if no summary (fallback)
          if (isTracking) {
            console.log('🛑 Stopping timer (fallback)');
            await stopTracking();
          }
        }
        
        // Don't call onSend immediately - let the user see the summary first
        // onSend && onSend(response);
      } else {
        console.log('⚠️ Send response:', response);
      }
    } catch (error) {
      console.error('❌ Failed to send email:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleInputChange = (field, value) => {
    setEmailData(prev => ({ ...prev, [field]: value }));
  };

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

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      {/* Header with Timer */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Compose Email</h2>
                 <div className={`flex items-center space-x-2 px-4 py-3 rounded-lg border-2 shadow-sm transition-all duration-300 ${
           isTracking 
             ? 'bg-green-100 border-green-300 shadow-md' 
             : accumulatedTimeRef.current > 0
             ? 'bg-yellow-100 border-yellow-300'
             : 'bg-gray-100 border-gray-300'
         }`}>
           <TimerIcon className={`w-6 h-6 transition-colors duration-300 ${
             isTracking ? 'text-green-700 animate-pulse' : accumulatedTimeRef.current > 0 ? 'text-yellow-600' : 'text-gray-500'
           }`} />
           <span className={`font-bold text-lg transition-colors duration-300 ${
             isTracking ? 'text-green-700' : accumulatedTimeRef.current > 0 ? 'text-yellow-600' : 'text-gray-500'
           }`}>
             {timeSpent > 0 ? formatTime(timeSpent) : '0:00'}
           </span>
           {isTracking && (
             <span className="text-xs text-green-600 font-medium">
               Recording
             </span>
           )}
           {!isTracking && accumulatedTimeRef.current > 0 && (
             <span className="text-xs text-yellow-600 font-medium">
               Paused
             </span>
           )}
         </div>
      </div>

      {/* Email Form */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            To:
          </label>
          <input
            type="email"
            value={emailData.to}
            onChange={(e) => handleInputChange('to', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="recipient@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subject:
          </label>
          <input
            type="text"
            value={emailData.subject}
            onChange={(e) => handleInputChange('subject', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="Email subject"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Content:
          </label>
          <textarea
            value={emailData.content}
            onChange={(e) => handleInputChange('content', e.target.value)}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900"
            placeholder="Write your email content here..."
          />
        </div>
      </div>

             {/* GPT-Generated Billing Summary */}
       {console.log('🔍 Debug - showSummary:', showSummary, 'billingSummary:', billingSummary)}
       
       {/* Test Summary Display */}
       <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
         <h3 className="text-lg font-semibold text-yellow-800">Debug Info:</h3>
         <div className="text-sm">
           <div>showSummary: {String(showSummary)}</div>
           <div>billingSummary exists: {String(!!billingSummary)}</div>
           {billingSummary && (
             <div>
               <div>Summary: {billingSummary.summary}</div>
               <div>Hours: {billingSummary.hours}</div>
             </div>
           )}
         </div>
       </div>
       
       {showSummary && billingSummary && (
         <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200 rounded-lg shadow-lg">
           <div className="flex items-center justify-between mb-3">
             <h3 className="text-lg font-semibold text-blue-800 flex items-center">
               🤖 GPT-Generated Billing Summary
             </h3>
             <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
               AI Powered
             </span>
           </div>
           
           {/* GPT Summary */}
           <div className="mb-4 p-3 bg-white rounded border border-blue-200">
             <div className="text-xs text-blue-600 mb-1 font-medium">GPT Summary:</div>
             <div className="text-sm text-gray-700 leading-relaxed">
               {billingSummary.summary}
             </div>
           </div>
           
           {/* Time and Activity Details */}
           <div className="grid grid-cols-2 gap-4 text-sm">
             <div className="flex justify-between">
               <span className="text-gray-600">⏱️ Time Spent:</span>
               <span className="font-medium text-blue-700">{billingSummary.hours} hours</span>
             </div>
             <div className="flex justify-between">
               <span className="text-gray-600">📝 Activity Type:</span>
               <span className="font-medium text-blue-700">{billingSummary.metadata.activityType}</span>
             </div>
             <div className="flex justify-between">
               <span className="text-gray-600">📊 Word Count:</span>
               <span className="font-medium text-blue-700">{billingSummary.metadata.wordCount} words</span>
             </div>
             <div className="flex justify-between">
               <span className="text-gray-600">📈 Sentences:</span>
               <span className="font-medium text-blue-700">{billingSummary.metadata.sentenceCount} sentences</span>
             </div>
           </div>
           
           {/* GPT Suggestions */}
           {billingSummary.suggestions && (
             <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded border border-purple-200">
               <div className="text-xs text-purple-600 mb-2 font-medium flex items-center">
                 💡 GPT Suggestions
                 <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                   {(billingSummary.suggestions.confidence * 100).toFixed(0)}% confidence
                 </span>
               </div>
               <div className="text-sm space-y-1">
                 <div><strong>🏢 Matter:</strong> {billingSummary.suggestions.suggestedMatter}</div>
                 <div><strong>📧 Client:</strong> {billingSummary.suggestions.suggestedEmails}</div>
                 <div><strong>🤖 Model:</strong> {billingSummary.suggestions.model}</div>
               </div>
             </div>
           )}
         </div>
       )}

             {/* Action Buttons */}
       <div className="flex justify-end space-x-3 mt-6">
         <button
           onClick={onCancel}
           className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
         >
           Cancel
         </button>
         
         {!showSummary ? (
           <button
             onClick={handleSend}
             disabled={isSending || !emailData.to || !emailData.subject}
             className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 shadow-lg"
           >
             {isSending ? (
               <>
                 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                 <span>Generating GPT Summary...</span>
               </>
             ) : (
               <>
                 <span>Send Email & Generate GPT Summary</span>
                 {isTracking && (
                   <span className="text-xs bg-blue-700 px-2 py-1 rounded">
                     +{formatTime(timeSpent)}
                   </span>
                 )}
               </>
             )}
           </button>
         ) : (
           <button
             onClick={() => onSend && onSend({ success: true, billingSummary })}
             className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
           >
             <span>Continue to Dashboard</span>
           </button>
         )}
       </div>
    </div>
  );
};

export default EmailComposer; 