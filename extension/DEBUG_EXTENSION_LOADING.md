# Debugging Extension Loading Issues

## Problem
The content script (`tracking-script.js`) is not being injected into local HTML files, resulting in "BillableAI extension not detected" errors.

## Steps to Debug

### 1. Check Extension Installation
1. Open Chrome and go to `chrome://extensions/`
2. Look for "BillableAI" extension
3. Make sure it's enabled (toggle should be ON)
4. Check if there are any error messages in red

### 2. Reload the Extension
1. In `chrome://extensions/`, find the BillableAI extension
2. Click the reload button (🔄) next to the extension
3. This will reload the extension with the latest built files

### 3. Check Extension Files
1. In `chrome://extensions/`, click "Details" on the BillableAI extension
2. Scroll down to "Inspect views"
3. Click on "background page" to open DevTools
4. Check the Console tab for any errors

### 4. Test Extension Loading
1. Open `extension/test-extension-loaded.html` in Chrome
2. This will test if the extension is loaded and accessible
3. Check the console for any error messages

### 5. Check Content Script Injection
1. Open `extension/test-injection.html` in Chrome
2. This will test if the content script is being injected
3. Look for the "🎯 BillableAI: Tracking logic injected into page context" message in console

### 6. Manual Content Script Test
1. Open Chrome DevTools (F12)
2. Go to the Console tab
3. Type: `typeof window.billableAI`
4. Should return "object" if content script is injected

## Common Issues

### Issue 1: Extension Not Loaded
- **Symptom**: `chrome.runtime` not available
- **Solution**: Reload the extension in `chrome://extensions/`

### Issue 2: Content Script Not Injected
- **Symptom**: `window.billableAI` is undefined
- **Possible Causes**:
  - Extension not reloaded after build
  - Manifest.json has syntax errors
  - Content script has JavaScript errors

### Issue 3: File Protocol Issues
- **Symptom**: Content script works on localhost but not file:// URLs
- **Solution**: Check manifest.json has `"file://*"` in content_scripts matches

## Debugging Commands

### Check Extension Status
```javascript
// In Chrome DevTools Console
chrome.runtime.getManifest()
```

### Check Content Script
```javascript
// In Chrome DevTools Console
typeof window.billableAI
window.billableAIState
```

### Force Reload Extension
1. Go to `chrome://extensions/`
2. Enable Developer mode (top right)
3. Click "Load unpacked"
4. Select the `extension/dist` folder

## Test Files
- `test-extension-loaded.html` - Tests if extension is loaded
- `test-injection.html` - Tests if content script is injected
- `debug-extension.html` - Comprehensive debugging tool

## Next Steps
1. Reload the extension in Chrome
2. Test with `test-extension-loaded.html`
3. If extension loads, test with `test-injection.html`
4. If content script injects, test with `gmail-api-test.html` 