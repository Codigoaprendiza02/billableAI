# 🔧 BillableAI Extension - Troubleshooting Guide

## 🚨 **Background Service Worker Not Working**

If your extension is not running in the background, follow these steps:

### **Step 1: Verify Extension is Loaded**

1. **Go to `chrome://extensions/`**
2. **Look for "BillableAI"** in the extensions list
3. **Check Status**: Should show "Enabled" (not "Error" or "Disabled")
4. **If you see "Error"**: Click the "Errors" button to see what's wrong

### **Step 2: Reload the Extension**

1. **In `chrome://extensions/`**, find the BillableAI extension
2. **Click the reload button** (🔄) next to the extension
3. **Wait for it to reload** and show "Enabled" status

### **Step 3: Test the Extension**

1. **Navigate to**: `http://localhost:8000/quick-extension-test.html`
2. **Check the results**:
   - ✅ Extension Status: Should show "Extension is loaded!"
   - ✅ Background Service Worker: Should show "Background service worker working"
   - ✅ Content Script: Should show "Content script injected"

### **Step 4: Check Console for Errors**

1. **Open Chrome DevTools** (F12)
2. **Go to Console tab**
3. **Look for any red error messages**
4. **Check for these specific messages**:
   - `🎯 BillableAI: Background script loaded`
   - `🎯 BillableAI: Extension installed/updated`

## 🔍 **Common Issues & Solutions**

### **Issue 1: Extension Shows "Error" Status**

**Symptoms:**
- Extension shows "Error" instead of "Enabled"
- Red error message in extensions page

**Solutions:**
1. **Click "Errors" button** to see specific error
2. **Check manifest.json** for syntax errors
3. **Verify all files exist** in `extension/dist/` folder
4. **Rebuild the extension**: `npm run build:extension`
5. **Reload the extension** in `chrome://extensions/`

### **Issue 2: Background Service Worker Not Responding**

**Symptoms:**
- Test page shows "❌ Background not responding"
- No console logs from background script

**Solutions:**
1. **Check if background.js exists** in `extension/dist/`
2. **Verify manifest.json** points to correct background script
3. **Reload the extension** completely
4. **Check console** for JavaScript errors in background script
5. **Restart Chrome** if needed

### **Issue 3: Content Script Not Injecting**

**Symptoms:**
- Test page shows "❌ Content script not injected"
- `window.billableAI` object not found

**Solutions:**
1. **Verify content_scripts** section in manifest.json
2. **Check if tracking-script-basic.js** exists in dist folder
3. **Ensure matches patterns** include your test URLs
4. **Reload the extension** and refresh test page
5. **Check console** for content script errors

### **Issue 4: Extension Not Detected on Test Pages**

**Symptoms:**
- `chrome.runtime` not available
- Extension functions not accessible

**Solutions:**
1. **Make sure extension is enabled** in `chrome://extensions/`
2. **Use localhost URLs** (not file:// URLs)
3. **Check host_permissions** in manifest.json
4. **Verify extension is loaded** in the correct Chrome profile
5. **Try incognito mode** to test

## 🛠️ **Manual Verification Steps**

### **Step 1: Check Extension Files**

```bash
# Navigate to extension directory
cd extension

# Check if dist folder exists
ls dist/

# Verify key files exist
ls dist/manifest.json
ls dist/background.js
ls dist/tracking-script-basic.js
ls dist/popup.html
```

### **Step 2: Check Extension in Chrome**

1. **Go to `chrome://extensions/`**
2. **Enable Developer mode** (toggle in top right)
3. **Look for BillableAI** in the list
4. **Check if it shows "Enabled"**
5. **Click "Details"** to see extension info

### **Step 3: Test Background Service Worker**

1. **Open Chrome DevTools** (F12)
2. **Go to Console tab**
3. **Look for these messages**:
   ```
   🎯 BillableAI: Background script loaded
   🎯 BillableAI: Extension installed/updated
   ```
4. **If you don't see these**, the background script isn't running

### **Step 4: Test Content Script**

1. **Navigate to**: `http://localhost:8000/quick-extension-test.html`
2. **Open DevTools Console**
3. **Look for these messages**:
   ```
   🎯 BillableAI: Basic tracking script starting...
   🎯 BillableAI: Manual functions available at window.billableAI
   ```
4. **Check if `window.billableAI`** object exists

## 🔧 **Quick Fix Commands**

### **Rebuild Extension**
```bash
cd extension
npm run build:extension
```

### **Start Test Server**
```bash
cd extension
node start-test-server.js
```

### **Check Extension Status**
1. Go to `chrome://extensions/`
2. Find BillableAI
3. Click reload button (🔄)
4. Check for "Enabled" status

## 📊 **Expected Results**

When everything is working correctly:

### **In Chrome Extensions Page:**
- ✅ BillableAI shows "Enabled" status
- ✅ No error messages
- ✅ Extension ID is displayed

### **In Test Page Console:**
```
🎯 BillableAI: Background script loaded
🎯 BillableAI: Extension installed/updated
🎯 BillableAI: Basic tracking script starting...
🎯 BillableAI: Manual functions available at window.billableAI
```

### **In Test Page UI:**
- ✅ Extension Status: "Extension is loaded!"
- ✅ Background Service Worker: "Background service worker working"
- ✅ Content Script: "Content script injected"

## 🚀 **Next Steps After Fix**

Once the extension is working:

1. **Test on Gmail**: Go to `https://mail.google.com/`
2. **Check popup**: Click the extension icon
3. **Test OAuth**: Try signing in with Google
4. **Test tracking**: Compose an email and check tracking
5. **Test Gemini**: Try generating a summary

## 📞 **Still Having Issues?**

If you're still experiencing problems:

1. **Check the console** for specific error messages
2. **Verify all files** are in the correct locations
3. **Try a different Chrome profile**
4. **Restart Chrome completely**
5. **Check if any other extensions** are conflicting

---

**Remember**: The extension must be properly loaded in Chrome for the background service worker to run. Always check `chrome://extensions/` first! 