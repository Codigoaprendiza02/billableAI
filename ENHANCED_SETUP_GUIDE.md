# Enhanced BillableAI Setup Guide

## Overview

This guide covers the enhanced BillableAI functionality with Gmail API integration, Gemini AI-powered summaries, and one-click Clio billing.

## Features Implemented

### ✅ Gmail API Integration
- Real-time email composition tracking
- Draft creation and management
- Email content analysis for billable keywords
- Automatic time tracking during email writing

### ✅ Gemini AI Integration
- AI-powered billing summaries
- Client and matter suggestions
- Enhanced email content analysis
- Professional legal billing language

### ✅ One-Click Clio Billing
- Automatic client detection by email
- Matter creation and association
- Time entry logging to Clio
- Complete billing workflow automation

### ✅ Extension Background Service
- Continuous monitoring in Gmail
- Real-time activity tracking
- Automatic content script injection
- Enhanced user notifications

## Prerequisites

### 1. Environment Setup
```bash
# Backend dependencies
cd backend
npm install axios express cors dotenv

# Extension dependencies
cd extension
npm install
```

### 2. Environment Variables
Create `.env` file in backend directory:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Clio OAuth
CLIO_CLIENT_ID=your_clio_client_id
CLIO_CLIENT_SECRET=your_clio_client_secret

# Gemini API
GEMINI_API_KEY=your_gemini_api_key

# JWT Secret
JWT_SECRET=your_jwt_secret

# Database
MONGODB_URI=your_mongodb_uri
```

### 3. Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Gmail API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/google/callback`
   - `chrome-extension://your-extension-id/oauth2.html`

### 4. Clio API Setup
1. Go to [Clio Developer Portal](https://app.clio.com/api/v4/documentation)
2. Create a new application
3. Get Client ID and Client Secret
4. Add redirect URI: `http://localhost:3000/api/auth/clio/callback`

### 5. Gemini API Setup
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create API key
3. Add to environment variables

## Installation Steps

### Step 1: Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Start the server
npm start
```

### Step 2: Extension Setup
```bash
cd extension

# Install dependencies
npm install

# Build extension
npm run build
```

### Step 3: Load Extension in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension/public` directory

### Step 4: Configure Extension
1. Click on the BillableAI extension icon
2. Go to Settings
3. Configure Gmail and Clio OAuth
4. Add your Gemini API key

## API Endpoints

### Email Tracking
- `POST /api/email-tracking/start-composition` - Start Gmail composition tracking
- `POST /api/email-tracking/update-composition` - Update email draft
- `POST /api/email-tracking/activity` - Monitor email activity
- `POST /api/email-tracking/stop-composition` - Stop tracking and generate summary
- `POST /api/email-tracking/one-click-billing` - Complete one-click billing workflow

### Gmail Integration
- `GET /api/gmail/threads` - Get Gmail threads
- `GET /api/gmail/messages/:id` - Get email content
- `POST /api/gmail/send` - Send email via Gmail API

### Clio Integration
- `GET /api/clio/clients` - Get Clio clients
- `GET /api/clio/matters` - Get Clio matters
- `POST /api/clio/time-entries` - Log time entry to Clio

## Usage Guide

### 1. Start Email Tracking
When you compose an email in Gmail:
1. The extension automatically detects email composition
2. Starts tracking time spent writing
3. Creates a Gmail draft for tracking
4. Monitors typing activity

### 2. Generate Billing Summary
When you finish writing:
1. Stop tracking (automatically or manually)
2. AI analyzes email content for billable keywords
3. Generates professional billing summary
4. Suggests client and matter associations

### 3. One-Click Billing
To log time to Clio:
1. Click "One-Click Billing" button
2. System finds client by email address
3. Creates or associates with existing matter
4. Logs time entry with AI-generated summary
5. Sends email via Gmail API

## Testing

### Run Comprehensive Tests
```bash
cd backend
node test-enhanced-functionality.js
```

### Test Individual Components
```bash
# Test Gmail API
node test-gmail-api.js

# Test Gemini AI
node test-gemini-ai.js

# Test Clio Integration
node test-clio-integration.js

# Test Extension
node test-extension.js
```

## Troubleshooting

### Common Issues

#### 1. Gmail API Not Working
- Check OAuth credentials
- Verify Gmail API is enabled
- Ensure extension has proper permissions

#### 2. Gemini AI Not Responding
- Verify API key is correct
- Check API quota limits
- Ensure proper error handling

#### 3. Clio Integration Failing
- Verify Clio API credentials
- Check client/matter permissions
- Ensure proper OAuth flow

#### 4. Extension Not Loading
- Check manifest.json configuration
- Verify content script injection
- Check browser console for errors

### Debug Mode
Enable debug logging:
```javascript
// In extension tracking script
window.billableAIState.debug = true;

// In backend
process.env.DEBUG = 'true';
```

## Security Considerations

### 1. OAuth Tokens
- Store tokens securely
- Implement token refresh
- Handle token expiration

### 2. API Keys
- Use environment variables
- Never commit keys to version control
- Implement rate limiting

### 3. Data Privacy
- Encrypt sensitive data
- Implement proper authentication
- Follow GDPR compliance

## Performance Optimization

### 1. Extension Performance
- Minimize DOM manipulation
- Use efficient event listeners
- Implement debouncing for typing events

### 2. Backend Performance
- Implement caching for API responses
- Use connection pooling for database
- Optimize AI model calls

### 3. Gmail API Optimization
- Batch API calls where possible
- Implement retry logic
- Cache frequently accessed data

## Monitoring and Logging

### 1. Application Logs
```javascript
// Backend logging
const { log } = require('./utils/logger.js');
log('User action', { userId, action, timestamp });

// Extension logging
console.log('🎯 BillableAI:', 'User action', data);
```

### 2. Error Tracking
- Implement error boundaries
- Log errors with context
- Set up error monitoring

### 3. Performance Monitoring
- Track API response times
- Monitor memory usage
- Measure user interaction metrics

## Deployment

### 1. Backend Deployment
```bash
# Production build
npm run build

# Start production server
npm start
```

### 2. Extension Deployment
```bash
# Build for production
npm run build:prod

# Package extension
npm run package
```

### 3. Environment Configuration
- Set production environment variables
- Configure SSL certificates
- Set up monitoring and logging

## Support and Maintenance

### 1. Regular Updates
- Keep dependencies updated
- Monitor API changes
- Update OAuth configurations

### 2. Backup and Recovery
- Regular database backups
- Configuration backups
- Disaster recovery plan

### 3. User Support
- Provide user documentation
- Set up support channels
- Monitor user feedback

## Conclusion

The enhanced BillableAI system provides a comprehensive solution for legal professionals to track time, generate billing summaries, and integrate with Clio seamlessly. The combination of Gmail API integration, Gemini AI, and one-click billing creates a powerful workflow that saves time and improves accuracy.

For additional support or questions, please refer to the documentation or contact the development team. 