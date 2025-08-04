# 🔐 Secure Environment Setup Guide

## Overview
This guide explains how to securely configure your environment variables without exposing sensitive keys in the codebase.

## 🔑 Environment Variables Setup

### 1. Existing `.env` file
The `backend/.env` file contains your actual credentials and should **NOT** be modified:
- ✅ **Keep existing credentials** in `.env` file
- ✅ **Do not delete or update** the `.env` file
- ✅ **Use existing keys** for development and production
- ✅ **Backup your credentials** before any changes

### 2. Security Best Practices

#### ✅ DO:
- Keep existing `.env` file with actual credentials
- Use `.env` file for runtime configuration
- Use placeholder variables in `env.local` for documentation
- Reference environment variables in code, not hardcoded values
- Backup your credentials securely

#### ❌ DON'T:
- Modify the existing `.env` file
- Delete the `.env` file
- Commit actual credentials to version control
- Hardcode API keys in source code
- Share `.env` files with sensitive data

### 3. File Structure

```
backend/
├── .env                    # 🔐 ACTUAL CREDENTIALS (DO NOT MODIFY)
├── env.local              # 📝 PLACEHOLDER TEMPLATE (committed)
├── src/
│   └── config.js          # 🔧 LOADS FROM .env
└── SECURE_SETUP.md        # 📖 THIS GUIDE
```

### 4. Extension Build Process

The extension build process:
1. Reads from existing backend `.env` file
2. Fetches configuration via API
3. Replaces placeholders in `manifest.json`
4. Builds extension with secure configuration

### 5. Environment Variable References

#### Backend Configuration (`src/config.js`)
```javascript
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
export const CLIO_CLIENT_ID = process.env.CLIO_CLIENT_ID;
```

#### Extension Manifest (`public/manifest.json`)
```json
{
  "oauth2": {
    "client_id": "{{GOOGLE_CLIENT_ID}}"
  }
}
```

#### Build Script (`build-extension.js`)
```javascript
// Fetches from backend API and replaces placeholders
manifestContent = manifestContent.replace('{{GOOGLE_CLIENT_ID}}', config.googleClientId);
```

## 🚀 Quick Setup

1. **Verify `.env` file exists** with your actual credentials
2. **Start backend:**
   ```bash
   cd backend
   npm start
   ```
3. **Build extension:**
   ```bash
   cd ../extension
   npm run build:extension
   ```

## 🔒 Security Checklist

- [x] `.env` file exists with actual credentials
- [x] `.env` added to `.gitignore`
- [x] No hardcoded credentials in source code
- [x] Environment variables used throughout codebase
- [x] Placeholder template in `env.local` for documentation
- [x] Backend API serves configuration securely
- [x] Extension build process uses environment variables
- [x] Existing `.env` file preserved and not modified

## 🛡️ Additional Security Measures

1. **Credential protection:**
   - Keep existing `.env` file secure
   - Backup credentials before any changes
   - Use environment-specific keys when possible

2. **Secret rotation:**
   - Regular key rotation
   - Environment-specific keys
   - Access logging

3. **Access control:**
   - Limited API access
   - CORS configuration
   - Rate limiting

## 📞 Support

If you need help with secure configuration:
1. Check this guide
2. Verify `.env` file exists and is not modified
3. Ensure backend is running
4. Test configuration endpoint 