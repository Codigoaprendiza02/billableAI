# Google OAuth Setup for Chrome Extensions

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

### 1.3 Create OAuth 2.0 Client ID for Chrome Extension
1. Go back to **Credentials**
2. Click **"Create Credentials"** → **"OAuth 2.0 Client IDs"**
3. Choose **"Chrome Extension"** as application type
4. Enter your extension name: `BillableAI`

### 1.4 Configure Redirect URIs
**IMPORTANT**: Do NOT add your extension ID to "Authorized Origins"

Instead, add these to **"Authorized redirect URIs"**:

```
https://bcpopkbljafiiclbkhkcpegmlhdpknfd.chromiumapp.org/
```

**Note**: Replace `bcpopkbljafiiclbkhkcpegmlhdpknfd` with your actual extension ID.

## 🔧 **Step 2: Get Your Extension ID**

### Method 1: Chrome Extensions Page
1. Open Chrome
2. Go to `chrome://extensions/`
3. Enable "Developer mode"
4. Find "BillableAI" and copy the ID

### Method 2: Extension URL
1. Load your extension
2. Right-click on the extension icon
3. Select "Inspect popup"
4. Look at the URL: `chrome-extension://[YOUR-EXTENSION-ID]/popup.html`

### Method 3: Manifest Key
Check your `manifest.json` file for the `key` field.

## 🔧 **Step 3: Update Environment Variables**

Add these to your `backend/.env` file:

```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
EXTENSION_ID=your_extension_id_here
```

## 🔧 **Step 4: Chrome Extension Manifest**

Make sure your `manifest.json` includes the necessary permissions:

```json
{
  "permissions": [
    "identity"
  ],
  "oauth2": {
    "client_id": "your_client_id_here.apps.googleusercontent.com",
    "scopes": [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile"
    ]
  }
}
```

## 🔧 **Step 5: Implementation Details**

### 5.1 Frontend (Chrome Extension)
The extension now uses the proper Chrome extension OAuth flow:

```javascript
// Get client ID from backend
const clientId = await getGoogleClientId();

// Use Chrome extension specific redirect URI
const redirectUri = `https://${chrome.runtime.id}.chromiumapp.org/`;

// Build OAuth URL
const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
authUrl.searchParams.set('client_id', clientId);
authUrl.searchParams.set('redirect_uri', redirectUri);
authUrl.searchParams.set('scope', 'email profile');
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('access_type', 'offline');
authUrl.searchParams.set('prompt', 'consent');

// Launch OAuth flow
chrome.identity.launchWebAuthFlow({
  url: authUrl.toString(),
  interactive: true
}, async (redirectUrl) => {
  // Handle the authorization code
});
```

### 5.2 Backend (Node.js)
The backend handles the authorization code exchange:

```javascript
// Exchange authorization code for tokens
const { tokens } = await googleClient.getToken({
  code,
  redirect_uri: `https://${EXTENSION_ID}.chromiumapp.org/`
});

// Get user info from Google
const oauth2 = google.oauth2({ version: 'v2', auth: googleClient });
const { data } = await oauth2.userinfo.get();
```

## 🔧 **Step 6: Testing**

### 6.1 Test Backend
```bash
cd backend
node test-google-oauth-comprehensive.js
```

### 6.2 Test Extension
1. Load the extension in Chrome
2. Try Google Sign-In
3. Check browser console and backend console for logs

## 🚨 **Common Issues & Solutions**

### Issue: "Invalid redirect_uri"
**Solution**: 
- Make sure the redirect URI in Google Cloud Console exactly matches: `https://[YOUR-EXTENSION-ID].chromiumapp.org/`
- Don't add the extension ID to "Authorized Origins"

### Issue: "Authorization code is required"
**Solution**:
- Check that the OAuth flow is completing properly
- Verify the extension ID is correct
- Check browser console for any errors

### Issue: "Google token exchange failed"
**Solution**:
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Check that the redirect URI matches exactly
- Ensure the OAuth consent screen is configured

### Issue: CORS errors
**Solution**:
- The backend CORS is configured for Chrome extensions
- Make sure the server is running on port 3001

## ✅ **Verification Checklist**

- [ ] OAuth consent screen configured
- [ ] OAuth 2.0 Client ID created for Chrome Extension
- [ ] Redirect URI added: `https://[YOUR-EXTENSION-ID].chromiumapp.org/`
- [ ] Extension ID not added to "Authorized Origins"
- [ ] Environment variables set correctly
- [ ] Backend server running
- [ ] Extension loaded in Chrome
- [ ] Google Sign-In works
- [ ] User data received from Google

## 📋 **Key Differences from Web OAuth**

1. **Redirect URI Format**: Chrome extensions use `https://[EXTENSION-ID].chromiumapp.org/`
2. **No "Authorized Origins"**: Don't add extension ID to authorized origins
3. **Chrome Identity API**: Use `chrome.identity.launchWebAuthFlow()` instead of popup windows
4. **Extension Permissions**: Require `"identity"` permission in manifest

## 🔍 **Debugging Tips**

1. **Check Browser Console**: Look for OAuth URL and redirect URL logs
2. **Check Backend Console**: Look for token exchange and user info logs
3. **Verify Extension ID**: Make sure it matches in all places
4. **Test Redirect URI**: The URI must match exactly between frontend and backend

## 📚 **References**

- [Google Identity Documentation](https://developers.google.com/identity/sign-in/web/sign-in)
- [Chrome Extension Identity API](https://developer.chrome.com/docs/extensions/reference/identity/)
- [OAuth 2.0 for Chrome Extensions](https://developer.chrome.com/docs/extensions/mv3/tut_oauth/) 