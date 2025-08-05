# 🧪 Chrome Extension Testing Guide

## 📋 **Prerequisites**

1. **Backend Server Running**: Make sure the backend is running on `http://localhost:3001`
2. **Extension Built**: The extension should be built and ready to load

## 🚀 **Step 1: Load Extension in Chrome**

### **Method 1: Load Unpacked Extension**
1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer Mode** (toggle in top right)
3. Click **"Load unpacked"**
4. Select the `extension/dist` folder
5. The extension should appear in your extensions list

### **Method 2: Development Mode**
```bash
cd extension
npm run dev
```

## 🧪 **Step 2: Test Extension Functionality**

### **2.1 Basic Extension Test**
1. Click the extension icon in Chrome toolbar
2. Verify the popup opens
3. Check if the main interface loads

### **2.2 Test Email Tracking Features**

#### **Test Email Composer**
1. Navigate to "Email Tracking" page
2. Click "Start New Email"
3. Fill in the form:
   - **To**: `test@example.com`
   - **Subject**: `Test Email`
   - **Content**: `This is a test email for billing tracking`
4. Verify the timer starts
5. Check if the timer icon appears
6. Test the "Send Email" button

#### **Test Timer Functionality**
1. Start composing an email
2. Verify the timer starts automatically
3. Check if time updates in real-time
4. Test activity tracking (move mouse, type)
5. Stop the session and verify billing summary

#### **Test Email Analysis**
1. Navigate to "Email Analysis" page
2. Check if recent emails are displayed
3. Test auto-billing suggestions
4. Verify email templates functionality

### **2.3 Test API Integration**

#### **Test Backend Connection**
1. Open Chrome DevTools (F12)
2. Go to Console tab
3. Run the test script:
```javascript
// Copy and paste the test-extension.js content
runExtensionTests()
```

#### **Test Email Tracking API**
1. Start an email session
2. Check network tab for API calls
3. Verify responses from backend

## 🔍 **Step 3: Manual Testing Checklist**

### **✅ Extension Loading**
- [ ] Extension loads without errors
- [ ] Popup opens correctly
- [ ] No console errors

### **✅ Navigation**
- [ ] Can navigate to Email Tracking
- [ ] Can navigate to Email Analysis
- [ ] Can navigate to AI Assistant
- [ ] Can navigate to Settings

### **✅ Email Tracking**
- [ ] Timer starts when composing email
- [ ] Timer updates in real-time
- [ ] Billing summary generates correctly
- [ ] Session management works

### **✅ Email Analysis**
- [ ] Recent emails display
- [ ] Auto-billing suggestions work
- [ ] Email templates generate
- [ ] Email details modal opens

### **✅ API Integration**
- [ ] Backend connection works
- [ ] Email tracking API calls succeed
- [ ] Error handling works
- [ ] Loading states display correctly

## 🐛 **Step 4: Debugging**

### **Common Issues & Solutions**

#### **Extension Not Loading**
```bash
# Rebuild extension
cd extension
npm run build
```

#### **API Connection Failed**
```bash
# Check if backend is running
curl http://localhost:3001/health
```

#### **CORS Issues**
- Check if backend CORS is configured
- Verify API endpoints are accessible

#### **Timer Not Working**
- Check if email tracking service is running
- Verify session management

## 📊 **Step 5: Performance Testing**

### **Test Extension Performance**
1. Open Chrome DevTools
2. Go to Performance tab
3. Record while using extension
4. Check for memory leaks
5. Verify smooth animations

### **Test API Response Times**
1. Open Network tab
2. Monitor API call response times
3. Check for slow endpoints

## 🎯 **Step 6: User Experience Testing**

### **Test User Flow**
1. **New User**: First-time extension usage
2. **Email Composition**: Complete email writing flow
3. **Billing Summary**: Verify billing generation
4. **Email Analysis**: Test analysis features

### **Test Edge Cases**
- Empty email content
- Very long emails
- Network disconnection
- Invalid email addresses
- Missing required fields

## 📝 **Step 7: Test Results Documentation**

### **Create Test Report**
```markdown
# Extension Test Report

## Test Date: [Date]
## Tester: [Your Name]

### ✅ Passed Tests
- Extension loads correctly
- Email tracking works
- Timer functionality
- API integration

### ❌ Failed Tests
- [List any failed tests]

### 🔧 Issues Found
- [List any issues]

### 📈 Performance
- Load time: [X] seconds
- API response time: [X] ms
- Memory usage: [X] MB
```

## 🚀 **Quick Test Commands**

```bash
# Build extension
cd extension && npm run build

# Start development server
cd extension && npm run dev

# Test backend
cd backend && node final-comprehensive-test.js
```

## 🎉 **Success Criteria**

The extension is working correctly if:
- ✅ Extension loads without errors
- ✅ Email tracking timer works
- ✅ Billing summaries generate
- ✅ API calls succeed
- ✅ User interface is responsive
- ✅ All navigation works
- ✅ Error handling works properly

---

**Happy Testing! 🧪✨** 