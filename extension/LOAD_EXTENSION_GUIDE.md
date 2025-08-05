# How to Load the BillableAI Extension in Chrome

## Problem
The extension is not loaded in Chrome, so `chrome.runtime` is not available and content scripts are not being injected.

## Solution: Load the Extension Properly

### Step 1: Enable Developer Mode
1. Open Chrome and go to `chrome://extensions/`
2. Turn ON "Developer mode" (toggle in the top-right corner)

### Step 2: Remove Old Extension (if exists)
1. If you see "BillableAI" extension already listed, click "Remove"
2. This ensures we load the fresh version

### Step 3: Load the Extension
1. Click "Load unpacked" button
2. Navigate to your project folder: `C:\Users\riyan\OneDrive\Desktop\BillableAI\extension\dist`
3. Select the `dist` folder (not the parent folder)
4. Click "Select Folder"

### Step 4: Verify Extension is Loaded
1. You should see "BillableAI" appear in the extensions list
2. Make sure the toggle is ON (enabled)
3. Check that there are no red error messages

### Step 5: Test the Extension
1. Open `extension/test-extension-loaded.html` in Chrome
2. You should see "✅ Extension is loaded!" message
3. Open `extension/test-injection.html` to test content script injection

## Troubleshooting

### If Extension Doesn't Appear
- Make sure you selected the `dist` folder, not the parent folder
- Check that `manifest.json` exists in the `dist` folder
- Try refreshing the extensions page

### If Extension Shows Errors
- Click "Details" on the extension
- Check the error messages
- Make sure all required files are in the `dist` folder

### If Content Script Still Not Injected
- Reload the extension (click the reload button 🔄)
- Check the background script console for errors
- Verify the manifest.json has correct content_scripts configuration

## Expected Results
After following these steps:
- ✅ Extension should appear in `chrome://extensions/`
- ✅ `test-extension-loaded.html` should show "Extension is loaded!"
- ✅ `test-injection.html` should show "Content script injected!"
- ✅ `window.billableAI` should be available in the console

## Files That Should Be in dist/
- manifest.json
- background.js
- tracking-script.js
- popup.html
- popup.css
- popup.js
- images/ (folder with logo.png)

## Next Steps
1. Follow the steps above to load the extension
2. Test with the debugging files
3. Once working, test the Gmail API functionality 