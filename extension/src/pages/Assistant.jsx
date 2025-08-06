import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import SendIcon from '../icons/SendIcon';
import GenerateIcon from '../icons/GenerateIcon';

const Assistant = () => {
  const { 
    geminiService, 
    isConnectedToClio, 
    assistantContext,
    addAssistantMessage,
    updateLastUsedEmail,
    clearAssistantHistory
  } = useAppContext();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [modelStatus, setModelStatus] = useState('checking');
  const messagesEndRef = useRef(null);
  const [currentEmailData, setCurrentEmailData] = useState(null);
  const [currentTimeSpent, setCurrentTimeSpent] = useState(0);
  const [isProcessingEmail, setIsProcessingEmail] = useState(false); // Prevent duplicate processing

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversation history from assistant context
  useEffect(() => {
    if (assistantContext && assistantContext.conversationHistory) {
      const historyMessages = assistantContext.conversationHistory.map((entry, index) => [
        {
          id: `user-${index}`,
          type: 'user',
          content: entry.message,
          timestamp: new Date(entry.timestamp)
        },
        {
          id: `assistant-${index}`,
          type: 'assistant',
          content: entry.response,
          timestamp: new Date(entry.timestamp)
        }
      ]).flat();
      
      setMessages(historyMessages);
      console.log('✅ Loaded conversation history from assistant context');
    }
  }, [assistantContext]);

  // Handle email data available messages
  const handleEmailDataAvailable = (message) => {
    console.log('🎯 BillableAI: Assistant received message:', message);
    
    if (message.type === 'EMAIL_DATA_AVAILABLE') {
      console.log('🎯 BillableAI: Received EMAIL_DATA_AVAILABLE message:', message.data);
      
              // Auto-process the email data
        if (message.data && message.data.emailData) {
          console.log('🎯 BillableAI: Email data found in message:', {
            subject: message.data.emailData.subject,
            to: message.data.emailData.to,
            bodyLength: message.data.emailData.body?.length || 0,
            timeSpent: message.data.timeSpent || 0
          });
          
          // Prevent duplicate processing
          if (isProcessingEmail) {
            console.log('🎯 BillableAI: Skipping email processing - already processing');
            return;
          }
          
          setCurrentEmailData(message.data.emailData);
          setCurrentTimeSpent(message.data.timeSpent || 0);
          
          // Update last used email in assistant context
          updateLastUsedEmail(message.data.emailData);
          
          // Generate summary
          generateBillableSummary(message.data.emailData, message.data.timeSpent);
        } else {
          console.log('🎯 BillableAI: No email data found in EMAIL_DATA_AVAILABLE message');
        }
    } else {
      console.log('🎯 BillableAI: Received message with type:', message.type);
    }
  };

  // Listen for real-time email data notifications from background script
  useEffect(() => {
    // Add message listener
    chrome.runtime.onMessage.addListener(handleEmailDataAvailable);

    // Cleanup listener on unmount
    return () => {
      chrome.runtime.onMessage.removeListener(handleEmailDataAvailable);
    };
  }, []);

  // Check for new summaries when component mounts with delay
  useEffect(() => {
    // Add a small delay to ensure background script is ready
    const timer = setTimeout(() => {
      checkForNewSummaries();
    }, 1000); // 1 second delay
    
    return () => {
      clearTimeout(timer);
    };
  }, []);

  const checkModelStatus = async () => {
    try {
      if (geminiService && geminiService.isReady()) {
        // Test the connection
        const testResult = await geminiService.testConnection();
        if (testResult.success) {
          setModelStatus('connected');
          console.log('🎯 BillableAI: Gemini 2.5 Pro connected successfully');
              } else {
          setModelStatus('fallback');
          console.log('🎯 BillableAI: Using fallback mode -', testResult.message);
        }
            } else {
        setModelStatus('fallback');
        console.log('🎯 BillableAI: Using fallback mode - service not ready');
        }
      } catch (error) {
      setModelStatus('fallback');
      console.log('🎯 BillableAI: Error checking model status, using fallback:', error);
    }
  };

  const checkForNewSummaries = async () => {
    try {
      console.log('🎯 BillableAI: Checking for new email summaries...');
      
      // Prevent duplicate processing
      if (isProcessingEmail) {
        console.log('🎯 BillableAI: Skipping check - already processing email');
        return;
      }
      
      // Add retry mechanism with delays
      const maxRetries = 2; // Reduced from 3 to prevent excessive checking
      const retryDelay = 1000; // 1 second
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        console.log(`🎯 BillableAI: Attempt ${attempt}/${maxRetries} to find email data...`);
        
        // Request email data from background script (primary method)
        try {
          const response = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
              type: 'GET_EMAIL_DATA'
            }, (response) => {
              if (chrome.runtime.lastError) {
                console.log('🎯 BillableAI: Error requesting email data from background script:', chrome.runtime.lastError);
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(response);
              }
            });
          });
          
          if (response && response.success && response.data) {
            console.log('🎯 BillableAI: Found email data via background script:', response.data);
            setCurrentEmailData(response.data.emailData);
            setCurrentTimeSpent(response.data.timeSpent || 0);
            
            // Only generate summary if not already processing (prevent duplicates)
            if (!isProcessingEmail) {
              await generateBillableSummary(response.data.emailData, response.data.timeSpent);
            }
            
            // Clear the data from storage but keep it visible in UI
            await clearEmailDataFromStorage();
            
            return; // Exit early since we found and processed data
          } else {
            console.log(`🎯 BillableAI: No email data found via background script (attempt ${attempt})`);
          }
        } catch (error) {
          console.log(`🎯 BillableAI: Error requesting email data from background script (attempt ${attempt}):`, error);
        }
        
        // If this wasn't the last attempt, wait before retrying
        if (attempt < maxRetries) {
          console.log(`🎯 BillableAI: Waiting ${retryDelay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
      
      // Fallback to chrome.storage.local if background script method fails
      try {
        const result = await chrome.storage.local.get(['billableAI_emailSummary']);
        if (result.billableAI_emailSummary && result.billableAI_emailSummary.autoProcess && result.billableAI_emailSummary.emailData) {
          console.log('🎯 BillableAI: Found auto-process email data in chrome.storage.local', result.billableAI_emailSummary);
          setCurrentEmailData(result.billableAI_emailSummary.emailData);
          setCurrentTimeSpent(result.billableAI_emailSummary.timeSpent || 0);
          
          // Only generate summary if not already processing (prevent duplicates)
          if (!isProcessingEmail) {
            await generateBillableSummary(result.billableAI_emailSummary.emailData, result.billableAI_emailSummary.timeSpent);
          }
          
          // Clear the data from storage but keep it visible in UI
          await clearEmailDataFromStorage();
          
          return; // Exit early since we found and processed data
        }
      } catch (error) {
        console.log('🎯 BillableAI: Error checking chrome.storage.local', error);
      }
      
      // Final fallback to localStorage
      const storedData = localStorage.getItem('billableAI_emailSummary');
      if (storedData) {
        const summaryData = JSON.parse(storedData);
        console.log('🎯 BillableAI: Found stored email data in localStorage:', summaryData);
        
        if (summaryData.autoProcess && summaryData.emailData) {
          console.log('🎯 BillableAI: Processing auto-generated email data from localStorage', summaryData);
          setCurrentEmailData(summaryData.emailData);
          setCurrentTimeSpent(summaryData.timeSpent || 0);
          
          // Only generate summary if not already processing (prevent duplicates)
          if (!isProcessingEmail) {
            await generateBillableSummary(summaryData.emailData, summaryData.timeSpent);
          }
          
          // Clear the data from storage but keep it visible in UI
          await clearEmailDataFromStorage();
        }
      }
    } catch (error) {
      console.log('🎯 BillableAI: Error checking for new summaries', error);
    }
  };

  // Function to clear email data from storage only (keeps UI state)
  const clearEmailDataFromStorage = async () => {
    try {
      console.log('🎯 BillableAI: Clearing email data from storage only...');
      
      // Clear via background script (primary method)
      try {
        await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage({
            type: 'CLEAR_EMAIL_DATA'
          }, (response) => {
            if (chrome.runtime.lastError) {
              console.log('🎯 BillableAI: Error clearing email data via background script:', chrome.runtime.lastError);
              reject(new Error(chrome.runtime.lastError.message));
            } else if (response && response.success) {
              console.log('🎯 BillableAI: Email data cleared via background script');
              resolve();
            } else {
              reject(new Error('Background script failed to clear data'));
            }
          });
        });
      } catch (error) {
        console.log('🎯 BillableAI: Background script clear failed, using fallback:', error);
      }
      
      // Fallback: Remove from chrome.storage.local
      try {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          await chrome.storage.local.remove(['billableAI_emailSummary']);
          console.log('🎯 BillableAI: Email data removed from chrome.storage.local');
        }
      } catch (error) {
        console.log('🎯 BillableAI: Error clearing chrome.storage.local:', error);
      }
      
      // Remove from localStorage
      try {
        localStorage.removeItem('billableAI_emailSummary');
        console.log('🎯 BillableAI: Email data removed from localStorage');
      } catch (error) {
        console.log('🎯 BillableAI: Error clearing localStorage:', error);
      }
      
      console.log('🎯 BillableAI: All stored email data deleted successfully (UI state preserved)');
    } catch (error) {
      console.log('🎯 BillableAI: Error deleting stored email data:', error);
    }
  };


  const generateBillableSummary = async (emailData, timeSpent) => {
    if (!emailData) {
      console.log('🎯 BillableAI: No email data provided for summary generation');
      return;
    }
    
    // Prevent duplicate processing
    if (isProcessingEmail) {
      console.log('🎯 BillableAI: Already processing email, skipping duplicate request');
      return;
    }
    
    console.log('🎯 BillableAI: Generating billable summary for email:', emailData, 'Time spent:', timeSpent);
    setIsProcessingEmail(true);
    setIsGenerating(true);
    
    try {
      // Debug: Log the email data structure
      console.log('🎯 BillableAI: Email data structure:', {
        subject: emailData.subject,
        to: emailData.to,
        cc: emailData.cc,
        bcc: emailData.bcc,
        body: emailData.body,
        content: emailData.content,
        timeSpent: timeSpent
      });
      
      // Enhanced email details display
      const emailDetails = {
        subject: emailData.subject || 'No subject',
        to: emailData.to || 'No recipient',
        cc: emailData.cc || 'None',
        bcc: emailData.bcc || 'None',
        body: emailData.body || emailData.content || 'No content',
        timeSpent: Math.round(timeSpent / 60000)
      };
      
      console.log('🎯 BillableAI: Enhanced email details:', emailDetails);
      
      // Add user message with email details
      const userMessage = {
        id: Date.now(),
        type: 'user',
        content: `Generate billable summary for this email:

📧 **Email Details:**
**Subject:** ${emailDetails.subject}
**To:** ${emailDetails.to}
**CC:** ${emailDetails.cc}
**BCC:** ${emailDetails.bcc}
**Time Spent:** ${emailDetails.timeSpent} minutes

📝 **Email Content:**
${emailDetails.body}`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessage]);
        
      // Generate summary using Gemini or fallback
      const summary = await generateGeminiResponse(emailData, timeSpent);
      
      // Add assistant message with summary
      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: summary,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Add follow-up message prompting for confirmation
      const followUpMessage = {
        id: Date.now() + 2,
        type: 'assistant',
        content: `💡 **Next Step:** Type "I confirm" to automatically attach this billable summary to the correct client and matter in Clio.

This will:
• Find the client by email address
• Create or find the appropriate matter
• Log the time entry to Clio
• Provide detailed billing confirmation

Ready to bill? Just type "I confirm" below!`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, followUpMessage]);
      
      console.log('🎯 BillableAI: Billable summary generated successfully');
      
      // Clear the data from storage but keep it visible in UI
      await clearEmailDataFromStorage();
      
    } catch (error) {
      console.log('🎯 BillableAI: Error generating billable summary:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: 'Sorry, I encountered an error while generating the summary. Please try again.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      // Add follow-up message even for errors
      const followUpMessage = {
        id: Date.now() + 2,
        type: 'assistant',
        content: `💡 **Next Step:** Type "I confirm" to automatically attach this billable summary to the correct client and matter in Clio.

This will:
• Find the client by email address
• Create or find the appropriate matter
• Log the time entry to Clio
• Provide detailed billing confirmation

Ready to bill? Just type "I confirm" below!`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, followUpMessage]);
    } finally {
      setIsGenerating(false);
      setIsProcessingEmail(false);
    }
  };

  const generateGeminiResponse = async (emailData, timeSpent) => {
    try {
      if (geminiService && geminiService.isReady()) {
        console.log('🎯 BillableAI: Generating response with Gemini 2.5 Pro');
        const response = await geminiService.generateBillableSummary(emailData, timeSpent);
        return response;
      } else {
        console.log('🎯 BillableAI: Gemini service not ready, using fallback');
        return generateFallbackResponse(emailData, timeSpent);
      }
    } catch (error) {
      console.log('🎯 BillableAI: Error generating Gemini response:', error);
      return generateFallbackResponse(emailData, timeSpent);
    }
  };

  const generateFallbackResponse = (emailData, timeSpent) => {
    const timeInMinutes = Math.round(timeSpent / 60000);
    const subject = emailData.subject || 'No subject';
    const to = emailData.to || 'No recipient';
    const cc = emailData.cc || 'None';
    const bcc = emailData.bcc || 'None';
    const content = emailData.body || emailData.content || 'No content';
    
    return `📧 Professional Billable Summary (Fallback Mode)

Email Details:
- Subject: ${subject}
- To: ${to}
- CC: ${cc}
- BCC: ${bcc}
- Time Spent: ${timeInMinutes} minutes
- Content Length: ${content.length} characters

Professional Services Rendered:
Email composition and client communication services including content drafting, review, and finalization.

Time Breakdown:
- Composition Time: ${timeInMinutes} minutes
- Professional Rate: Standard hourly rate
- Billable Amount: ${timeInMinutes} minutes

Summary:
This professional email communication required ${timeInMinutes} minutes of dedicated time for composition, review, and finalization. The content demonstrates professional client communication standards and represents billable professional services.

Total Billable Time: ${timeInMinutes} minutes

Note: This is a fallback response. For enhanced analysis, please configure your Gemini 2.5 Pro API key in settings.`;
  };

  const handleSendMessage = async (message) => {
    if (!message.trim() || isGenerating) return;

    const userMessage = { id: Date.now(), type: 'user', content: message, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsGenerating(true);

    try {
      let response;
      
      // Check for "I confirm" message to trigger automatic billing
      if (message.toLowerCase().includes('i confirm') || message.toLowerCase().includes('confirm')) {
        console.log('🎯 BillableAI: User confirmed billing, initiating automatic client/matter detection');
        
        // Check Clio connection status directly from backend
        try {
          const { completeOneClickBilling, checkClioConnection } = await import('../services/oauthService.js');
          const connectionStatus = await checkClioConnection();
          console.log('🎯 BillableAI: Clio connection status:', connectionStatus);
          
          if (connectionStatus.isConnected && currentEmailData) {
            // Trigger automatic billing
            response = await handleAutomaticBilling(currentEmailData, currentTimeSpent || 0);
          } else {
            response = `I'd be happy to help with billing! 

To use automatic client and matter detection, please:
1. Connect to Clio first (click "Connect to Clio" in the popup)
2. Make sure you have email data available

Would you like me to help you connect to Clio or process this manually?`;
          }
        } catch (error) {
          console.error('🎯 BillableAI: Error checking Clio connection:', error);
          response = `I'd be happy to help with billing! 

To use automatic client and matter detection, please:
1. Connect to Clio first (click "Connect to Clio" in the popup)
2. Make sure you have email data available

Would you like me to help you connect to Clio or process this manually?`;
        }
      } else {
        // Use Gemini for all other responses
        if (geminiService && geminiService.isReady()) {
          console.log('🎯 BillableAI: Generating response with Gemini 2.5 Pro for all messages');
          
          // Get current time spent if available
          const timeSpent = currentTimeSpent || 0;
          
          // Generate response using Gemini with email context and time data
          response = await geminiService.generateGeneralResponse(message, currentEmailData, timeSpent);
        } else {
          console.log('🎯 BillableAI: Gemini service not ready, using fallback');
          
          // Create more conversational fallback responses
          if (message.toLowerCase().includes('summary') || message.toLowerCase().includes('billable')) {
            if (currentEmailData) {
              response = generateFallbackResponse(currentEmailData, currentTimeSpent || 0);
            } else {
              response = `I'd be happy to help you generate a billable summary! 

To get started, please compose an email in Gmail first. Once you've written your email, I can analyze the content, time spent, and create a professional billing summary for you.

Current Status: ${modelStatus === 'connected' ? '✅ Gemini 2.5 Pro Connected' : 
                        modelStatus === 'fallback' ? '⚠️ Using Fallback Mode' : 
                        '❌ Service Unavailable'}

What would you like me to help you with?`;
            }
          } else if (message.toLowerCase().includes('analyze') || message.toLowerCase().includes('analysis')) {
            if (currentEmailData) {
              response = generateFallbackResponse(currentEmailData, currentTimeSpent || 0);
            } else {
              response = `I can provide detailed analysis of your emails! 

I'll examine the content, tone, recipients, and time spent to give you professional insights and billing recommendations.

Current Status: ${modelStatus === 'connected' ? '✅ Gemini 2.5 Pro Connected' : 
                        modelStatus === 'fallback' ? '⚠️ Using Fallback Mode' : 
                        '❌ Service Unavailable'}

Please compose an email in Gmail first, then I can provide comprehensive analysis.`;
            }
          } else if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi') || message.toLowerCase().includes('hey')) {
            response = `Hello! I'm your BillableAI Assistant, powered by Gemini 2.5 Pro. 

I can help you with:
• Generating professional billable summaries for emails
• Analyzing email content and communication patterns
• Providing billing recommendations and time tracking
• Creating detailed client billing documents

Current Status: ${modelStatus === 'connected' ? '✅ Gemini 2.5 Pro Connected' : 
                        modelStatus === 'fallback' ? '⚠️ Using Fallback Mode' : 
                        '❌ Service Unavailable'}

To get started, compose an email in Gmail and I'll help you create professional billing summaries!`;
          } else {
            // General conversation fallback
            response = `I'm here to help with your email analysis and billable time tracking! 

I can assist you with:
• Professional billable summaries
• Email content analysis
• Billing recommendations
• Time tracking and reporting

Current Status: ${modelStatus === 'connected' ? '✅ Gemini 2.5 Pro Connected' : 
                          modelStatus === 'fallback' ? '⚠️ Using Fallback Mode' : 
                          '❌ Service Unavailable'}

To get started, compose an email in Gmail and I'll help you create professional billing summaries and analysis.`;
          }
        }
      }
      
      const assistantMessage = { id: Date.now() + 1, type: 'assistant', content: response, timestamp: new Date() };
      setMessages(prev => [...prev, assistantMessage]);
      
      // Save conversation to assistant context
      await addAssistantMessage(message, response);
      
      // Update last used email if available
      if (currentEmailData) {
        await updateLastUsedEmail(currentEmailData);
      }
      
    } catch (error) {
      console.log('🎯 BillableAI: Error generating response:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: 'Sorry, I encountered an error while generating a response. Please try again.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle automatic billing when user confirms
  const handleAutomaticBilling = async (emailData, timeSpent) => {
    try {
      console.log('🚀 Starting automatic billing process:', { emailData, timeSpent });
      
      // Import the OAuth service
      const { completeOneClickBilling, checkClioConnection } = await import('../services/oauthService.js');
      
      // First check Clio connection status
      console.log('🔍 Checking Clio connection status...');
      const connectionStatus = await checkClioConnection();
      console.log('🔍 Clio connection status:', connectionStatus);
      
      if (!connectionStatus.isConnected) {
        return `❌ **Clio Connection Required**

🔗 **You need to connect to Clio first!**

📋 **Steps to connect:**
1. **Open extension popup** (click the BillableAI icon)
2. **Click "Connect to Clio"** button
3. **Complete OAuth flow** in the new tab
4. **Return here** and try "I confirm" again

💡 **Why this is needed:**
• Automatic billing requires Clio access
• Your email time will be logged to Clio
• Client and matter will be auto-detected

📧 **Email details ready for billing:**
• To: ${emailData.to || 'Unknown'}
• Subject: ${emailData.subject || 'No subject'}
• Time spent: ${Math.round(timeSpent / 60000)} minutes

🔄 **After connecting to Clio, type "I confirm" again to proceed.**`;
      }
      
      // Prepare billing data with enhanced summary
      const billingData = {
        summary: `Email correspondence: ${emailData.subject || 'Email processing'}`,
        timeSpent: timeSpent,
        date: new Date().toISOString().split('T')[0],
        category: 'TimeEntry',
        billable: true,
        suggestions: {
          suggestedMatter: emailData.subject || 'Email correspondence',
          suggestedClient: emailData.to || 'Unknown client'
        }
      };
      
      console.log('📊 Prepared billing data:', billingData);
      
      // Complete one-click billing
      const result = await completeOneClickBilling(emailData, billingData);
      
      if (result.success) {
        const clientName = result.data?.client?.name || 'Auto-detected client';
        const matterDescription = result.data?.matter?.description || 'Auto-detected matter';
        const timeMinutes = Math.round(timeSpent / 60000);
        
        return `✅ **Automatic billing completed successfully!**

📊 **Billing Summary:**
• **Client:** ${clientName}
• **Matter:** ${matterDescription}
• **Time:** ${timeMinutes} minutes
• **Date:** ${billingData.date}
• **Status:** ✅ Billed to Clio

🎯 **What happened:**
1. Analyzed email to ${emailData.to || 'recipient'}
2. Found matching client in Clio
3. Located or created appropriate matter
4. Logged ${timeMinutes} minutes of billable time

Your time has been automatically logged to Clio with the detected client and matter.`;
      } else {
        // Provide specific error messages
        let errorMessage = 'Unknown error occurred';
        
        if (result.error?.includes('No client found')) {
          errorMessage = `No client found for email: ${emailData.to || 'recipient'}`;
        } else if (result.error?.includes('Clio connection')) {
          errorMessage = 'Clio connection failed - please reconnect to Clio';
        } else if (result.error?.includes('token')) {
          errorMessage = 'Clio authentication expired - please reconnect to Clio';
        } else {
          errorMessage = result.error || 'Unknown error';
        }
        
        return `❌ **Automatic billing failed**

🔍 **Error:** ${errorMessage}

💡 **Troubleshooting:**
1. **Check Clio connection** - Go to Settings and reconnect to Clio
2. **Verify client exists** - Make sure the client (${emailData.to || 'recipient'}) exists in Clio
3. **Check matter** - Ensure you have appropriate matters set up
4. **Manual billing** - Try logging time manually in Clio

📧 **Email details:**
• To: ${emailData.to || 'Unknown'}
• Subject: ${emailData.subject || 'No subject'}
• Time spent: ${Math.round(timeSpent / 60000)} minutes`;
      }
      
    } catch (error) {
      console.error('❌ Automatic billing error:', error);
      
      return `❌ **Automatic billing failed**

🔍 **Error:** ${error.message}

💡 **Troubleshooting:**
1. **Check Clio connection** - Go to Settings and reconnect to Clio
2. **Verify client exists** - Make sure the client exists in Clio
3. **Check matter** - Ensure you have appropriate matters set up
4. **Manual billing** - Try logging time manually in Clio

📧 **Email details:**
• To: ${emailData.to || 'Unknown'}
• Subject: ${emailData.subject || 'No subject'}
• Time spent: ${Math.round(timeSpent / 60000)} minutes`;
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = async () => {
    setMessages([]);
    setCurrentEmailData(null);
    
    // Clear assistant conversation history
    try {
      await clearAssistantHistory();
      console.log('✅ Chat and assistant history cleared');
    } catch (error) {
      console.error('❌ Error clearing assistant history:', error);
    }
  };



  const getModelStatusBadge = () => {
    switch (modelStatus) {
      case 'connected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <span className="w-2 h-2 bg-green-400 rounded-full mr-1.5"></span>
            Gemini 2.5 Pro Connected
          </span>
        );
      case 'fallback':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <span className="w-2 h-2 bg-yellow-400 rounded-full mr-1.5"></span>
            Fallback Mode
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <span className="w-2 h-2 bg-red-400 rounded-full mr-1.5"></span>
            Service Error
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <span className="w-2 h-2 bg-gray-400 rounded-full mr-1.5"></span>
            Checking...
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">AI</span>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-800">BillableAI Assistant</h2>
            <p className="text-xs text-gray-500">Powered by Gemini 2.5 Pro</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getModelStatusBadge()}
          <button
            onClick={clearChat}
            className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
            title="Clear chat history"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages - Full height chat area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 && (
          <div className="text-center p-8">
            <div className="mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Welcome to BillableAI Assistant</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                I can help you generate billable summaries for your emails using Gemini 2.5 Pro. 
                Compose an email first to get started.
              </p>
              {assistantContext?.conversationHistory?.length > 0 && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-500">
                    📝 You have {assistantContext.conversationHistory.length} previous conversations
                  </p>
                </div>
              )}
            </div>

            {/* Model Status Info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                {getModelStatusBadge()}
              </div>
              <p className="text-sm text-gray-600 text-center">
                {modelStatus === 'connected' 
                  ? 'Gemini 2.5 Pro is connected and ready for enhanced analysis.'
                  : modelStatus === 'fallback'
                  ? 'Using fallback mode. Configure your API key in settings for enhanced features.'
                  : 'Checking connection status...'
                }
              </p>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <button
                onClick={() => handleSendMessage('Generate summary')}
                className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <GenerateIcon className="w-4 h-4" />
                Generate Summary
              </button>
              
              <button
                onClick={() => handleSendMessage('Analyze email')}
                className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg hover:from-green-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Analyze Email
              </button>
            </div>
          </div>
        )}
        
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-4 px-4`}>
                <div className={`max-w-[85%] rounded-lg p-3 ${
                  message.type === 'user' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
                    : 'bg-gray-50 border border-gray-200 text-gray-800'
                }`}>
                  <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ 
                    __html: message.content
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                      .replace(/\n/g, '<br>')
                  }}></div>
                  <div className={`text-xs mt-1 ${
                    message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
        
        {isGenerating && (
          <div className="flex justify-start mb-4 px-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-800">
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-600">
                  {modelStatus === 'connected' ? 'Generating with Gemini 2.5 Pro...' : 'Generating response...'}
                </span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(inputValue);
                }
              }}
              placeholder="Ask me to generate a billable summary or analyze an email..."
              className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              rows={2}
              style={{ minHeight: '60px', maxHeight: '150px' }}
              disabled={isGenerating}
            />
            {isGenerating && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>
          <button
            onClick={() => handleSendMessage(inputValue)}
            disabled={!inputValue.trim() || isGenerating}
            className="px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        
        {/* Quick Actions */}
        {messages.length === 0 && currentEmailData && (
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => handleSendMessage('Generate billable summary')}
              disabled={isGenerating}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
            >
              Generate Summary
            </button>
            <button
              onClick={() => handleSendMessage('Analyze this email')}
              disabled={isGenerating}
              className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
            >
              Analyze Email
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Assistant; 