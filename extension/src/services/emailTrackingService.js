// Email Tracking Service
// Combines Gmail API and content script approaches for reliable email data extraction

import gmailService from './gmailService.js';
import { getAuthHeaders } from '../utils/api.js';

class EmailTrackingService {
  constructor() {
    this.isInitialized = false;
    this.hasGmailAccess = false;
    this.fallbackToContentScript = true;
  }

  // Initialize the service
  async initialize() {
    try {
      console.log('📧 EmailTrackingService: Initializing...');
      
      // Check if we have Gmail access
      const response = await fetch('http://localhost:3001/api/extension/profile', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const userData = await response.json();
        this.hasGmailAccess = userData.user?.hasGmailAccess || false;
        console.log('📧 EmailTrackingService: Gmail access status:', this.hasGmailAccess);
      }

      this.isInitialized = true;
      console.log('📧 EmailTrackingService: Initialized successfully');
    } catch (error) {
      console.error('❌ EmailTrackingService: Initialization error:', error);
      this.fallbackToContentScript = true;
    }
  }

  // Get current email composition data using best available method
  async getCurrentEmailData() {
    try {
      console.log('📧 EmailTrackingService: Getting current email data...');

      // Try Gmail API first if available
      if (this.hasGmailAccess) {
        try {
          const gmailData = await this.getEmailDataViaGmailAPI();
          if (gmailData) {
            console.log('📧 EmailTrackingService: Successfully got data via Gmail API');
            return gmailData;
          }
        } catch (error) {
          console.warn('⚠️ EmailTrackingService: Gmail API failed, falling back to content script:', error);
        }
      }

      // Fallback to content script method
      if (this.fallbackToContentScript) {
        const contentScriptData = await this.getEmailDataViaContentScript();
        if (contentScriptData) {
          console.log('📧 EmailTrackingService: Successfully got data via content script');
          return contentScriptData;
        }
      }

      console.log('📧 EmailTrackingService: No email data found');
      return null;
    } catch (error) {
      console.error('❌ EmailTrackingService: Error getting email data:', error);
      return null;
    }
  }

  // Get email data via Gmail API
  async getEmailDataViaGmailAPI() {
    try {
      console.log('📧 EmailTrackingService: Attempting Gmail API method...');

      // Get access token from backend
      const tokenResponse = await fetch('http://localhost:3001/api/auth/gmail/token', {
        headers: getAuthHeaders()
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to get Gmail access token');
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.accessToken;

      if (!accessToken) {
        throw new Error('No Gmail access token available');
      }

      // Initialize Gmail service
      await gmailService.initialize(accessToken);

      // Get current draft data
      const emailData = await gmailService.getCurrentDraftData();
      
      if (emailData) {
        console.log('📧 EmailTrackingService: Gmail API data retrieved:', {
          subject: emailData.subject,
          to: emailData.to,
          cc: emailData.cc,
          bcc: emailData.bcc,
          bodyLength: emailData.body.length
        });
      }

      return emailData;
    } catch (error) {
      console.error('❌ EmailTrackingService: Gmail API method failed:', error);
      throw error;
    }
  }

  // Get email data via content script
  async getEmailDataViaContentScript() {
    try {
      console.log('📧 EmailTrackingService: Attempting content script method...');

      // Send message to content script to capture email data
      const response = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (response.length === 0) {
        throw new Error('No active tab found');
      }

      const activeTab = response[0];
      
      // Check if we're on Gmail
      if (!activeTab.url || !activeTab.url.includes('mail.google.com')) {
        throw new Error('Not on Gmail page');
      }

      // Send message to content script
      const messageResponse = await chrome.tabs.sendMessage(activeTab.id, {
        type: 'CAPTURE_EMAIL_DATA'
      });

      if (messageResponse && messageResponse.success) {
        console.log('📧 EmailTrackingService: Content script data retrieved:', messageResponse.data);
        return messageResponse.data;
      } else {
        throw new Error('Content script failed to capture email data');
      }
    } catch (error) {
      console.error('❌ EmailTrackingService: Content script method failed:', error);
      throw error;
    }
  }

  // Enhanced email data capture with multiple fallback methods
  async captureEmailDataEnhanced() {
    try {
      console.log('📧 EmailTrackingService: Enhanced email data capture...');

      // Method 1: Try Gmail API
      if (this.hasGmailAccess) {
        try {
          const gmailData = await this.getEmailDataViaGmailAPI();
          if (gmailData && this.isValidEmailData(gmailData)) {
            console.log('📧 EmailTrackingService: Using Gmail API data');
            return gmailData;
          }
        } catch (error) {
          console.warn('⚠️ EmailTrackingService: Gmail API failed:', error);
        }
      }

      // Method 2: Try content script
      try {
        const contentScriptData = await this.getEmailDataViaContentScript();
        if (contentScriptData && this.isValidEmailData(contentScriptData)) {
          console.log('📧 EmailTrackingService: Using content script data');
          return contentScriptData;
        }
      } catch (error) {
        console.warn('⚠️ EmailTrackingService: Content script failed:', error);
      }

      // Method 3: Try direct DOM access (if we're in a content script context)
      try {
        const domData = this.captureEmailDataFromDOM();
        if (domData && this.isValidEmailData(domData)) {
          console.log('📧 EmailTrackingService: Using DOM data');
          return domData;
        }
      } catch (error) {
        console.warn('⚠️ EmailTrackingService: DOM capture failed:', error);
      }

      console.log('📧 EmailTrackingService: No valid email data found');
      return null;
    } catch (error) {
      console.error('❌ EmailTrackingService: Enhanced capture failed:', error);
      return null;
    }
  }

  // Validate email data
  isValidEmailData(emailData) {
    if (!emailData) return false;

    // Check if we have at least some meaningful data
    const hasSubject = emailData.subject && emailData.subject.trim().length > 0;
    const hasBody = emailData.body && emailData.body.trim().length > 0;
    const hasRecipient = (emailData.to && emailData.to.trim().length > 0) ||
                        (emailData.cc && emailData.cc.trim().length > 0) ||
                        (emailData.bcc && emailData.bcc.trim().length > 0);

    // At least subject or body should be present
    return hasSubject || hasBody || hasRecipient;
  }

  // Capture email data directly from DOM (fallback method)
  captureEmailDataFromDOM() {
    try {
      console.log('📧 EmailTrackingService: Capturing from DOM...');

      // This would be called from within a content script context
      const composeWindow = document.querySelector('.Am.Al.editable, [role="dialog"] .Am.Al.editable');
      if (!composeWindow) {
        throw new Error('No compose window found');
      }

      const dialog = composeWindow.closest('[role="dialog"]');
      if (!dialog) {
        throw new Error('No dialog found');
      }

      // Enhanced selectors for better capture
      const selectors = {
        subject: [
          'input[name="subjectbox"]',
          '[name="subjectbox"]',
          'input[placeholder*="Subject"]',
          '[role="textbox"][aria-label*="Subject"]'
        ],
        to: [
          'input[name="to"]',
          '[name="to"]',
          'input[placeholder*="Recipients"]',
          '[role="textbox"][aria-label*="To"]',
          'input[aria-label*="To"]'
        ],
        cc: [
          'input[name="cc"]',
          '[name="cc"]',
          'input[placeholder*="Cc"]',
          '[role="textbox"][aria-label*="Cc"]'
        ],
        bcc: [
          'input[name="bcc"]',
          '[name="bcc"]',
          'input[placeholder*="Bcc"]',
          '[role="textbox"][aria-label*="Bcc"]'
        ],
        body: [
          '.Am.Al.editable',
          '[contenteditable="true"]',
          '[role="textbox"]'
        ]
      };

      const emailData = {};

      // Extract each field
      Object.entries(selectors).forEach(([field, fieldSelectors]) => {
        for (const selector of fieldSelectors) {
          const element = dialog.querySelector(selector);
          if (element) {
            emailData[field] = element.value || element.textContent || element.innerText || '';
            console.log(`📧 EmailTrackingService: Found ${field}:`, emailData[field]);
            break;
          }
        }
      });

      // Add timestamp
      emailData.timestamp = new Date().toISOString();

      console.log('📧 EmailTrackingService: DOM capture complete:', emailData);
      return emailData;
    } catch (error) {
      console.error('❌ EmailTrackingService: DOM capture error:', error);
      throw error;
    }
  }

  // Store email data for processing
  async storeEmailData(emailData, timeSpent) {
    try {
      console.log('📧 EmailTrackingService: Storing email data...');

      if (!emailData) {
        console.log('📧 EmailTrackingService: No email data to store');
        return;
      }

      const summaryData = {
        emailData,
        timeSpent,
        timestamp: Date.now(),
        autoProcess: true,
        source: 'email_tracking_service'
      };

      // Send to background script for storage
      chrome.runtime.sendMessage({
        type: 'EMAIL_DATA_STORED',
        data: summaryData
      });

      console.log('📧 EmailTrackingService: Email data stored successfully');
      return summaryData;
    } catch (error) {
      console.error('❌ EmailTrackingService: Error storing email data:', error);
      throw error;
    }
  }

  // Get email data with time tracking
  async getEmailDataWithTimeTracking() {
    try {
      console.log('📧 EmailTrackingService: Getting email data with time tracking...');

      const emailData = await this.captureEmailDataEnhanced();
      
      if (emailData) {
        // Add time tracking info if available
        const timeData = window.billableAINotificationState || {};
        const timeSpent = timeData.totalTime || 0;

        console.log('📧 EmailTrackingService: Email data with time:', {
          emailData,
          timeSpent
        });

        return {
          emailData,
          timeSpent,
          timestamp: new Date().toISOString()
        };
      }

      return null;
    } catch (error) {
      console.error('❌ EmailTrackingService: Error getting email data with time:', error);
      return null;
    }
  }
}

export default new EmailTrackingService(); 