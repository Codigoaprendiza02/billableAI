# BillableAI Backend API

Complete backend implementation for the BillableAI Chrome Extension with OAuth authentication, Gmail integration, Clio API integration, and AI-powered email summarization.

## 🚀 Features

- **OAuth 2.0 Authentication** - Google Gmail and Clio integration
- **Gmail API Integration** - Read emails, fetch threads, process content
- **Clio API Integration** - Fetch clients/matters, log time entries
- **AI Summary Generation** - Template-based email summarization
- **JWT Authentication** - Secure token-based authentication
- **MongoDB Integration** - Store users, emails, summaries, and time logs
- **Token Refresh** - Automatic OAuth token refresh
- **Error Handling** - Comprehensive error handling and logging

## 📋 API Endpoints

### Authentication
- `POST /api/auth/google` - Google OAuth login
- `POST /api/auth/clio` - Clio OAuth connection
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/preferences` - Update user preferences

### Gmail Integration
- `GET /api/gmail/threads` - Fetch Gmail threads
- `POST /api/gmail/process` - Process email and generate summary
- `GET /api/gmail/messages/:messageId` - Get email content
- `GET /api/gmail/profile` - Get Gmail profile

### Clio Integration
- `GET /api/clio/clients` - Fetch Clio clients
- `GET /api/clio/matters` - Fetch Clio matters
- `POST /api/clio/log-time` - Log time entry to Clio
- `GET /api/clio/time-entries` - Get time entries
- `GET /api/clio/find-client` - Find client by email
- `GET /api/clio/profile` - Get Clio profile

### AI Services
- `POST /api/ai/summarize` - Generate email summary
- `POST /api/ai/suggest` - Generate client/matter suggestions
- `POST /api/ai/clean` - Clean email content

## 🛠️ Setup

### 1. Environment Variables
Copy `env.local` to `.env` and fill in your credentials:

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/billableai
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
CLIO_CLIENT_ID=your_clio_client_id
CLIO_CLIENT_SECRET=your_clio_client_secret
JWT_SECRET=your_jwt_secret_key_here
ALLOWED_ORIGINS=http://localhost:5173,chrome-extension://*
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Start Production Server
```bash
npm start
```

## 📊 Database Models

### User
- OAuth tokens for Gmail and Clio
- User preferences (email tone, auto-suggestions, etc.)
- Profile information

### Email
- Gmail thread information
- Email content and participants
- Typing time tracking

### Summary
- AI-generated summaries
- Status tracking (pending, confirmed, failed)
- Model information

### TimeLog
- Time entry records
- Clio integration status
- Client/matter associations

### SyncQueue
- Failed API attempts
- Retry logic for failed operations

## 🔐 Authentication Flow

1. **Google OAuth**: User authorizes Gmail access
2. **JWT Token**: Backend generates JWT for session management
3. **Clio OAuth**: User connects Clio account (requires JWT)
4. **Token Refresh**: Automatic refresh of expired OAuth tokens

## 🔄 API Usage Examples

### Google OAuth Login
```javascript
const response = await fetch('/api/auth/google', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code: 'authorization_code' })
});
```

### Process Email
```javascript
const response = await fetch('/api/gmail/process', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  },
  body: JSON.stringify({
    threadId: 'thread_id',
    messageId: 'message_id',
    typingTime: 1800, // seconds
    content: 'email_content'
  })
});
```

### Log Time Entry
```javascript
const response = await fetch('/api/clio/log-time', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  },
  body: JSON.stringify({
    emailId: 'email_id',
    summaryId: 'summary_id',
    matterId: 'matter_id',
    description: 'Time entry description',
    duration: 1800 // seconds
  })
});
```

## 🧪 Testing

### Health Check
```bash
curl http://localhost:3001/health
```

### Test Gmail API (with valid token)
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3001/api/gmail/threads
```

### Test Clio API (with valid token)
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3001/api/clio/clients
```

## 🔧 Configuration

### CORS Settings
Configure allowed origins in `.env`:
```env
ALLOWED_ORIGINS=http://localhost:5173,chrome-extension://*
```

### MongoDB Connection
Set your MongoDB URI:
```env
MONGODB_URI=mongodb://localhost:27017/billableai
```

## 📝 Logging

The backend uses a simple logging utility that outputs to console:
- API requests and responses
- OAuth token refresh events
- Error messages and stack traces
- Database operations

## 🚨 Error Handling

- **400 Bad Request**: Missing required fields
- **401 Unauthorized**: Invalid or missing JWT token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server-side errors

## 🔄 Token Refresh

The backend automatically handles OAuth token refresh:
- Checks token expiration before API calls
- Refreshes tokens using refresh tokens
- Updates database with new tokens
- Retries failed requests with new tokens

## 📈 Performance

- **Connection Pooling**: MongoDB connection pooling
- **Token Caching**: OAuth tokens cached in database
- **Error Retry**: Automatic retry for failed API calls
- **Request Validation**: Input validation for all endpoints

## 🔒 Security

- **JWT Authentication**: Secure token-based auth
- **OAuth 2.0**: Industry-standard OAuth flows
- **CORS Protection**: Configured CORS for Chrome extension
- **Input Validation**: Request body validation
- **Error Sanitization**: Sanitized error messages

## 🚀 Deployment

### Environment Variables
Set all required environment variables in production.

### Database
Use MongoDB Atlas or self-hosted MongoDB.

### Process Manager
Use PM2 or similar for production deployment:
```bash
npm install -g pm2
pm2 start src/index.js --name billableai-backend
```

## 📞 Support

For issues or questions:
1. Check the logs for error details
2. Verify environment variables are set correctly
3. Ensure OAuth credentials are valid
4. Check MongoDB connection 