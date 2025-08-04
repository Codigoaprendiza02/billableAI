# User Registration Troubleshooting Guide

## 🔍 Issue Analysis

The user registration functionality has several potential failure points. This guide will help you identify and fix the specific issue you're experiencing.

## 🚨 Common Issues & Solutions

### 1. **Database Connection Issues**

#### Problem: MongoDB not running
**Symptoms:**
- Registration fails with "Database is not available" error
- Backend logs show "MongoDB connection error"
- Health check shows database as "disconnected"

**Solutions:**
```bash
# Option 1: Install and start MongoDB locally
# Download from: https://www.mongodb.com/try/download/community
mongod

# Option 2: Use MongoDB Atlas (cloud)
# 1. Go to https://www.mongodb.com/atlas
# 2. Create free cluster
# 3. Get connection string
# 4. Update env.local with your connection string
```

#### Problem: Incorrect MongoDB URI
**Symptoms:**
- Connection timeout errors
- "MongoDB URI not properly configured" message

**Solution:**
Update `backend/env.local`:
```bash
MONGODB_URI=mongodb://localhost:27017/billableai
# Or for MongoDB Atlas:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/billableai
```

### 2. **Password Validation Issues**

#### Problem: Password doesn't meet requirements
**Symptoms:**
- "Password validation failed" error
- Specific password requirement errors

**Password Requirements:**
- ✅ At least 15 characters
- ✅ One lowercase letter (a-z)
- ✅ One uppercase letter (A-Z)
- ✅ One number (0-9)
- ✅ One special character (!@#$%^&*()_-+={}[]|\\:;"'<>?,./)

**Example Valid Passwords:**
- `StrongPassword123!`
- `VerySecurePass456@`
- `MyComplexPassword789#`

### 3. **Validation Rule Issues**

#### Problem: Username/Email validation fails
**Symptoms:**
- "Username can only contain letters, numbers, and underscores"
- "Please provide a valid email address"
- "Name must be between 2 and 50 characters"

**Requirements:**
- **Username:** 3-30 characters, letters/numbers/underscores only
- **Email:** Valid email format
- **Name:** 2-50 characters
- **Gender:** Must be "Male", "Female", or "Others"

### 4. **Backend Server Issues**

#### Problem: Backend not running
**Symptoms:**
- Network errors during registration
- "Failed to fetch" errors
- Connection refused errors

**Solution:**
```bash
# Start backend server
cd backend
npm start

# Check if server is running
curl http://localhost:3001/health
```

#### Problem: Port conflicts
**Symptoms:**
- "Port 3001 is already in use" error
- Server won't start

**Solution:**
```bash
# Find process using port 3001
netstat -ano | findstr :3001

# Kill the process
taskkill /PID <process_id> /F

# Or change port in env.local
PORT=3002
```

### 5. **Environment Configuration Issues**

#### Problem: Missing environment variables
**Symptoms:**
- "JWT_SECRET not configured" errors
- Database connection issues

**Solution:**
Ensure `backend/env.local` has all required variables:
```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/billableai

# JWT Secret
JWT_SECRET=your_jwt_secret_here

# OAuth Configuration (optional for registration)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
CLIO_CLIENT_ID=your_clio_client_id_here
CLIO_CLIENT_SECRET=your_clio_client_secret_here

# AI Services (optional for registration)
GEMINI_API_KEY=your_gemini_api_key_here

# CORS
ALLOWED_ORIGINS=http://localhost:5173,chrome-extension://*
```

## 🧪 Testing Tools

### 1. **Backend Health Check**
```bash
curl http://localhost:3001/health
```
Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected"
}
```

### 2. **User Registration Test Page**
Open `extension/test-user-registration.html` in your browser to test:
- Backend connection
- Password validation
- User registration
- Error handling

### 3. **Database Connection Test**
```bash
# Test MongoDB connection
mongosh mongodb://localhost:27017/billableai
```

## 🔧 Step-by-Step Debugging

### Step 1: Check Backend Status
1. Open terminal
2. Navigate to backend directory: `cd backend`
3. Start server: `npm start`
4. Check for any error messages
5. Verify server is running: `curl http://localhost:3001/health`

### Step 2: Check Database Connection
1. Look for "MongoDB connected successfully" message
2. If not connected, install/start MongoDB
3. Check `env.local` file for correct `MONGODB_URI`

### Step 3: Test Registration API
1. Open `extension/test-user-registration.html`
2. Click "Test Backend Connection"
3. Click "Test Valid User"
4. Check console for detailed error messages

### Step 4: Check Password Requirements
1. Use the test page to verify password meets all requirements
2. Try the example valid passwords above
3. Check password validation in real-time

## 🚀 Quick Fixes

### For Development (No Database)
If you want to test without MongoDB:
1. Update `backend/src/services/authService.js` to handle missing database
2. Add mock user storage for testing
3. Disable database-dependent features

### For Production
1. Set up MongoDB Atlas (free tier available)
2. Update `MONGODB_URI` in environment variables
3. Ensure all required environment variables are set

## 📋 Common Error Messages & Solutions

| Error Message | Cause | Solution |
|---------------|-------|----------|
| "Database is not available" | MongoDB not running | Start MongoDB or use MongoDB Atlas |
| "Password validation failed" | Password too weak | Use stronger password meeting all requirements |
| "Email already registered" | User exists | Use different email or login instead |
| "Username already taken" | Username exists | Choose different username |
| "Invalid credentials" | Wrong username/password | Check credentials or register new account |
| "Network error" | Backend not running | Start backend server with `npm start` |
| "Port 3001 is already in use" | Port conflict | Kill existing process or change port |

## 🆘 Still Having Issues?

If you're still experiencing problems:

1. **Check the logs:**
   - Backend console output
   - Browser developer tools console
   - Network tab for API calls

2. **Use the test page:**
   - Open `extension/test-user-registration.html`
   - Run all tests
   - Check detailed error messages

3. **Verify environment:**
   - MongoDB is running
   - Backend server is running
   - All environment variables are set

4. **Common debugging commands:**
   ```bash
   # Check if MongoDB is running
   mongosh --eval "db.runCommand('ping')"
   
   # Check if backend is running
   curl http://localhost:3001/health
   
   # Check environment variables
   node -e "console.log(require('dotenv').config())"
   ```

## 📞 Getting Help

If you need additional help:
1. Check the console logs for specific error messages
2. Use the test page to isolate the issue
3. Verify all prerequisites are met
4. Share specific error messages for targeted assistance 