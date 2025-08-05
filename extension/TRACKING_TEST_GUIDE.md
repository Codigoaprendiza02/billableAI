# BillableAI Email Tracking Test Guide

## Overview
The email tracking functionality has been implemented with enhanced debugging and visual indicators. Here's how to test it:

## Features Implemented

### 1. Visual Indicators
- **Green indicator** in top-right corner shows "Ready" when extension is loaded
- **Red indicator** shows "Tracking: MM:SS" when actively tracking
- **Orange indicator** shows "Paused: MM:SS" when tracking is paused
- **Green borders** around detected compose elements
- **Red borders** around detected send buttons

### 2. Enhanced Gmail Detection
- More comprehensive selectors for Gmail compose elements
- Better send button detection
- Periodic re-scanning for dynamic content
- Visual highlighting of detected elements

### 3. Manual Testing Functions
Access these functions in the browser console:
```javascript
// Start tracking manually
window.billableAI.startTracking()

// Stop tracking manually  
window.billableAI.stopTracking()

// Pause tracking manually
window.billableAI.pauseTracking()

// Resume tracking manually
window.billableAI.resumeTracking()

// Get current status
window.billableAI.getStatus()

// Test Gmail detection
window.billableAI.testDetection()
```

### 4. Automatic Tracking
- Starts when you type in Gmail compose fields
- Pauses after 5 seconds of inactivity
- Resumes when you start typing again
- Stops when send button is clicked

## Testing Steps

### Step 1: Load the Extension
1. Open Chrome and go to `chrome://extensions/`
2. Enable Developer mode
3. Load unpacked extension from the `extension/public` folder
4. Make sure the extension is enabled

### Step 2: Test on Gmail
1. Go to `https://mail.google.com`
2. You should see a green indicator in the top-right corner
3. Open a compose window
4. Start typing in the message body
5. The indicator should turn red and show tracking time
6. Stop typing for 5 seconds - it should pause (orange)
7. Start typing again - it should resume (red)
8. Click send - it should stop tracking

### Step 3: Test with Local Test Page
1. Open `extension/test-tracking.html` in Chrome
2. Use the manual test buttons to control tracking
3. Try typing in the simulated email fields
4. Check the browser console for detailed logs

### Step 4: Debug Console
Open browser console (F12) and look for:
- `🎯 BillableAI:` prefixed messages
- Detection of compose elements and send buttons
- Tracking start/stop/pause/resume events
- Time calculations and status updates

## Troubleshooting

### Extension Not Loading
- Check if the extension is enabled in `chrome://extensions/`
- Look for any errors in the extension's background page
- Reload the extension if needed

### No Visual Indicator
- Check if the content script is running (console logs)
- Make sure you're on a supported page (Gmail or localhost)
- Try refreshing the page

### Tracking Not Starting
- Check if Gmail compose elements are being detected
- Look for green borders around compose fields
- Try the manual test functions in console
- Check if there are any JavaScript errors

### Time Not Updating
- The indicator updates every second
- Check if the tracking state is correct
- Use `window.billableAI.getStatus()` to see current state

## Keyboard Shortcuts
- **Ctrl+Shift+T**: Toggle tracking on/off

## Expected Behavior

### On Gmail:
1. Extension loads with green "Ready" indicator
2. Compose elements get green borders when detected
3. Send buttons get red borders when detected
4. Typing starts tracking (red indicator with time)
5. Inactivity pauses tracking (orange indicator with accumulated time)
6. Sending stops tracking and generates summary

### Console Output:
```
🎯 BillableAI: Tracking logic injected into page context
🎯 BillableAI: Gmail API email tracking initialized
🎯 BillableAI: Found X compose elements
🎯 BillableAI: Found Y send buttons
🎯 BillableAI: Email input detected: Z characters
🎯 BillableAI: Starting tracking from input
🎯 BillableAI: Email tracking started
```

## Next Steps
Once basic tracking is working:
1. Test with real Gmail compose windows
2. Verify time calculations are accurate
3. Test summary generation when sending
4. Test with different Gmail layouts and themes 