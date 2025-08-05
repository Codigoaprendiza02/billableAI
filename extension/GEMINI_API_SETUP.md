# Gemini API Setup Guide

## 🎯 Getting Real Gemini Responses

The extension now automatically loads the Gemini API key from the backend environment file. To get real Gemini 2.5 Pro responses instead of fallback responses, you need to configure the API key in the backend.

### Step 1: Get a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click on "Get API key" in the top right
4. Create a new API key or use an existing one
5. Copy the API key (starts with `AIza...`)

### Step 2: Get a Google OAuth Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Gmail API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Choose "Chrome Extension" as application type
6. Enter your extension ID (get it from `chrome://extensions/`)
7. Copy the Client ID (starts with numbers and ends with `.apps.googleusercontent.com`)

### Step 3: Set the API Keys in Backend

1. Open `backend/env.local`
2. Update both keys:
   ```
   GEMINI_API_KEY=AIzaSyBYourRealGeminiAPIKeyHere
   GOOGLE_CLIENT_ID=123456789012-abcdefghijklmnop.apps.googleusercontent.com
   ```
3. Save the file

### Step 4: Build the Extension

1. Navigate to the extension directory: `cd extension`
2. Run the build script: `node build-extension.js`
3. This will update `manifest.json` with the actual Google Client ID

### Step 5: Start the Backend Server

1. Navigate to the backend directory: `cd backend`
2. Install dependencies if not already done: `npm install`
3. Start the server: `npm start` or `node src/index.js`
4. Verify the server is running: `http://localhost:3001/health`

### Step 6: Test the Integration

1. Reload the extension
2. Compose an email in Gmail
3. Send the email
4. Open the Assistant in the extension
5. You should see "Connected" status instead of "Fallback Mode"
6. The summary should be generated using real Gemini 2.5 Pro

### Expected Results

- **Status Badge**: Should show "Connected" (green) instead of "Fallback Mode" (yellow)
- **Response Quality**: Much more detailed and professional summaries
- **Real-time Processing**: Faster and more accurate analysis
- **OAuth Flow**: Should work properly for Gmail integration

### How It Works

1. **Backend Priority**: The extension first tries to fetch the API key from `http://localhost:3001/api/config/config`
2. **Build Process**: The build script replaces `{{GOOGLE_CLIENT_ID}}` in manifest.json with the actual value
3. **OAuth Integration**: Uses the Google Client ID for Gmail OAuth authentication
4. **localStorage Fallback**: If backend is not available, it falls back to localStorage
5. **Internal Fallback**: If neither works, it uses internal fallback responses

### Troubleshooting

If you still see fallback responses:

1. **Check Backend Server**:
   - Ensure backend is running on port 3001
   - Test: `curl http://localhost:3001/health`

2. **Check API Keys**:
   - Verify both keys are set in `backend/env.local`
   - Ensure they are valid (not placeholder values)

3. **Check Build Process**:
   - Run the build script: `node build-extension.js`
   - Verify manifest.json contains actual values, not placeholders

4. **Check Network**:
   - Extension should be able to reach `localhost:3001`
   - Check browser console for network errors

5. **Check Console Logs**:
   - Look for: "Gemini 2.5 Pro API key loaded from backend"
   - If not found, check for error messages

### API Key Security

- The API keys are stored securely in the backend environment
- The extension fetches them via a secure endpoint
- Never expose the API keys in frontend code
- The backend serves only the necessary configuration
- The build process ensures proper OAuth2 configuration 