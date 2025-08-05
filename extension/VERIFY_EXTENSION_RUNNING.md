# 🔧 BillableAI Extension - Verification Guide

## 📋 How to Verify Extension is Running in Background

### **Step 1: Check Extension Status in Chrome**

1. **Open Chrome** and go to `chrome://extensions/`
2. **Look for "BillableAI"** in the extensions list
3. **Verify Status**: Should show "Enabled" (not "Error" or "Disabled")
4. **Check for Errors**: If there's an "Errors" button, click it to see issues

### **Step 2: Test Extension Communication**

1. **Navigate to**: `http://localhost:8000/test-background-service-worker.html`
2. **Click "Check Extension Status"** - Should show "✅ Extension is loaded and running!"
3. **Click "Test Communication"** - Should show "✅ Service worker communication working"
4. **Click "Test Message Passing"** - Should show "✅ All messages sent successfully"

### **Step 3: Monitor Background Process**

1. **Click "Start Monitoring"** on the test page
2. **Watch the console log** - Should show "✅ Background service worker responding" every 5 seconds
3. **Let it run for 30 seconds** to verify continuous operation

### **Step 4: Check Content Script Injection**

1. **Navigate to**: `http://localhost:8000/test-basic-script.html`
2. **Click "Check Content Script"** - Should show "✅ Content script is injected!"
3. **Click "Test Functions"** - Should show "✅ All functions available"

### **Step 5: Verify Storage Access**

1. **Click "Test Storage Access"** on the background test page
2. **Should show**: "✅ Storage access working"
3. **Check console** for storage operations

## 🔍 **What Each Test Verifies**

### **✅ Extension Status Test**
- Verifies `chrome.runtime` is available
- Confirms extension manifest is accessible
- Shows extension ID and version

### **✅ Service Worker Communication**
- Tests message passing between content script and background
- Verifies background service worker is responding
- Confirms proper message handling

### **✅ Message Passing Test**
- Sends multiple test messages to background
- Tests different message types (CONTENT_SCRIPT_LOADED, TRACKING_STARTED, etc.)
- Verifies background processes messages correctly

### **✅ Storage Access Test**
- Tests `chrome.storage.local` read/write operations
- Verifies extension permissions are working
- Confirms data persistence capabilities

### **✅ Content Script Injection**
- Verifies `window.billableAI` object is created
- Tests function availability
- Confirms content script is running in page context

### **✅ Background Process Monitoring**
- Continuously monitors service worker responsiveness
- Detects if background process stops working
- Provides real-time status updates

## 🚨 **Common Issues & Solutions**

### **Issue: Extension Shows "Error" Status**
**Solution:**
1. Click the "Errors" button in `chrome://extensions/`
2. Check for manifest.json syntax errors
3. Verify all required files exist in `extension/dist/`
4. Reload the extension

### **Issue: Service Worker Not Responding**
**Solution:**
1. Check if background.js is properly loaded
2. Verify manifest.json points to correct background script
3. Check console for JavaScript errors
4. Reload the extension

### **Issue: Content Script Not Injecting**
**Solution:**
1. Verify content_scripts section in manifest.json
2. Check if matches patterns include your test URLs
3. Ensure tracking-script-basic.js exists in dist folder
4. Reload the extension and refresh test page

### **Issue: Storage Access Failing**
**Solution:**
1. Verify "storage" permission in manifest.json
2. Check if extension has proper permissions
3. Ensure chrome.storage API is available
4. Reload the extension

## 📊 **Expected Results**

When everything is working correctly, you should see:

```
✅ Extension is loaded and running!
✅ Service worker communication working
✅ All messages sent successfully
✅ Storage access working
✅ Content script injected successfully
✅ All permissions available
✅ Background service worker running
```

## 🔄 **Continuous Monitoring**

The background monitoring feature will:
- Check service worker every 5 seconds
- Log status to console
- Show real-time status in UI
- Detect if background process stops

## 📝 **Debugging Tips**

1. **Open Chrome DevTools** on the test pages
2. **Check Console** for detailed logs
3. **Use Network Tab** to see extension requests
4. **Check Application Tab** for storage data
5. **Monitor Background Page** in `chrome://extensions/`

## 🎯 **Success Criteria**

The extension is running properly in the background when:
- ✅ All test buttons show green success status
- ✅ Console shows continuous "Background service worker responding" messages
- ✅ No red error messages in any test
- ✅ Extension status shows "Enabled" in `chrome://extensions/`
- ✅ All functions are accessible via `window.billableAI`

## 🚀 **Next Steps**

Once verification is complete:
1. Test on actual Gmail pages
2. Verify email tracking functionality
3. Test OAuth integration
4. Verify Gemini API integration
5. Test popup functionality

---

**Note**: If any test fails, check the console for detailed error messages and refer to the troubleshooting section above. 