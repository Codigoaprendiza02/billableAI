# Quick Fix Guide for Google OAuth & Email OTP

## 🚨 **Current Status:**
- ✅ Backend API is working correctly
- ✅ Email OTP is functional
- ✅ Google OAuth endpoint is ready
- ❌ Extension needs proper Google OAuth configuration

## 🔧 **Step 1: Get Your Extension ID**

1. Open Chrome
2. Go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Find "BillableAI" in the list
5. Copy the ID (e.g., `bcpopkbljafiiclbkhkcpegmlhdpknfd`)

## 🔧 **Step 2: Update Google Cloud Console**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Edit your OAuth 2.0 Client ID
4. **Remove** any `chrome-extension://` entries from "Authorized Origins"
5. **Add** to "Authorized redirect URIs":
   ```
   https://<your-extension-id>.chromiumapp.org/
   ```
   (Replace `<your-extension-id>` with your actual ID)

## 🔧 **Step 3: Update Backend Configuration**

1. Open `backend/src/routes/extension.js`
2. Find line with `const redirectUri = 'https://<your-extension-id>.chromiumapp.org/';`
3. Replace `<your-extension-id>` with your actual extension ID

## 🔧 **Step 4: Restart and Test**

1. Restart the backend server:
   ```bash
   cd backend
   taskkill /F /IM node.exe
   start node src/index.js
   ```

2. Reload the Chrome extension:
   - Go to `chrome://extensions/`
   - Click "Reload" on BillableAI

3. Test both authentication methods:
   - **Email OTP**: Should work immediately
   - **Google OAuth**: Should work after configuration

## 🎯 **Expected Results:**

- ✅ Email OTP: No more 500 errors
- ✅ Google OAuth: Proper OAuth flow
- ✅ Both methods should authenticate successfully

## 🚨 **If Still Having Issues:**

1. Check browser console for specific error messages
2. Verify extension ID is correct
3. Ensure Google Cloud Console configuration is saved
4. Make sure backend server is running on port 3001 