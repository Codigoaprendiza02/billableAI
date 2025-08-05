# 🚀 STEP-BY-STEP: Load BillableAI Extension

## ❌ Current Issue
The extension is showing "Extension not loaded" which means Chrome doesn't recognize it.

## ✅ Solution: Complete Extension Loading Process

### Step 1: Remove Old Extension (if exists)
1. Go to `chrome://extensions/`
2. Look for any existing "BillableAI" extension
3. If found, click "Remove" to delete it completely
4. This ensures a clean installation

### Step 2: Enable Developer Mode
1. In `chrome://extensions/`, look for "Developer mode" toggle
2. Turn it ON (should be blue)
3. This enables "Load unpacked" functionality

### Step 3: Load the Extension
1. Click the "Load unpacked" button (blue button)
2. Navigate to: `C:\Users\riyan\OneDrive\Desktop\BillableAI\extension\dist`
3. **IMPORTANT**: Select the `dist` folder itself, not the parent folder
4. Click "Select Folder"

### Step 4: Verify Extension is Loaded
1. You should see "BillableAI" appear in the extensions list
2. The toggle next to it should be ON (enabled)
3. There should be NO red error messages
4. If there are errors, note them down

### Step 5: Test the Extension
1. Open `extension/test-simple-extension.html` in Chrome
2. You should see "✅ Extension is loaded!" instead of "❌ Extension not loaded"
3. If still showing "Extension not loaded", the extension wasn't loaded properly

## 🔧 Troubleshooting

### If "Load unpacked" doesn't work:
1. Make sure you selected the `dist` folder (not parent)
2. Check that all files exist in the dist folder
3. Try refreshing the extensions page

### If extension loads but shows errors:
1. Click the "Errors" button next to the extension
2. Read the error messages
3. Common errors:
   - "Manifest file is missing or unreadable" = Wrong folder selected
   - "Invalid manifest" = manifest.json has errors
   - "Permission denied" = Missing permissions

### If extension loads but test page still shows "Extension not loaded":
1. Make sure you're opening the test page in the SAME Chrome window
2. Try opening the test page in a new tab
3. Check if there are any console errors (F12 → Console)

## 📋 Verification Checklist

After loading the extension, verify:

- [ ] Extension appears in `chrome://extensions/` list
- [ ] Extension toggle is ON (enabled)
- [ ] No red error messages in extension details
- [ ] Test page shows "✅ Extension is loaded!"
- [ ] `chrome.runtime` is available in test pages

## 🎯 Expected Result

After following these steps:
- ✅ Extension should be loaded in Chrome
- ✅ Test page should show "✅ Extension is loaded!"
- ✅ Content script injection should work
- ✅ All API functions should be available

**If you're still having issues, please share:**
1. Screenshot of `chrome://extensions/` page
2. Any error messages shown in extension details
3. Console errors from the test page (F12 → Console) 