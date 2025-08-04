// Gmail API Service for BillableAI Extension
// Handles Gmail API integration for email content tracking and summary generation

class GmailApiService {
  constructor() {
    this.baseURL = 'https://gmail.googleapis.com/gmail/v1/users/me';
    this.accessToken = null;
    this.isInitialized = false;
  }

  // Initialize with access token
  async initialize(accessToken) {
    this.accessToken = accessToken;
    this.isInitialized = true;
    console.log('🎯 BillableAI: Gmail API service initialized');
  }

  // Check if service is ready
  isReady() {
    return this.isInitialized && this.accessToken;
  }

  // Get current compose data (drafts)
  async getCurrentComposeData() {
    try {
      if (!this.isReady()) {
        throw new Error('Gmail API not initialized');
      }

      const response = await fetch(`${this.baseURL}/drafts`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get drafts: ${response.status}`);
      }

      const data = await response.json();
      return data.drafts || [];
    } catch (error) {
      console.error('🎯 BillableAI: Error getting compose data:', error);
      return [];
    }
  }

  // Get specific draft content
  async getDraftContent(draftId) {
    try {
      if (!this.isReady()) {
        throw new Error('Gmail API not initialized');
      }

      const response = await fetch(`${this.baseURL}/drafts/${draftId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get draft content: ${response.status}`);
      }

      const data = await response.json();
      return this.parseEmailContent(data.message);
    } catch (error) {
      console.error('🎯 BillableAI: Error getting draft content:', error);
      return null;
    }
  }

  // Get message content
  async getMessageContent(messageId) {
    try {
      if (!this.isReady()) {
        throw new Error('Gmail API not initialized');
      }

      const response = await fetch(`${this.baseURL}/messages/${messageId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get message content: ${response.status}`);
      }

      const data = await response.json();
      return this.parseEmailContent(data);
    } catch (error) {
      console.error('🎯 BillableAI: Error getting message content:', error);
      return null;
    }
  }

  // Parse email content from Gmail API response
  parseEmailContent(message) {
    try {
      const headers = message.payload?.headers || [];
      const body = this.extractEmailBody(message.payload);

      return {
        id: message.id,
        threadId: message.threadId,
        to: this.getHeaderValue(headers, 'To') || '',
        from: this.getHeaderValue(headers, 'From') || '',
        subject: this.getHeaderValue(headers, 'Subject') || '',
        content: body || '',
        snippet: message.snippet || '',
        timestamp: new Date(parseInt(message.internalDate)).toISOString()
      };
    } catch (error) {
      console.error('🎯 BillableAI: Error parsing email content:', error);
      return null;
    }
  }

  // Extract email body from payload
  extractEmailBody(payload) {
    if (!payload) return '';

    // Handle multipart messages
    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain') {
          return this.decodeBody(part.body.data);
        }
      }
    }

    // Handle single part messages
    if (payload.body && payload.body.data) {
      return this.decodeBody(payload.body.data);
    }

    return '';
  }

  // Decode base64 body data
  decodeBody(data) {
    try {
      return atob(data.replace(/-/g, '+').replace(/_/g, '/'));
    } catch (error) {
      console.error('🎯 BillableAI: Error decoding body:', error);
      return '';
    }
  }

  // Get header value by name
  getHeaderValue(headers, name) {
    const header = headers.find(h => h.name === name);
    return header ? header.value : '';
  }

  // Send email via Gmail API
  async sendEmail(emailData) {
    try {
      if (!this.isReady()) {
        throw new Error('Gmail API not initialized');
      }

      const message = this.createRawMessage(emailData);
      const response = await fetch(`${this.baseURL}/messages/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw: message })
      });

      if (!response.ok) {
        throw new Error(`Failed to send email: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('🎯 BillableAI: Error sending email:', error);
      throw error;
    }
  }

  // Create raw message for Gmail API
  createRawMessage(emailData) {
    const { to, subject, content } = emailData;
    
    const message = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=utf-8',
      '',
      content
    ].join('\r\n');

    return btoa(message).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  // Get Gmail labels
  async getLabels() {
    try {
      if (!this.isReady()) {
        throw new Error('Gmail API not initialized');
      }

      const response = await fetch(`${this.baseURL}/labels`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get labels: ${response.status}`);
      }

      const data = await response.json();
      return data.labels || [];
    } catch (error) {
      console.error('🎯 BillableAI: Error getting labels:', error);
      return [];
    }
  }

  // Create billable tracking label
  async createBillableLabel() {
    try {
      if (!this.isReady()) {
        throw new Error('Gmail API not initialized');
      }

      const labelData = {
        name: 'BillableAI/Tracked',
        labelListVisibility: 'labelShow',
        messageListVisibility: 'show'
      };

      const response = await fetch(`${this.baseURL}/labels`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(labelData)
      });

      if (!response.ok) {
        throw new Error(`Failed to create label: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('🎯 BillableAI: Error creating label:', error);
      throw error;
    }
  }

  // Add label to message
  async addLabelToMessage(messageId, labelId) {
    try {
      if (!this.isReady()) {
        throw new Error('Gmail API not initialized');
      }

      const response = await fetch(`${this.baseURL}/messages/${messageId}/modify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          addLabelIds: [labelId]
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to add label: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('🎯 BillableAI: Error adding label:', error);
      throw error;
    }
  }

  // Get recent messages for tracking
  async getRecentMessages(maxResults = 10) {
    try {
      if (!this.isReady()) {
        throw new Error('Gmail API not initialized');
      }

      const response = await fetch(`${this.baseURL}/messages?maxResults=${maxResults}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get messages: ${response.status}`);
      }

      const data = await response.json();
      return data.messages || [];
    } catch (error) {
      console.error('🎯 BillableAI: Error getting recent messages:', error);
      return [];
    }
  }

  // Get user profile
  async getUserProfile() {
    try {
      if (!this.isReady()) {
        throw new Error('Gmail API not initialized');
      }

      const response = await fetch(`${this.baseURL}/profile`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get profile: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('🎯 BillableAI: Error getting user profile:', error);
      throw error;
    }
  }
}

export default new GmailApiService(); 