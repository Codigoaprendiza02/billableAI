# 🎯 FINAL GUIDE: Load BillableAI Extension

## ✅ Files Verified - All Correct!
The extension files are perfect. The issue is that Chrome doesn't have the extension loaded.

## 🚀 CRITICAL: Load Extension in Chrome

### Step 1: Open Chrome Extensions Page
1. Open Chrome browser
2. Type `chrome://extensions/` in the address bar
3. Press Enter

### Step 2: Enable Developer Mode
1. Look for "Developer mode" toggle in top-right corner
2. Turn it ON (should turn blue)
3. This enables "Load unpacked" button

### Step 3: Remove Old Extension (if exists)
1. Look for any existing "BillableAI" in the list
2. If found, click "Remove" to delete it
3. This ensures clean installation

### Step 4: Load the Extension
1. Click the "Load unpacked" button (blue button)
2. Navigate to: `C:\Users\riyan\OneDrive\Desktop\BillableAI\extension\dist`
3. **CRITICAL**: Select the `dist` folder itself, NOT the parent folder
4. Click "Select Folder"

### Step 5: Verify Extension is Loaded
1. You should see "BillableAI" appear in the extensions list
2. The toggle next to it should be ON (enabled)
3. There should be NO red error messages
4. If there are errors, click "Errors" button and read them

## 🎯 Expected Results

### In chrome://extensions/:
- ✅ "BillableAI" appears in the list
- ✅ Toggle is ON (enabled)
- ✅ No red error messages
- ✅ Extension shows version 1.0.0

### In test page:
- ✅ Open `extension/test-simple-extension.html`
- ✅ Should show "✅ Extension is loaded!"
- ✅ Should show "✅ Content script is injected!"

## 🔧 If Still Not Working

### Issue 1: "Load unpacked" doesn't work
- Make sure you selected the `dist` folder (not parent)
- Make sure Developer mode is ON
- Try refreshing the extensions page

### Issue 2: Extension loads but shows errors
- Click "Errors" button next to extension
- Share the error messages with me
- Common errors:
  - "Manifest file is missing" = Wrong folder selected
  - "Invalid manifest" = File corruption
  - "Permission denied" = Chrome security issue

### Issue 3: Extension loads but test page still shows "Extension not loaded"
- Make sure you're using the SAME Chrome window
- Try opening test page in new tab
- Check console for errors (F12 → Console)

## 📋 Quick Test

After loading the extension:

1. **Test 1**: Open `chrome://extensions/` - should see BillableAI
2. **Test 2**: Open `extension/test-simple-extension.html` - should show ✅
3. **Test 3**: Click extension icon in toolbar - should open popup

## 🚨 Common Mistakes

- ❌ Selecting parent folder instead of `dist` folder
- ❌ Not enabling Developer mode
- ❌ Not removing old extension first
- ❌ Opening test page in different Chrome window

## 🎉 Success Indicators

When the extension is properly loaded:
- ✅ Extension appears in chrome://extensions/
- ✅ Test page shows "✅ Extension is loaded!"
- ✅ `chrome.runtime` is available
- ✅ `window.billableAI` object exists

**The extension files are perfect. The only issue is loading it in Chrome!** 