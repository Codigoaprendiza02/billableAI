# BillableAI Chrome Extension

AI-powered time tracking and email management for lawyers with Clio integration.

## Features

- 🤖 **AI Assistant**: Chat interface for email drafting and summaries
- ⏰ **Time Tracking**: Automatic billable time tracking from email activity
- 🔗 **Clio Integration**: Seamless integration with Clio case management
- 📧 **Gmail Integration**: Real-time email activity monitoring
- 🎨 **Modern UI**: Beautiful gradient design with glassmorphism effects
- 📱 **Responsive**: Perfect for Chrome extension popup

## Development

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Google Chrome browser

### Installation

1. Clone the repository
2. Navigate to the extension directory:
   ```bash
   cd extension
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

### Building the Extension

1. Build the extension:
   ```bash
   npm run build:extension
   ```

2. The extension files will be created in the `extension-dist` directory.

## Testing the Extension

### Load Extension in Chrome

1. Open Google Chrome
2. Navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `extension-dist` directory
6. The BillableAI extension should now appear in your extensions list

### Testing Features

1. **Popup Testing**:
   - Click the BillableAI extension icon in the toolbar
   - Test the onboarding flow (first time)
   - Navigate between pages (Home, Assistant, Settings)

2. **Gmail Integration**:
   - Open Gmail in a new tab
   - The extension should detect Gmail and inject content scripts
   - Check browser console for "BillableAI content script loaded" message

3. **Settings**:
   - Test all toggle switches and form inputs
   - Verify data persistence across sessions

## Project Structure

```
extension/
├── public/
│   ├── manifest.json          # Extension manifest
│   ├── background.js          # Service worker
│   ├── contentScript.js       # Gmail integration
│   ├── contentStyles.css      # Content styles
│   ├── popup.html            # Popup entry point
│   └── icons/                # Extension icons
├── src/
│   ├── pages/                # Main pages
│   │   ├── Popup.jsx         # Home page
│   │   ├── Assistant.jsx     # Chat interface
│   │   ├── Settings.jsx      # Settings page
│   │   └── Onboarding.jsx    # Onboarding flow
│   ├── components/           # Reusable components
│   ├── icons/               # SVG icon components
│   ├── onboarding/          # Onboarding steps
│   ├── context/             # React Context API
│   └── utils/               # Utility functions
├── build-extension.js       # Build script
└── package.json
```

## Configuration

### Manifest.json

The extension manifest includes:
- **Permissions**: Storage, active tab, scripting, identity
- **Host Permissions**: Gmail, Clio API access
- **Content Scripts**: Gmail integration
- **Background Script**: Service worker for data management

### Environment Variables

For production, update these in `manifest.json`:
- `YOUR_CLIO_CLIENT_ID`: Replace with actual Clio OAuth client ID
- API endpoints for backend integration

## Development Notes

### CSS Warnings

The CSS warnings for Tailwind directives are normal and don't affect functionality. They're resolved by:
- VS Code settings in `.vscode/settings.json`
- Stylelint configuration in `.stylelintrc.json`
- CSS custom data in `.vscode/css_custom_data.json`

### State Management

The extension uses React Context API for global state:
- User data and preferences
- AI assistant settings
- Billable logging configuration
- Onboarding completion status

### Chrome Extension APIs

The extension uses these Chrome APIs:
- `chrome.storage.local` for data persistence
- `chrome.runtime.sendMessage` for communication
- `chrome.scripting.executeScript` for content injection
- `chrome.tabs.onUpdated` for Gmail detection

## Troubleshooting

### Common Issues

1. **Extension not loading**:
   - Check manifest.json syntax
   - Verify all files exist in extension-dist
   - Check Chrome console for errors

2. **CSS not loading**:
   - Ensure Tailwind CSS is properly configured
   - Check PostCSS configuration
   - Verify build process completed successfully

3. **Gmail integration not working**:
   - Check content script injection
   - Verify host permissions in manifest
   - Check browser console for errors

### Debug Mode

Enable debug logging by adding to background.js:
```javascript
console.log('Debug mode enabled');
```

## Next Steps

1. **Backend Integration**: Connect to your backend API
2. **Clio OAuth**: Implement proper Clio authentication
3. **Gmail API**: Add Gmail API integration for email processing
4. **AI Integration**: Connect to your AI service for email assistance
5. **Testing**: Add comprehensive unit and integration tests

## License

This project is licensed under the MIT License.
