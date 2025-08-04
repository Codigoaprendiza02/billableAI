# BillableAI Modular Debug Guide

## Overview

This guide helps you debug the modular tracking system and identify where extension loading issues occur. The system has been divided into smaller, manageable chunks for easier debugging.

## Modular Architecture

The tracking system is now split into 5 main modules:

### 1. Core Module (`tracking-core.js`)
- **Purpose**: State management and localStorage operations
- **Exposes**: `window.billableAICore`
- **Functions**: `safeLocalStorageSet`, `safeLocalStorageGet`, `updateTrackingStatus`

### 2. Gmail API Module (`tracking-gmail-api.js`)
- **Purpose**: Gmail API interactions and email data extraction
- **Exposes**: `window.billableAIGmailAPI`
- **Functions**: `initializeGmailApi`, `getCurrentComposeData`, `extractEmailDataWithGmailApi`

### 3. Gemini API Module (`tracking-gemini.js`)
- **Purpose**: AI summary generation using Gemini API
- **Exposes**: `window.billableAIGemini`
- **Functions**: `generateSummaryWithGemini`, `generateTestSummary`

### 4. Events Module (`tracking-events.js`)
- **Purpose**: DOM event detection and tracking logic
- **Exposes**: `window.billableAIEvents`
- **Functions**: `startEmailTracking`, `handleEmailInput`, `generateSummary`

### 5. Detection Module (`tracking-detection.js`)
- **Purpose**: Gmail DOM detection and element tracking
- **Exposes**: `window.billableAIDetection`
- **Functions**: `setupGmailDetection`, `detectGmailComposeInNode`

## Main Entry Point

The modular system is loaded by `tracking-script-modular.js`, which:
1. Loads modules in the correct order
2. Initializes the tracking system
3. Exposes the main `window.billableAI` interface

## Debugging Steps

### Step 1: Build and Load Extension

1. **Build the extension**:
   ```bash
   npm run build:extension
   ```

2. **Load in Chrome**:
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `extension/dist` folder

3. **Verify extension is loaded**:
   - Check that "BillableAI" appears in the extensions list
   - Status should show "Enabled"

### Step 2: Test with Debug Page

1. **Start the test server**:
   ```bash
   node start-test-server.js
   ```

2. **Open the debug page**:
   - Navigate to `http://localhost:8000/test-modular-debug.html`
   - This page will automatically run tests

3. **Check the results**:
   - Extension Loading Test: Should show "✅ Extension is loaded!"
   - Content Script Test: Should show "✅ Content script is injected!"
   - Module Loading Test: Should show all modules as "✅ Loaded"

### Step 3: Identify Issues

If tests fail, check the following:

#### Extension Not Loading
- **Symptoms**: `chrome.runtime` not available
- **Solutions**:
  - Reload the extension in `chrome://extensions/`
  - Check for errors in the extension's background page
  - Verify `manifest.json` is valid

#### Content Script Not Injected
- **Symptoms**: `window.billableAI` not found
- **Solutions**:
  - Check `manifest.json` content_scripts configuration
  - Verify the script files exist in `dist/`
  - Check browser console for CSP errors

#### Modules Not Loading
- **Symptoms**: Individual modules not available
- **Solutions**:
  - Check that all module files are copied to `dist/`
  - Verify `web_accessible_resources` includes all modules
  - Check for JavaScript errors in module loading

### Step 4: Manual Testing

Use the debug page buttons to test specific functionality:

1. **Check Extension**: Verifies `chrome.runtime` availability
2. **Check Content Script**: Verifies `window.billableAI` availability
3. **Check All Modules**: Verifies each module is loaded
4. **Test Functions**: Verifies all functions are available
5. **Test Gmail API**: Tests Gmail API connectivity
6. **Test Gemini API**: Tests Gemini API connectivity

## Common Issues and Solutions

### Issue 1: "chrome.runtime is NOT available"
**Cause**: Extension not properly loaded
**Solution**:
1. Reload extension in `chrome://extensions/`
2. Check for errors in extension background page
3. Verify `manifest.json` is valid

### Issue 2: "window.billableAI object NOT found"
**Cause**: Content script not injected
**Solution**:
1. Check `manifest.json` content_scripts configuration
2. Verify script files exist in `dist/`
3. Check for CSP violations in console

### Issue 3: "Module not loaded"
**Cause**: Individual module failed to load
**Solution**:
1. Check that module file exists in `dist/`
2. Verify `web_accessible_resources` includes the module
3. Check for JavaScript errors in module

### Issue 4: "Functions not available"
**Cause**: Module dependencies not loaded in correct order
**Solution**:
1. Check module loading order in `tracking-script-modular.js`
2. Verify all dependencies are available
3. Check for JavaScript errors in module initialization

## Performance Optimization

The modular system includes several performance optimizations:

1. **No Visual Indicators**: Eliminates reflows by using console logging instead
2. **Debounced Input**: Reduces frequency of input handling
3. **RequestIdleCallback**: Uses idle time for DOM operations
4. **Reduced Logging**: Logs every 50 characters instead of every character

## Testing on Gmail

To test the system on Gmail:

1. **Navigate to Gmail**: `https://mail.google.com`
2. **Open Developer Tools**: F12
3. **Check Console**: Look for BillableAI logs
4. **Compose Email**: Start typing to trigger tracking
5. **Check Tracking**: Look for tracking logs in console

## Debugging Commands

Use these commands in the browser console:

```javascript
// Check extension availability
typeof chrome !== 'undefined' && chrome.runtime

// Check content script
window.billableAI

// Check modules
window.billableAICore
window.billableAIGmailAPI
window.billableAIGemini
window.billableAIEvents
window.billableAIDetection

// Check state
window.billableAIState

// Test functions
window.billableAI.getStatus()
window.billableAI.testGmailApi()
```

## Exporting Debug Logs

The debug page includes an "Export Log" button that saves all debug messages to a text file for analysis.

## Next Steps

If the modular system is working correctly:

1. **Test on Gmail**: Navigate to Gmail and test email tracking
2. **Test APIs**: Verify Gmail and Gemini API integration
3. **Test Performance**: Monitor for any performance issues
4. **Deploy**: Use the working modular system

If issues persist:

1. **Check Console**: Look for specific error messages
2. **Check Network**: Verify API calls are working
3. **Check Storage**: Verify localStorage operations
4. **Report Issues**: Document specific error messages and steps to reproduce 