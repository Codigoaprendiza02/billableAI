import axios from 'axios';
import dotenv from 'dotenv';
import { log } from './src/utils/logger.js';

// Load environment variables
dotenv.config();

const API_BASE_URL = 'http://localhost:3001/api';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function logSuccess(message) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logError(message) {
  console.log(`${colors.red}❌ ${message}${colors.reset}`);
}

function logWarning(message) {
  console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

function logInfo(message) {
  console.log(`${colors.blue}ℹ️  ${message}${colors.reset}`);
}

function logHeader(message) {
  console.log(`\n${colors.bold}${colors.blue}${'='.repeat(50)}${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}${message}${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}${'='.repeat(50)}${colors.reset}\n`);
}

// Test 1: Environment Variables Check
async function testEnvironmentVariables() {
  logHeader('TESTING ENVIRONMENT VARIABLES');
  
  const requiredVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET', 
    'CLIO_CLIENT_ID',
    'CLIO_CLIENT_SECRET',
    'GEMINI_API_KEY',
    'JWT_SECRET'
  ];

  let allPresent = true;
  
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (value && !value.includes('your_') && !value.includes('<')) {
      logSuccess(`${varName}: Configured`);
    } else {
      logError(`${varName}: Not configured or using placeholder`);
      allPresent = false;
    }
  }

  if (!allPresent) {
    logWarning('Some environment variables are not properly configured. Some tests may fail.');
  }

  return allPresent;
}

// Test 2: Backend Server Health Check
async function testBackendHealth() {
  logHeader('TESTING BACKEND SERVER HEALTH');
  
  try {
    const response = await axios.get('http://localhost:3001/health');
    if (response.status === 200) {
      logSuccess('Backend server is running and healthy');
      return true;
    } else {
      logError(`Backend health check failed with status: ${response.status}`);
      return false;
    }
  } catch (error) {
    logError(`Backend server is not running: ${error.message}`);
    logInfo('Make sure to start the backend server with: npm run dev');
    return false;
  }
}

// Test 3: OAuth Configuration Test
async function testOAuthConfiguration() {
  logHeader('TESTING OAUTH CONFIGURATION');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/auth/test-oauth`);
    logSuccess('OAuth configuration endpoint accessible');
    
    const data = response.data;
    if (data.hasClientId && data.hasClientSecret) {
      logSuccess('Google OAuth credentials are configured');
      logInfo(`Client ID starts with: ${data.clientIdStart}`);
      logInfo(`Client ID ends with: ${data.clientIdEnd}`);
      return true;
    } else {
      logError('Google OAuth credentials are not properly configured');
      return false;
    }
  } catch (error) {
    logError(`OAuth configuration test failed: ${error.message}`);
    return false;
  }
}

// Test 4: Gemini API Test
async function testGeminiAPI() {
  logHeader('TESTING GEMINI API');
  
  try {
    const testEmail = `
      Subject: Client Meeting Follow-up
      
      Hi John,
      
      Thank you for the meeting today. I've reviewed the contract terms we discussed and have some questions about the liability clause in section 3.2. Could you please clarify the scope of indemnification?
      
      Also, regarding the payment schedule, I'd like to confirm if the 30-day payment terms apply to all deliverables or just the final submission.
      
      Looking forward to your response.
      
      Best regards,
      Sarah
    `;

    const response = await axios.post(`${API_BASE_URL}/ai/test-summarize`, {
      emailText: testEmail,
      timeSpent: 15,
      emailTone: 'formal'
    });

    if (response.status === 200) {
      logSuccess('Gemini API test successful');
      logInfo('Generated summary:');
      console.log(`${colors.yellow}${response.data.summary}${colors.reset}`);
      return true;
    } else {
      logError(`Gemini API test failed with status: ${response.status}`);
      return false;
    }
  } catch (error) {
    if (error.response?.status === 401) {
      logError('Gemini API key is invalid or missing');
    } else {
      logError(`Gemini API test failed: ${error.message}`);
    }
    return false;
  }
}

// Test 5: Google OAuth Flow Test
async function testGoogleOAuthFlow() {
  logHeader('TESTING GOOGLE OAUTH FLOW');
  
  try {
    // Get the OAuth URL
    const oauthResponse = await axios.get(`${API_BASE_URL}/auth/debug-oauth`);
    const oauthUrl = oauthResponse.data.fullAuthUrl;
    
    logInfo('Google OAuth URL generated successfully');
    logInfo('To test the full OAuth flow:');
    logInfo(`1. Open this URL in your browser: ${oauthUrl}`);
    logInfo('2. Complete the Google OAuth process');
    logInfo('3. You should be redirected back to the callback page');
    
    logWarning('This test requires manual browser interaction');
    logWarning('The OAuth flow cannot be fully automated in this script');
    
    return true;
  } catch (error) {
    logError(`OAuth URL generation failed: ${error.message}`);
    return false;
  }
}

// Test 6: Clio API Configuration Test
async function testClioConfiguration() {
  logHeader('TESTING CLIO API CONFIGURATION');
  
  try {
    const clioClientId = process.env.CLIO_CLIENT_ID;
    const clioClientSecret = process.env.CLIO_CLIENT_SECRET;
    
    if (clioClientId && clioClientSecret && 
        !clioClientId.includes('your_') && !clioClientSecret.includes('your_')) {
      logSuccess('Clio API credentials are configured');
      logInfo('Clio OAuth flow can be tested after Google OAuth is completed');
      return true;
    } else {
      logWarning('Clio API credentials are not configured');
      logInfo('This is optional for initial testing');
      return false;
    }
  } catch (error) {
    logError(`Clio configuration test failed: ${error.message}`);
    return false;
  }
}

// Test 7: Database Connection Test
async function testDatabaseConnection() {
  logHeader('TESTING DATABASE CONNECTION');
  
  try {
    const response = await axios.get('http://localhost:3001/health');
    if (response.data.database === 'connected') {
      logSuccess('MongoDB is connected');
      return true;
    } else {
      logWarning('MongoDB is not connected - running in fallback mode');
      logInfo('This is acceptable for testing OAuth flows');
      return false;
    }
  } catch (error) {
    logWarning('Could not check database status');
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log(`${colors.bold}${colors.blue}🚀 BILLABLEAI API TESTING SUITE${colors.reset}\n`);
  
  const results = {
    environment: await testEnvironmentVariables(),
    backend: await testBackendHealth(),
    oauth: await testOAuthConfiguration(),
    gemini: await testGeminiAPI(),
    googleOAuth: await testGoogleOAuthFlow(),
    clio: await testClioConfiguration(),
    database: await testDatabaseConnection()
  };

  // Summary
  logHeader('TEST RESULTS SUMMARY');
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  console.log(`${colors.bold}Tests Passed: ${colors.green}${passed}/${total}${colors.reset}\n`);
  
  for (const [test, result] of Object.entries(results)) {
    const status = result ? `${colors.green}✅ PASS${colors.reset}` : `${colors.red}❌ FAIL${colors.reset}`;
    console.log(`${test.toUpperCase()}: ${status}`);
  }

  // Recommendations
  logHeader('RECOMMENDATIONS');
  
  if (!results.backend) {
    logError('Start the backend server first: npm run dev');
  }
  
  if (!results.environment) {
    logError('Update your .env file with real credentials');
  }
  
  if (!results.gemini) {
    logWarning('Get a Gemini API key from Google AI Studio');
  }
  
  if (results.backend && results.oauth) {
    logSuccess('Ready to test Google OAuth flow!');
    logInfo('Run the OAuth URL in your browser to complete the test');
  }

  console.log(`\n${colors.bold}${colors.blue}${'='.repeat(50)}${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}TESTING COMPLETE${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}${'='.repeat(50)}${colors.reset}\n`);
}

// Run the tests
runAllTests().catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
}); 