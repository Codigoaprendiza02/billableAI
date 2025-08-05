# Clio OAuth Setup Guide

## Current Issue
The Clio OAuth is failing because:
1. Authentication check was not working properly (FIXED)
2. Clio client ID is not configured (NEEDS SETUP)

## Step 1: Fix Authentication Check (COMPLETED)
✅ I've updated the `oauthService.js` to properly check authentication using multiple methods:
- simpleAuth.isAuthenticated()
- simpleAuth.getAuthToken()
- localStorage fallback

## Step 2: Set Up Clio OAuth Application

### Option A: Use Clio Developer Account (Recommended)

1. **Create Clio Developer Account**:
   - Go to: https://app.clio.com/developers
   - Sign up for a developer account
   - Create a new application

2. **Configure OAuth Settings**:
   - Redirect URI: `http://127.0.0.1:3001/api/auth/clio/callback`
   - Scopes: `profile matters clients time_entries`
   - Get your Client ID and Client Secret

3. **Update Backend Configuration**:
   Edit `backend/env.local`:
   ```bash
   CLIO_CLIENT_ID=your_actual_clio_client_id
   CLIO_CLIENT_SECRET=your_actual_clio_client_secret
   ```

### Option B: Use Test Credentials (Quick Test)

For testing purposes, you can use these test credentials:

```bash
# In backend/env.local
CLIO_CLIENT_ID=test_clio_client_id
CLIO_CLIENT_SECRET=test_clio_client_secret
```

## Step 3: Test the Fix

1. **Start the backend server**:
   ```bash
   cd backend
   node src/index.js
   ```

2. **Start the extension**:
   ```bash
   cd extension
   npm run dev
   ```

3. **Test authentication**:
   - Open the extension
   - Register/login
   - Try connecting to Clio

4. **Use the test page**:
   - Open `extension/test-auth-status.html` in your browser
   - Click "Check Authentication" to verify auth status
   - Click "Test Clio OAuth" to test the OAuth flow

## Step 4: Verify the Fix

The authentication check should now work properly. The OAuth service will:

1. ✅ Check authentication using multiple methods
2. ✅ Provide detailed logging for debugging
3. ✅ Fall back to localStorage if simpleAuth fails
4. ✅ Only proceed if user is authenticated

## Troubleshooting

### If you still get "User must be authenticated":
1. Check the browser console for detailed authentication logs
2. Use the test page to verify auth status
3. Make sure you've registered/logged in through the extension
4. Check if localStorage has the auth tokens

### If Clio OAuth fails after authentication:
1. Verify Clio client ID is properly configured
2. Check that the redirect URI matches exactly
3. Ensure the backend server is running
4. Check browser console for OAuth errors

## Quick Test Commands

```bash
# Test backend authentication
cd backend
node simple-test.js

# Test full auth flow
node test-auth-flow.js

# Check if server is running
curl http://localhost:3001/health
```

## Expected Behavior After Fix

1. ✅ User registers/logs in successfully
2. ✅ Authentication is properly stored and detected
3. ✅ Clio OAuth button works when user is authenticated
4. ✅ OAuth flow opens Clio authorization page
5. ✅ After authorization, user is connected to Clio
6. ✅ Disconnect button works to remove Clio connection 