// Gmail API Service
// Handles Gmail API integration for email tracking and draft access

class GmailService {
  constructor() {
    this.baseURL = 'https://gmail.googleapis.com/gmail/v1/users/me';
    this.accessToken = null;
  }

  // Initialize Gmail API with access token
  async initialize(accessToken) {
    this.accessToken = accessToken;
  }

  // Get current draft email data using Gmail API
  async getCurrentDraftData() {
    try {
      if (!this.accessToken) {
        throw new Error('Gmail API not initialized');
      }

      console.log('📧 GmailService: Fetching current draft data...');

      // Get list of drafts
      const draftsResponse = await fetch(`${this.baseURL}/drafts`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!draftsResponse.ok) {
        throw new Error(`Failed to get Gmail drafts: ${draftsResponse.status}`);
      }

      const draftsData = await draftsResponse.json();
      console.log('📧 GmailService: Drafts found:', draftsData.drafts?.length || 0);

      if (!draftsData.drafts || draftsData.drafts.length === 0) {
        console.log('📧 GmailService: No drafts found');
        return null;
      }

      // Get the most recent draft (assuming it's the current compose)
      const latestDraft = draftsData.drafts[0];
      console.log('📧 GmailService: Processing latest draft:', latestDraft.id);

      // Get full draft details
      const draftResponse = await fetch(`${this.baseURL}/drafts/${latestDraft.id}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!draftResponse.ok) {
        throw new Error(`Failed to get draft details: ${draftResponse.status}`);
      }

      const draftData = await draftResponse.json();
      console.log('📧 GmailService: Draft data retrieved');

      // Parse the draft message
      const emailData = this.parseDraftMessage(draftData.message);
      console.log('📧 GmailService: Parsed email data:', emailData);

      return emailData;
    } catch (error) {
      console.error('❌ GmailService: Error getting draft data:', error);
      throw error;
    }
  }

  // Parse draft message from Gmail API response
  parseDraftMessage(message) {
    try {
      console.log('📧 GmailService: Parsing draft message...');

      // Decode the raw message
      const rawMessage = this.decodeBase64Url(message.raw);
      console.log('📧 GmailService: Raw message decoded, length:', rawMessage.length);

      // Parse MIME message
      const parsedMessage = this.parseMimeMessage(rawMessage);
      console.log('📧 GmailService: MIME message parsed');

      return {
        subject: parsedMessage.subject || '',
        body: parsedMessage.body || '',
        to: parsedMessage.to || '',
        cc: parsedMessage.cc || '',
        bcc: parsedMessage.bcc || '',
        from: parsedMessage.from || '',
        timestamp: new Date().toISOString(),
        messageId: message.id,
        threadId: message.threadId
      };
    } catch (error) {
      console.error('❌ GmailService: Error parsing draft message:', error);
      throw error;
    }
  }

  // Decode base64url encoded string
  decodeBase64Url(base64Url) {
    try {
      // Convert base64url to base64
      let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      
      // Add padding if needed
      while (base64.length % 4) {
        base64 += '=';
      }

      // Decode
      const decoded = atob(base64);
      return decoded;
    } catch (error) {
      console.error('❌ GmailService: Error decoding base64url:', error);
      throw error;
    }
  }

  // Parse MIME message structure
  parseMimeMessage(rawMessage) {
    try {
      console.log('📧 GmailService: Parsing MIME message...');

      const lines = rawMessage.split('\r\n');
      const headers = {};
      let body = '';
      let inBody = false;
      let boundary = null;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (!inBody) {
          // Parse headers
          if (line === '') {
            inBody = true;
            continue;
          }

          const colonIndex = line.indexOf(':');
          if (colonIndex > 0) {
            const key = line.substring(0, colonIndex).toLowerCase();
            const value = line.substring(colonIndex + 1).trim();
            headers[key] = value;

            // Check for multipart boundary
            if (key === 'content-type' && value.includes('multipart')) {
              const boundaryMatch = value.match(/boundary="?([^";\s]+)"?/);
              if (boundaryMatch) {
                boundary = boundaryMatch[1];
                console.log('📧 GmailService: Found multipart boundary:', boundary);
              }
            }
          }
        } else {
          // Parse body
          if (boundary && line.includes(boundary)) {
            // Skip boundary lines
            continue;
          }
          body += line + '\n';
        }
      }

      // Extract email fields from headers
      const emailData = {
        subject: this.decodeHeader(headers['subject'] || ''),
        to: this.decodeHeader(headers['to'] || ''),
        cc: this.decodeHeader(headers['cc'] || ''),
        bcc: this.decodeHeader(headers['bcc'] || ''),
        from: this.decodeHeader(headers['from'] || ''),
        body: this.extractTextBody(body, headers['content-type'] || '')
      };

      console.log('📧 GmailService: Extracted email data:', {
        subject: emailData.subject,
        to: emailData.to,
        cc: emailData.cc,
        bcc: emailData.bcc,
        bodyLength: emailData.body.length
      });

      return emailData;
    } catch (error) {
      console.error('❌ GmailService: Error parsing MIME message:', error);
      throw error;
    }
  }

  // Decode email headers (handles quoted-printable and base64 encoding)
  decodeHeader(header) {
    if (!header) return '';

    try {
      // Handle quoted-printable encoding
      if (header.includes('=?') && header.includes('?=')) {
        // Simple quoted-printable decode for headers
        return header.replace(/=\?([^?]+)\?([BQ])\?([^?]*)\?=/g, (match, charset, encoding, text) => {
          if (encoding === 'B') {
            // Base64 encoding
            return this.decodeBase64Url(text);
          } else if (encoding === 'Q') {
            // Quoted-printable encoding
            return text.replace(/_/g, ' ').replace(/=([0-9A-F]{2})/g, (match, hex) => {
              return String.fromCharCode(parseInt(hex, 16));
            });
          }
          return text;
        });
      }

      return header;
    } catch (error) {
      console.error('❌ GmailService: Error decoding header:', error);
      return header;
    }
  }

  // Extract text body from MIME message
  extractTextBody(body, contentType) {
    try {
      if (!body) return '';

      // If it's plain text, return as is
      if (contentType.includes('text/plain')) {
        return body.trim();
      }

      // If it's HTML, try to extract text content
      if (contentType.includes('text/html')) {
        // Simple HTML to text conversion
        return body
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .replace(/&nbsp;/g, ' ') // Replace HTML entities
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .trim();
      }

      // For multipart messages, try to find text part
      if (contentType.includes('multipart')) {
        // Simple text extraction from multipart
        const textMatch = body.match(/Content-Type: text\/plain[^]*?\r?\n\r?\n([^]*?)(?=\r?\n--|$)/);
        if (textMatch) {
          return textMatch[1].trim();
        }
      }

      return body.trim();
    } catch (error) {
      console.error('❌ GmailService: Error extracting text body:', error);
      return body.trim();
    }
  }

  // Get Gmail compose data (legacy method)
  async getComposeData() {
    try {
      if (!this.accessToken) {
        throw new Error('Gmail API not initialized');
      }

      // Get drafts to find current compose
      const response = await fetch(`${this.baseURL}/drafts`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get Gmail drafts');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting Gmail compose data:', error);
      throw error;
    }
  }

  // Send email via Gmail API
  async sendEmail(emailData) {
    try {
      if (!this.accessToken) {
        throw new Error('Gmail API not initialized');
      }

      const message = {
        raw: this.createRawMessage(emailData)
      };

      const response = await fetch(`${this.baseURL}/messages/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });

      if (!response.ok) {
        throw new Error('Failed to send email via Gmail API');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error sending email via Gmail API:', error);
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
      if (!this.accessToken) {
        throw new Error('Gmail API not initialized');
      }

      const response = await fetch(`${this.baseURL}/labels`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get Gmail labels');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting Gmail labels:', error);
      throw error;
    }
  }

  // Create label for billable tracking
  async createBillableLabel() {
    try {
      if (!this.accessToken) {
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
        throw new Error('Failed to create Gmail label');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating Gmail label:', error);
      throw error;
    }
  }

  // Add label to message
  async addLabelToMessage(messageId, labelId) {
    try {
      if (!this.accessToken) {
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
        throw new Error('Failed to add label to message');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error adding label to message:', error);
      throw error;
    }
  }
}

export default new GmailService(); 