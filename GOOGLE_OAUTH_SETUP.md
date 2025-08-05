# Google OAuth Setup Guide

## 🔧 **Step 1: Google Cloud Console Configuration**

### 1.1 Create OAuth 2.0 Client ID
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **"Create Credentials"** → **"OAuth 2.0 Client IDs"**

### 1.2 Configure OAuth Consent Screen
1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **"External"** user type
3. Fill in required information:
   - App name: `BillableAI`
   - User support email: Your email
   - Developer contact information: Your email
4. Add scopes:
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
5. Add test users (your email)

### 1.3 Create OAuth 2.0 Client ID
1. Go back to **Credentials**
2. Click **"Create Credentials"** → **"OAuth 2.0 Client IDs"**
3. Choose **"Chrome Extension"** as application type
4. Enter your extension name: `BillableAI`

### 1.4 Configure Redirect URIs
**IMPORTANT**: Do NOT add your extension ID to "Authorized Origins"

Instead, add these to **"Authorized redirect URIs"**:

#### For Development:
```
http://localhost:3001/api/extension/auth/google
```

#### For Production (once you have your extension ID):
```
https://<your-extension-id>.chromiumapp.org/
```

### 1.5 Get Your Extension ID
1. Open Chrome
2. Go to `chrome://extensions/`
3. Enable "Developer mode"
4. Find "BillableAI" and copy the ID
5. Replace `<your-extension-id>` with your actual ID

## 🔧 **Step 2: Environment Variables**

### 2.1 Update Backend Environment
Add these to your `backend/.env` file:

```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

### 2.2 Get Credentials
1. Copy the **Client ID** from Google Cloud Console
2. Copy the **Client Secret** from Google Cloud Console
3. Paste them in your `.env` file

## 🔧 **Step 3: Extension Configuration**

### 3.1 Update Extension Code
The extension will automatically fetch the Client ID from the backend API.

### 3.2 Test Configuration
Run the backend test to verify:
```bash
cd backend
node check-google-config.js
```

## 🔧 **Step 4: Testing**

### 4.1 Test Backend
```bash
cd backend
node test-google-oauth.js
```

### 4.2 Test Extension
1. Reload your Chrome extension
2. Try Google Sign-In
3. Check backend console for any errors

## 🚨 **Common Issues & Solutions**

### Issue: "Invalid Origin" Error
**Solution**: Don't add extension ID to "Authorized Origins". Only use redirect URIs.

### Issue: "Redirect URI Mismatch"
**Solution**: Make sure the redirect URI in your code matches exactly what's in Google Cloud Console.

### Issue: "Access Denied"
**Solution**: Add your email to test users in OAuth consent screen.

## ✅ **Verification Checklist**

- [ ] OAuth consent screen configured
- [ ] OAuth 2.0 Client ID created
- [ ] Redirect URIs added (localhost for dev)
- [ ] Environment variables set
- [ ] Backend test passes
- [ ] Extension can fetch Client ID
- [ ] Google Sign-In works in extension 