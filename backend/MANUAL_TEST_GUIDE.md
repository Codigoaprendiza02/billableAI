# 🧪 Manual Testing Guide

## **Testing the Backend Integration**

### **Step 1: Start the Backend Server**

```bash
cd backend
npm install
npm start
```

**Expected Output:**
```
🚀 BillableAI Backend running on port 3001
📊 Health check: http://localhost:3001/health
🔗 Extension API: http://localhost:3001/api/extension
```

### **Step 2: Test Server Health**

Open your browser and go to:
```
http://localhost:3001/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-XX...",
  "database": "connected"
}
```

### **Step 3: Test Extension API**

Go to:
```
http://localhost:3001/api/extension/verify-token
```

**Expected Response:**
```json
{
  "error": "Access token required"
}
```

### **Step 4: Test User Registration**

Use Postman, curl, or browser to POST to:
```
http://localhost:3001/api/extension/register
```

**Request Body:**
```json
{
  "email": "test@example.com",
  "name": "Test User",
  "profession": "Lawyer",
  "gender": "Male",
  "aiPreferences": {
    "emailAutoSuggestions": true,
    "defaultTone": "Formal"
  },
  "billableLogging": {
    "defaultTimeUnit": "Hours",
    "confirmationBeforeLogging": true,
    "confirmationBeforeAttaching": true
  }
}
```

**Expected Response:**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "email": "test@example.com",
    "name": "Test User",
    "profession": "Lawyer",
    "gender": "Male",
    "avatar": null,
    "aiPreferences": {...},
    "billableLogging": {...},
    "twoFactorAuth": {...},
    "isConnectedToClio": false,
    "workHistory": {...},
    "hasCompletedOnboarding": true
  }
}
```

### **Step 5: Test Extension Integration**

1. **Build the Extension:**
   ```bash
   cd extension
   npm run build
   ```

2. **Load Extension in Chrome:**
   - Go to `chrome://extensions/`
   - Enable Developer mode
   - Click "Load unpacked"
   - Select `extension/dist/` folder

3. **Test Onboarding:**
   - Click the extension icon
   - Complete the onboarding process
   - Check if data is saved to backend

### **Step 6: Test Settings Updates**

1. **Go to Settings page**
2. **Update preferences:**
   - Change AI preferences
   - Update billable logging settings
   - Configure 2FA
   - Upload avatar

3. **Verify Backend Sync:**
   - Check if changes persist after reload
   - Verify data is saved in MongoDB

---

## **🔍 Troubleshooting**

### **Server Not Starting:**
- Check if port 3001 is available
- Verify MongoDB connection
- Check environment variables

### **API Not Responding:**
- Ensure server is running
- Check CORS settings
- Verify route configuration

### **Extension Not Loading:**
- Check build output
- Verify manifest.json
- Check console for errors

### **Database Issues:**
- Verify MongoDB connection string
- Check if database exists
- Ensure proper permissions

---

## **✅ Success Indicators**

- ✅ Backend server starts without errors
- ✅ Health endpoint returns 200
- ✅ Extension API endpoints respond
- ✅ User registration creates JWT token
- ✅ Extension loads in Chrome
- ✅ Onboarding data saves to backend
- ✅ Settings updates persist
- ✅ Avatar uploads work
- ✅ 2FA configuration saves

---

## **🚀 Next Steps**

Once testing is complete:
1. **Deploy backend** to production
2. **Update extension** API URLs
3. **Configure environment** variables
4. **Set up monitoring** and logging
5. **Test with real users**

**Your integration is ready for production!** 🎉 