# 🔐 OAuth Testing Guide

## 📋 **Prerequisites**

✅ Backend server running on `http://localhost:3001`  
✅ Authentication system working  
✅ Sample users created  
✅ Environment variables configured  

---

## 🔗 **Google OAuth Testing**

### **Step 1: Get Google OAuth URL**
```bash
# Run this command to get the Google OAuth URL
node get-google-oauth-url.js
```

### **Step 2: Test Google OAuth Flow**
1. **Copy the Google OAuth URL** from the command output
2. **Open the URL** in your browser
3. **Sign in with Google** (use your test account)
4. **Grant permissions** for Gmail access
5. **Complete the OAuth flow** - you'll be redirected to the callback page

### **Expected Google OAuth URL:**
```
https://accounts.google.com/o/oauth2/v2/auth?client_id=490990742206-fijj3ubr4nr14cg016bv0gm47d461m3a.apps.googleusercontent.com&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fapi%2Fauth%2Fgoogle%2Fcallback&response_type=code&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fgmail.readonly%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile&access_type=offline
```

### **Step 3: Verify Google OAuth Success**
- ✅ You should see a success page with JWT token
- ✅ Check browser console for any errors
- ✅ Verify token is stored in localStorage

---

## 🏢 **Clio OAuth Testing**

### **Step 1: Get Clio OAuth URL**
```bash
# Run this command to get the Clio OAuth URL
node get-clio-oauth-url.js
```

### **Step 2: Test Clio OAuth Flow**
1. **Complete Google OAuth first** (get a valid JWT token)
2. **Copy the Clio OAuth URL** from the command output
3. **Open the URL** in your browser
4. **Sign in to Clio** (use your test account)
5. **Grant permissions** for profile, matters, clients, time entries
6. **Complete the OAuth flow** - you'll be redirected to the callback page

### **Expected Clio OAuth URL:**
```
https://app.clio.com/oauth/authorize?client_id=id1eNmLyoJgdrU82MOJHA3d5LMDaUSwgNvjQttKT&redirect_uri=http%3A%2F%2F127.0.0.1%3A3001%2Fapi%2Fauth%2Fclio%2Fcallback&response_type=code&scope=profile%20matters%20clients%20time_entries
```

### **Step 3: Verify Clio OAuth Success**
- ✅ You should see a callback page with authorization code
- ✅ Check browser console for processing status
- ✅ Verify Clio connection in user profile

---

## 🧪 **Testing Scripts**

### **Quick OAuth Test**
```bash
# Test both OAuth URLs
node quick-oauth-test.js
```

### **Comprehensive OAuth Test**
```bash
# Test full OAuth flow with sample data
node test-oauth-comprehensive.js
```

---

## 📊 **Expected Results**

### **Google OAuth Success:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@gmail.com",
    "name": "User Name",
    "hasGmailAccess": true
  }
}
```

### **Clio OAuth Success:**
```json
{
  "success": true,
  "message": "Clio connected successfully",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name",
    "hasGmailAccess": true,
    "hasClioAccess": true
  }
}
```

---

## ⚠️ **Common Issues & Solutions**

### **Google OAuth Issues:**
1. **"Invalid prompt: consent"** → Fixed in backend
2. **"Access blocked"** → Check client ID configuration
3. **Redirect URI mismatch** → Verify callback URL

### **Clio OAuth Issues:**
1. **"Route not found"** → Backend routes are fixed
2. **"JWT token required"** → Complete Google OAuth first
3. **"Authorization code required"** → Check OAuth flow

### **General Issues:**
1. **CORS errors** → Backend CORS is configured
2. **Network errors** → Check if backend is running
3. **Token issues** → Clear localStorage and retry

---

## 🔍 **Debugging Steps**

### **1. Check Backend Health**
```bash
curl http://localhost:3001/health
```

### **2. Test OAuth Configuration**
```bash
curl http://localhost:3001/api/auth/test-oauth
```

### **3. Check Environment Variables**
```bash
node check-oauth-config.js
```

### **4. Monitor Backend Logs**
- Watch terminal for backend logs
- Check browser console for errors
- Monitor network tab in DevTools

---

## 🎯 **Success Criteria**

### **Google OAuth:**
- ✅ OAuth URL generates correctly
- ✅ User can sign in with Google
- ✅ Permissions are granted
- ✅ Callback receives authorization code
- ✅ JWT token is generated and stored
- ✅ User profile is updated

### **Clio OAuth:**
- ✅ OAuth URL generates correctly
- ✅ User can sign in to Clio
- ✅ Permissions are granted
- ✅ Callback receives authorization code
- ✅ Clio tokens are stored
- ✅ User profile shows Clio connection

---

## 📝 **Test Checklist**

### **Google OAuth:**
- [ ] OAuth URL accessible
- [ ] Google sign-in works
- [ ] Permissions granted
- [ ] Callback successful
- [ ] JWT token received
- [ ] User profile updated

### **Clio OAuth:**
- [ ] Google OAuth completed first
- [ ] Clio OAuth URL accessible
- [ ] Clio sign-in works
- [ ] Permissions granted
- [ ] Callback successful
- [ ] Clio connection established

---

## 🚀 **Ready to Test!**

The OAuth system is now ready for comprehensive testing. Follow the steps above to verify both Google and Clio OAuth flows work correctly. 