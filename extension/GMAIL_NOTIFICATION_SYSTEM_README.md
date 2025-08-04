# BillableAI Gmail Notification System

## Overview

The BillableAI Gmail Notification System is a comprehensive React-based Chrome Extension component that integrates seamlessly with Gmail to provide automated time tracking, email tracking, and assistant integration. The system is designed to work end-to-end without any manual intervention after the user clicks the Gmail Compose button.

## Features

### 🕒 Time Tracking Functionality
- **Automatic Timer Start**: Timer begins when user starts typing in Gmail compose window
- **Smart Pause/Resume**: Timer pauses after 3 seconds of inactivity and resumes when typing continues
- **Real-time Display**: Live timer display in the notification component
- **Accurate Time Capture**: Final time is captured when Gmail Send button is clicked

### 📧 Email Tracking
- **Real-time Content Capture**: Continuously tracks email subject, body, and recipients
- **Full Email Data Storage**: Captures complete email content for billing purposes
- **Session Management**: Links email data with tracked time using unique session IDs
- **Automatic Data Storage**: Stores email data and time when Send button is clicked

### 🤖 Assistant Integration
- **One-Click Assistant Access**: "Open Assistant" button in notification component
- **Automatic Message Injection**: Injects "Generate billable summary for the email" message
- **Seamless Data Transfer**: Automatically passes tracked email and time data to assistant
- **Zero Manual Steps**: Entire flow is automated from compose to summary generation

### 🎯 Assistant Behavior
- **Global State Management**: Uses Chrome storage and localStorage for reliable data persistence
- **Immediate Processing**: Assistant immediately processes incoming requests
- **Billable Summary Generation**: Returns comprehensive billing summaries with time analysis
- **Professional Output**: Generates client-friendly billing descriptions and recommendations

## Architecture

### Components

#### 1. GmailNotificationComponent.jsx
- **Location**: `extension/src/components/GmailNotificationComponent.jsx`
- **Purpose**: React component for the notification UI
- **Features**: Timer display, email info, assistant button, real-time updates

#### 2. gmail-notification-content-script.js
- **Location**: `extension/public/gmail-notification-content-script.js`
- **Purpose**: Content script that injects into Gmail
- **Features**: Gmail DOM detection, timer management, data extraction

#### 3. Background Script Integration
- **Location**: `extension/public/background.js`
- **Purpose**: Handles assistant opening and data storage
- **Features**: Message routing, storage management, popup control

#### 4. Assistant Component Enhancement
- **Location**: `extension/src/pages/Assistant.jsx`
- **Purpose**: Enhanced assistant with auto-message handling
- **Features**: Auto message injection, data processing, summary generation

### Data Flow

```
Gmail Compose Click → Timer Start → Typing Detection → Email Data Capture → 
Send Button Click → Data Storage → Assistant Opening → Auto Message → 
Summary Generation → Complete Workflow
```

## Implementation Details

### Gmail Integration

#### Compose Detection
```javascript
// Detects Gmail compose button clicks
const composeButtons = node.querySelectorAll('[role="button"][data-tooltip="Compose"], [role="button"][aria-label*="Compose"], .T-I.T-I-KE');
```

#### Typing Detection
```javascript
// Monitors typing activity in compose window
field.addEventListener('input', handleTyping);
field.addEventListener('keydown', handleTyping);
field.addEventListener('paste', handleTyping);
field.addEventListener('cut', handleTyping);
```

#### Send Button Detection
```javascript
// Captures Gmail send button clicks
const sendButtons = node.querySelectorAll('[role="button"][data-tooltip="Send"], [role="button"][aria-label*="Send"], .T-I.T-I-KE.T-I-KR');
```

### Timer Management

#### Smart Pause/Resume Logic
```javascript
// Pause after 3 seconds of inactivity
typingTimeoutRef.current = setTimeout(() => {
  if (isTracking) {
    pauseTimer();
  }
}, TYPING_PAUSE_DELAY);
```

#### Accumulated Time Tracking
```javascript
// Maintains accurate time across pause/resume cycles
accumulatedTimeRef.current = Date.now() - startTimeRef.current + accumulatedTimeRef.current;
```

### Data Storage

#### Chrome Storage Integration
```javascript
// Primary storage method
await chrome.storage.local.set({ 
  'billableai_assistant_data': assistantData,
  'billableai_auto_message': message,
  'billableai_auto_open_assistant': true
});
```

#### localStorage Fallback
```javascript
// Fallback storage method
localStorage.setItem('billableai_assistant_data', JSON.stringify(assistantData));
localStorage.setItem('billableai_auto_message', message);
```

### Assistant Integration

#### Auto Message Injection
```javascript
// Automatically injects message when assistant opens
if (autoMessage && result.billableai_auto_open_assistant) {
  const userMessage = {
    id: Date.now() + 1,
    type: 'user',
    content: autoMessage,
    timestamp: new Date()
  };
  setMessages(prev => [...prev, userMessage]);
  generateGeminiResponse(autoMessage, assistantData);
}
```

#### Enhanced AI Prompting
```javascript
// Includes email context in AI prompts
if (assistantData && assistantData.emailData && assistantData.timeSpent) {
  prompt += `
    CONTEXT - Email Tracking Data:
    • Email Subject: ${assistantData.emailData.subject}
    • Email Recipients: ${assistantData.emailData.to}
    • Time Spent Composing: ${formatTime(assistantData.timeSpent)}
  `;
}
```

## Usage

### For Users

1. **Install Extension**: Load the Chrome extension
2. **Navigate to Gmail**: Open Gmail in browser
3. **Click Compose**: Click the Gmail compose button
4. **Start Typing**: Begin typing your email
5. **Monitor Timer**: Watch the notification component track your time
6. **Send Email**: Click Gmail's send button
7. **Get Summary**: Assistant automatically opens with billable summary

### For Developers

#### Testing
```bash
# Run the test page
open extension/test-gmail-notification-system.html
```

#### Building
```bash
# Build the extension
npm run build
```

#### Debugging
```javascript
// Check console for detailed logs
console.log('🎯 BillableAI: [Component] [Action] [Details]');
```

## Configuration

### Manifest Updates
```json
{
  "content_scripts": [
    {
      "matches": ["https://mail.google.com/*"],
      "js": ["tracking-script-enhanced.js", "gmail-notification-content-script.js"],
      "run_at": "document_end"
    }
  ],
  "web_accessible_resources": [
    {
      "resources": ["gmail-notification-content-script.js"],
      "matches": ["https://mail.google.com/*"]
    }
  ]
}
```

### Constants
```javascript
const TYPING_PAUSE_DELAY = 3000; // 3 seconds
const TIMER_UPDATE_INTERVAL = 1000; // 1 second
```

## Error Handling

### Graceful Degradation
- **Chrome Storage Unavailable**: Falls back to localStorage
- **Extension Context Invalid**: Continues with local tracking
- **Assistant Unavailable**: Shows fallback message
- **Gmail API Errors**: Continues with DOM-based tracking

### Error Recovery
```javascript
try {
  // Primary method
  await chrome.storage.local.set(data);
} catch (error) {
  // Fallback method
  localStorage.setItem(key, JSON.stringify(data));
}
```

## Performance Considerations

### Memory Management
- **Cleanup on Unload**: Removes event listeners and intervals
- **Efficient DOM Queries**: Uses cached selectors where possible
- **Debounced Updates**: Limits UI updates to prevent performance issues

### Resource Optimization
- **Minimal DOM Manipulation**: Updates only necessary elements
- **Efficient State Management**: Uses React state for UI updates
- **Smart Event Handling**: Prevents duplicate event listeners

## Security

### Data Privacy
- **Local Storage Only**: No external data transmission
- **User Consent**: Only tracks when user actively composes
- **Secure Storage**: Uses Chrome's secure storage APIs

### Gmail Integration
- **Non-Intrusive**: Doesn't modify Gmail's core functionality
- **Respectful Integration**: Uses Gmail's existing UI patterns
- **Safe DOM Access**: Only reads necessary email data

## Troubleshooting

### Common Issues

#### Timer Not Starting
1. Check if Gmail compose window is detected
2. Verify typing detection is working
3. Check console for error messages

#### Assistant Not Opening
1. Verify background script is running
2. Check storage permissions
3. Ensure popup can be opened

#### Data Not Persisting
1. Check Chrome storage permissions
2. Verify localStorage is available
3. Check for storage quota issues

### Debug Mode
```javascript
// Enable detailed logging
window.billableAIDebug = true;
```

## Future Enhancements

### Planned Features
- **Multiple Email Support**: Track multiple compose windows
- **Advanced Analytics**: Detailed time analysis and insights
- **Integration APIs**: Connect with external billing systems
- **Custom Templates**: User-defined billing templates

### Performance Improvements
- **Web Workers**: Move heavy processing to background threads
- **Service Worker Caching**: Cache frequently used data
- **Optimized DOM Queries**: Reduce DOM traversal overhead

## Contributing

### Development Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Build the extension: `npm run build`
4. Load extension in Chrome
5. Test with Gmail

### Code Style
- **ES6+**: Use modern JavaScript features
- **React Hooks**: Prefer functional components with hooks
- **Error Handling**: Always include try-catch blocks
- **Logging**: Use consistent logging format

### Testing
- **Unit Tests**: Test individual functions
- **Integration Tests**: Test component interactions
- **E2E Tests**: Test complete workflows
- **Manual Testing**: Test with real Gmail

## License

This project is part of the BillableAI Chrome Extension. See the main project license for details.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review console logs for errors
3. Test with the provided test page
4. Create an issue with detailed information

---

**Note**: This system is designed to work specifically with Gmail's web interface. Changes to Gmail's DOM structure may require updates to the selectors used for detection. 