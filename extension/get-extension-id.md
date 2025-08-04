# How to Find Your Chrome Extension ID

## Method 1: From Chrome Extensions Page
1. Open Chrome
2. Go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Find "BillableAI" in the list
5. Copy the ID shown under the extension name

## Method 2: From Extension URL
1. Open your extension popup
2. Right-click and "Inspect"
3. In the console, run: `chrome.runtime.id`
4. Copy the returned ID

## Method 3: From Manifest (if set)
If you have a `key` field in your manifest.json, the ID is derived from it.

## Once You Have the ID:
1. Go to Google Cloud Console
2. APIs & Services → Credentials
3. Edit your OAuth 2.0 Client ID
4. Add redirect URI: `https://<your-extension-id>.chromiumapp.org/`
5. Save the changes

## Example:
If your extension ID is `bcpopkbljafiiclbkhkcpegmlhdpknfd`, add:
`https://bcpopkbljafiiclbkhkcpegmlhdpknfd.chromiumapp.org/` 