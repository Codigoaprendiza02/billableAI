# 🎯 BillableAI Gemini API Setup Guide

## **Issue: Gemini API 400 Error**

If you're seeing this error:
```
Failed to load resource: the server responded with a status of 400 ()
Error generating Gemini response: Error: Gemini API error: 400
```

This means your Gemini API key is either:
- ❌ **Not configured**
- ❌ **Invalid or expired**
- ❌ **Missing required permissions**

---

## 🔧 **How to Fix the 400 Error**

### **Step 1: Get a Gemini API Key**

1. **Go to Google AI Studio:**
   - Visit: https://makersuite.google.com/app/apikey
   - Sign in with your Google account

2. **Create a new API key:**
   - Click "Create API Key"
   - Choose "Create API Key" option
   - Copy the generated API key (starts with "AI")

3. **Enable Gemini API:**
   - Go to: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com
   - Click "Enable" if not already enabled

### **Step 2: Configure API Key in BillableAI**

1. **Open BillableAI Extension:**
   - Click the BillableAI extension icon
   - Go to "Settings" tab

2. **Enter your API key:**
   - Find the "Gemini API Key" field
   - Paste your API key from Step 1
   - Click "Save"

3. **Test the connection:**
   - The extension will automatically test the API key
   - You should see "✅ Gemini API Connected" status

---

## 🧪 **Testing Your Setup**

### **Test 1: Manual API Test**
```javascript
// Open browser console and run:
fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_API_KEY', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [{ parts: [{ text: 'Hello, test message.' }] }],
    generationConfig: { maxOutputTokens: 10 }
  })
}).then(r => r.json()).then(console.log);
```

### **Test 2: Extension Test**
1. **Compose an email** in Gmail
2. **Click "Open Assistant"** in the notification
3. **Ask for a summary** - should work without 400 error

---

## 🔍 **Troubleshooting**

### **Error: "API key not configured"**
- ✅ **Solution:** Follow Step 2 above to configure your API key

### **Error: "Invalid API key"**
- ✅ **Solution:** Get a new API key from Google AI Studio
- ✅ **Check:** Make sure you copied the entire key

### **Error: "API quota exceeded"**
- ✅ **Solution:** Check your Google Cloud billing
- ✅ **Alternative:** Wait for quota reset (usually daily)

### **Error: "API not enabled"**
- ✅ **Solution:** Enable Gemini API in Google Cloud Console
- ✅ **Link:** https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com

---

## 📋 **API Key Security**

### **Best Practices:**
- 🔒 **Never share** your API key publicly
- 🔒 **Use environment variables** in production
- 🔒 **Rotate keys** regularly
- 🔒 **Monitor usage** in Google Cloud Console

### **Storage Location:**
- 📍 **Extension:** Stored in browser localStorage
- 📍 **Scope:** Only accessible by BillableAI extension
- 📍 **Security:** Browser-level encryption

---

## 🚀 **Fallback Mode**

If you can't configure the API key immediately, BillableAI will:
- ✅ **Still work** with fallback responses
- ✅ **Track time** and email data
- ✅ **Generate basic summaries** without AI
- ✅ **Show helpful guidance** for API setup

### **Fallback Features:**
- 📧 **Email tracking** (time, subject, recipients)
- ⏱️ **Time analysis** (minutes, billing recommendations)
- 📊 **Basic summaries** (professional format)
- 💡 **Setup guidance** (API configuration help)

---

## 📞 **Need Help?**

### **Common Issues:**
1. **"API key not working"** → Get a new key from Google AI Studio
2. **"400 error persists"** → Check API is enabled in Google Cloud Console
3. **"No response from AI"** → Verify API key is correctly pasted
4. **"Quota exceeded"** → Check Google Cloud billing status

### **Support Resources:**
- 📚 **Google AI Studio:** https://makersuite.google.com/app/apikey
- 📚 **Gemini API Docs:** https://ai.google.dev/docs
- 📚 **Google Cloud Console:** https://console.cloud.google.com

---

**Status:** ✅ **GUIDE COMPLETE**  
**Last Updated:** $(date)  
**Version:** 1.0.0 