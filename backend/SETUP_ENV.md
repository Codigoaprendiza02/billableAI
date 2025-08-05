# Environment Variables Setup Guide

## 🔧 **Step 1: Create .env File**

Create a `.env` file in the `backend` directory with the following content:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/billableai

# OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
CLIO_CLIENT_ID=your_clio_client_id
CLIO_CLIENT_SECRET=your_clio_client_secret

# Extension Configuration
EXTENSION_ID=bcpopkbljafiiclbkhkcpegmlhdpknfd

# AI Services
GEMINI_API_KEY=your_gemini_api_key

# JWT Secret
JWT_SECRET=billableai_jwt_secret_2024_abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890

# Email Configuration (for OTP)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# SMS Configuration (for OTP)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# CORS
ALLOWED_ORIGINS=http://localhost:5173,chrome-extension://*
```

## 🔧 **Step 2: Google OAuth Setup**

### 2.1 Get Google Client ID and Secret
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **"Create Credentials"** → **"OAuth 2.0 Client IDs"**
5. Choose **"Chrome Extension"** as application type
6. Enter your extension name: `BillableAI`
7. Copy the **Client ID** and **Client Secret**

### 2.2 Configure Redirect URIs
**IMPORTANT**: Do NOT add your extension ID to "Authorized Origins"

Instead, add these to **"Authorized redirect URIs"**:

```
https://bcpopkbljafiiclbkhkcpegmlhdpknfd.chromiumapp.org/
```

### 2.3 Update .env File
Replace `your_google_client_id_here` and `your_google_client_secret_here` with your actual values.

## 🔧 **Step 3: Email Setup (for OTP)**

### 3.1 Gmail App Password
1. Go to your Google Account settings
2. Navigate to **Security** → **2-Step Verification**
3. Generate an **App Password** for "Mail"
4. Use this password as `EMAIL_PASS`

### 3.2 Update .env File
Replace `your_email@gmail.com` and `your_app_password` with your actual values.

## 🔧 **Step 4: Extension ID**

The extension ID is already set to `bcpopkbljafiiclbkhkcpegmlhdpknfd`. If you have a different extension ID, update the `EXTENSION_ID` variable.

## 🔧 **Step 5: Test Configuration**

Run the comprehensive test:

```bash
cd backend
node test-google-oauth-comprehensive.js
```

## 🚨 **Common Issues & Solutions**

### Issue: "Google authentication failed"
**Solution**: 
- Make sure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set correctly
- Verify the redirect URI in Google Cloud Console matches: `https://bcpopkbljafiiclbkhkcpegmlhdpknfd.chromiumapp.org/`
- Don't add extension ID to "Authorized Origins"

### Issue: "Failed to send OTP"
**Solution**:
- Set `EMAIL_USER` and `EMAIL_PASS` correctly
- In development mode, OTP will be logged to console if email credentials are not set

### Issue: CORS errors
**Solution**:
- Make sure the backend server is running on port 3001
- Check that CORS is properly configured in `backend/src/index.js`

## ✅ **Verification Checklist**

- [ ] `.env` file created with all required variables
- [ ] Google OAuth credentials configured
- [ ] Email credentials configured (or using dev mode)
- [ ] Extension ID set correctly
- [ ] Backend server running on port 3001
- [ ] Comprehensive test passes
- [ ] Extension can authenticate with Google
- [ ] Email OTP works (or logs to console in dev mode) 