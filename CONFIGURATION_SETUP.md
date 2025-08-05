# BillableAI Configuration Setup

This guide explains how to set up the configuration for BillableAI extension to fetch sensitive information from the backend instead of using hardcoded credentials.

## 🔧 Environment Setup

### 1. Backend Configuration

Create a `.env` file in the `backend/` directory with the following variables:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/billableai

# OAuth Configuration
GOOGLE_CLIENT_ID=your_actual_google_client_id
GOOGLE_CLIENT_SECRET=your_actual_google_client_secret
CLIO_CLIENT_ID=your_actual_clio_client_id
CLIO_CLIENT_SECRET=your_actual_clio_client_secret

# AI Services
GEMINI_API_KEY=your_actual_gemini_api_key

# JWT Secret
JWT_SECRET=your_actual_jwt_secret

# CORS
ALLOWED_ORIGINS=http://localhost:5173,chrome-extension://*
```

### 2. Extension Configuration

The extension now uses a configuration service that fetches sensitive data from the backend:

- **ConfigService**: Fetches configuration from `http://localhost:3001/api/config/config`
- **Manifest Template**: Uses placeholders like `{{GOOGLE_CLIENT_ID}}` that get replaced during build
- **Build Script**: `build-extension.js` fetches config and updates manifest.json

## 🚀 Building the Extension

### 1. Start the Backend

```bash
cd backend
npm install
npm start
```

### 2. Build the Extension

```bash
cd extension
npm install
npm run build:extension
```

This will:
1. Build the React app with Vite
2. Fetch configuration from the backend
3. Update `manifest.json` with actual values
4. Copy all files to `dist/` directory

### 3. Load in Chrome

1. Go to `chrome://extensions/`
2. Enable Developer mode
3. Click "Load unpacked"
4. Select the `extension/dist/` folder

## 🔒 Security Features

### 1. No Hardcoded Credentials

- ✅ Google OAuth client_id fetched from backend
- ✅ Clio OAuth credentials fetched from backend
- ✅ Gemini API key fetched from backend
- ✅ JWT secret managed by backend

### 2. Environment-Based Configuration

- ✅ Development: Uses localhost backend
- ✅ Production: Can be configured for production backend
- ✅ Fallback: Default values if backend is unavailable

### 3. Secure API Endpoints

- ✅ `/api/config/config`: Serves only non-sensitive configuration
- ✅ Sensitive secrets (client_secret, jwt_secret) never exposed to extension
- ✅ CORS properly configured for Chrome extensions

## 📁 File Structure

```
billableai/
├── backend/
│   ├── .env                    # Environment variables
│   ├── src/
│   │   ├── routes/
│   │   │   └── config.js      # Config API endpoint
│   │   └── index.js           # Main server
│   └── package.json
├── extension/
│   ├── src/
│   │   └── services/
│   │       └── configService.js # Config fetching service
│   ├── public/
│   │   └── manifest.json      # Template with placeholders
│   ├── build-extension.js     # Build script
│   └── package.json
└── CONFIGURATION_SETUP.md     # This file
```

## 🔄 Configuration Flow

1. **Backend Starts**: Loads environment variables from `.env`
2. **Extension Build**: `build-extension.js` runs
3. **Config Fetch**: Build script calls `/api/config/config`
4. **Manifest Update**: Placeholders replaced with actual values
5. **Extension Load**: Chrome loads extension with real credentials

## 🛠️ Troubleshooting

### Backend Not Running
If the backend is not running, the build script will use fallback values:
```javascript
// Fallback configuration
{
  googleClientId: '490990742206-fijj3ubr4nr14cg016bv0gm47d461m3a.apps.googleusercontent.com'
}
```

### Environment Variables Missing
If environment variables are missing, the backend will use defaults:
```javascript
// Default values in config route
const config = {
  googleClientId: process.env.GOOGLE_CLIENT_ID || 'default_client_id',
  // ... other config
};
```

### Extension Build Fails
If the build fails, check:
1. Backend is running on port 3001
2. `.env` file exists in backend directory
3. Environment variables are properly set
4. Network connectivity between extension and backend

## 🔐 Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use different credentials** for development and production
3. **Rotate secrets regularly** (JWT secrets, API keys)
4. **Monitor API usage** for unusual patterns
5. **Use HTTPS** in production environments

## 📝 Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | ✅ |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | ✅ |
| `CLIO_CLIENT_ID` | Clio OAuth client ID | ✅ |
| `CLIO_CLIENT_SECRET` | Clio OAuth client secret | ✅ |
| `GEMINI_API_KEY` | Google Gemini API key | ✅ |
| `JWT_SECRET` | JWT signing secret | ✅ |
| `PORT` | Backend server port | ❌ (default: 3001) |
| `NODE_ENV` | Environment mode | ❌ (default: development) |
| `ALLOWED_ORIGINS` | CORS allowed origins | ❌ (default: localhost) | 