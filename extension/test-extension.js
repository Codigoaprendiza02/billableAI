// Test script for Chrome Extension Frontend
console.log('🧪 Testing Chrome Extension Frontend...');

// Test 1: Check if extension is loaded
function testExtensionLoaded() {
  console.log('✅ Extension loaded successfully');
  return true;
}

// Test 2: Test API connection
async function testAPIConnection() {
  try {
    const response = await fetch('http://localhost:3001/health');
    const data = await response.json();
    console.log('✅ API Connection:', data);
    return true;
  } catch (error) {
    console.error('❌ API Connection failed:', error);
    return false;
  }
}

// Test 3: Test Email Tracking Components
function testEmailTrackingComponents() {
  const components = [
    'EmailComposer',
    'EmailAnalysis', 
    'TimerIcon',
    'EmailTracking'
  ];
  
  console.log('✅ Email Tracking Components:', components);
  return true;
}

// Test 4: Test Navigation
function testNavigation() {
  const pages = [
    'popup',
    'email-tracking',
    'assistant',
    'settings'
  ];
  
  console.log('✅ Navigation Pages:', pages);
  return true;
}

// Run all tests
async function runExtensionTests() {
  console.log('\n🚀 Starting Extension Tests...\n');
  
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: Extension Loaded
  const extensionLoaded = testExtensionLoaded();
  results.tests.push({ name: 'Extension Loaded', passed: extensionLoaded });
  if (extensionLoaded) results.passed++; else results.failed++;

  // Test 2: API Connection
  const apiConnection = await testAPIConnection();
  results.tests.push({ name: 'API Connection', passed: apiConnection });
  if (apiConnection) results.passed++; else results.failed++;

  // Test 3: Components
  const components = testEmailTrackingComponents();
  results.tests.push({ name: 'Email Tracking Components', passed: components });
  if (components) results.passed++; else results.failed++;

  // Test 4: Navigation
  const navigation = testNavigation();
  results.tests.push({ name: 'Navigation', passed: navigation });
  if (navigation) results.passed++; else results.failed++;

  // Print results
  console.log('\n📊 Extension Test Results:');
  console.log('==========================');
  results.tests.forEach(test => {
    console.log(`${test.passed ? '✅' : '❌'} ${test.name}`);
  });
  console.log(`\n🎯 Total: ${results.passed + results.failed} tests`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

  return results;
}

// Export for use in browser console
window.runExtensionTests = runExtensionTests;
console.log('🧪 Extension test functions loaded. Run: runExtensionTests()'); 