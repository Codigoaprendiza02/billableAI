# 🤖 Gemini API Setup Guide

## Why You're Seeing "model: template"

Currently, your application is using **template-based summaries** instead of real AI-generated summaries because the Gemini API key is not configured.

## How to Get a Real Gemini API Key

### 1. Go to Google AI Studio
Visit: https://makersuite.google.com/app/apikey

### 2. Create API Key
- Click "Create API Key"
- Copy the generated key

### 3. Update Environment File
Edit `backend/env.local` and replace:
```
GEMINI_API_KEY=your_gemini_api_key
```
with:
```
GEMINI_API_KEY=AIzaSyC...your_actual_key_here
```

### 4. Restart Backend
```bash
cd backend
npm start
```

## What You'll See After Setup

### Before (Template-based):
- **Model**: template
- **Summary**: Generic template text
- **Suggestions**: Keyword-based matching

### After (AI-generated):
- **Model**: gemini
- **Summary**: Real AI-generated legal billing descriptions
- **Suggestions**: AI-powered client and matter suggestions

## Example Real AI Summary

Instead of:
> "Email correspondence regarding Email communication. Composed detailed email communication (6 words, 2 sentences) requiring legal analysis and professional correspondence. Time spent: 0.01 hours."

You'll get:
> "Contract review and legal correspondence regarding client agreement terms. Analyzed proposed contract language, identified potential legal issues, and drafted response with recommended modifications. Time spent: 0.01 hours."

## Testing

After setting up the API key:
1. Restart the backend server
2. Send an email through the extension
3. Check the console logs for "🤖 Using Gemini API for summary generation"
4. The summary should show "model: gemini" instead of "model: template"

## Troubleshooting

- **API Key Invalid**: Make sure you copied the full key correctly
- **Rate Limits**: Gemini has usage limits, but they're generous for testing
- **Network Issues**: Ensure your server can reach Google's API endpoints 