import React, { useState, useEffect } from 'react';
import GeminiService from '../services/geminiService.js';

const GeminiSettingsComponent = () => {
  const [apiKey, setApiKey] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    // Load API key from storage on component mount
    const storedApiKey = GeminiService.getApiKeyFromStorage();
    if (storedApiKey) {
      setApiKey(storedApiKey);
      setIsValid(true);
    }
  }, []);

  const handleApiKeyChange = (e) => {
    const newApiKey = e.target.value;
    setApiKey(newApiKey);
    setIsValid(newApiKey.length > 0);
  };

  const handleSaveApiKey = async () => {
    try {
      GeminiService.storeApiKey(apiKey);
      await GeminiService.initialize(apiKey);
      setIsValid(true);
      console.log('🎯 BillableAI: Gemini API key saved and initialized');
    } catch (error) {
      console.error('🎯 BillableAI: Error saving Gemini API key:', error);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      await GeminiService.initialize(apiKey);
      const isConnected = await GeminiService.testConnection();
      
      if (isConnected) {
        setTestResult({ success: true, message: '✅ Gemini API connection successful!' });
        setIsValid(true);
      } else {
        setTestResult({ success: false, message: '❌ Gemini API connection failed. Please check your API key.' });
        setIsValid(false);
      }
    } catch (error) {
      setTestResult({ success: false, message: `❌ Error testing connection: ${error.message}` });
      setIsValid(false);
    } finally {
      setIsTesting(false);
    }
  };

  const handleClearApiKey = () => {
    GeminiService.clearApiKey();
    setApiKey('');
    setIsValid(false);
    setTestResult(null);
    console.log('🎯 BillableAI: Gemini API key cleared');
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        🤖 Gemini AI Settings
      </h3>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="gemini-api-key" className="block text-sm font-medium text-gray-700 mb-2">
            Gemini API Key
          </label>
          <div className="flex space-x-2">
            <input
              type="password"
              id="gemini-api-key"
              value={apiKey}
              onChange={handleApiKeyChange}
              placeholder="Enter your Gemini API key"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleSaveApiKey}
              disabled={!apiKey}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Get your API key from{' '}
            <a
              href="https://makersuite.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800"
            >
              Google AI Studio
            </a>
          </p>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={handleTestConnection}
            disabled={!apiKey || isTesting}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTesting ? 'Testing...' : 'Test Connection'}
          </button>
          
          <button
            onClick={handleClearApiKey}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Clear
          </button>
        </div>

        {testResult && (
          <div className={`p-3 rounded-md ${
            testResult.success 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {testResult.message}
          </div>
        )}

        <div className="bg-gray-50 p-3 rounded-md">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Features Enabled:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>✅ AI-powered email summary generation</li>
            <li>✅ Professional legal billing summaries</li>
            <li>✅ Detailed email content analysis</li>
            <li>✅ Client-specific billing descriptions</li>
          </ul>
        </div>

        <div className="bg-blue-50 p-3 rounded-md">
          <h4 className="text-sm font-medium text-blue-900 mb-2">How it works:</h4>
          <p className="text-sm text-blue-800">
            When you compose and send emails in Gmail, BillableAI will automatically generate 
            professional billing summaries using Google's Gemini AI. The summaries include work 
            descriptions, time tracking, and client-friendly language suitable for legal billing.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GeminiSettingsComponent; 