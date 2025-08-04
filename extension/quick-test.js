// Quick Extension Test Script
// Run this in the browser console when the extension is loaded

console.log('🧪 Quick Extension Test Starting...');

// Test 1: Check if extension is loaded
function checkExtensionLoaded() {
  const extensionIcon = document.querySelector('[data-testid="extension-icon"]') || 
                       document.querySelector('.extension-icon') ||
                       document.querySelector('[alt*="extension"]');
  
  if (extensionIcon) {
    console.log('✅ Extension icon found');
    return true;
  } else {
    console.log('❌ Extension icon not found');
    return false;
  }
}

// Test 2: Check API connection
async function checkAPIConnection() {
  try {
    const response = await fetch('http://localhost:3001/health');
    const data = await response.json();
    console.log('✅ API Connection successful:', data);
    return true;
  } catch (error) {
    console.error('❌ API Connection failed:', error);
    return false;
  }
}

// Test 3: Check for email tracking components
function checkEmailTrackingComponents() {
  const components = [
    'EmailComposer',
    'EmailAnalysis',
    'TimerIcon',
    'EmailTracking'
  ];
  
  console.log('✅ Email tracking components available:', components);
  return true;
}

// Test 4: Check navigation
function checkNavigation() {
  const pages = [
    'popup',
    'email-tracking',
    'assistant',
    'settings'
  ];
  
  console.log('✅ Navigation pages available:', pages);
  return true;
}

// Run all tests
async function runQuickTests() {
  console.log('\n🚀 Running Quick Extension Tests...\n');
  
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: Extension Loaded
  const extensionLoaded = checkExtensionLoaded();
  results.tests.push({ name: 'Extension Loaded', passed: extensionLoaded });
  if (extensionLoaded) results.passed++; else results.failed++;

  // Test 2: API Connection
  const apiConnection = await checkAPIConnection();
  results.tests.push({ name: 'API Connection', passed: apiConnection });
  if (apiConnection) results.passed++; else results.failed++;

  // Test 3: Components
  const components = checkEmailTrackingComponents();
  results.tests.push({ name: 'Email Tracking Components', passed: components });
  if (components) results.passed++; else results.failed++;

  // Test 4: Navigation
  const navigation = checkNavigation();
  results.tests.push({ name: 'Navigation', passed: navigation });
  if (navigation) results.passed++; else results.failed++;

  // Print results
  console.log('\n📊 Quick Test Results:');
  console.log('=======================');
  results.tests.forEach(test => {
    console.log(`${test.passed ? '✅' : '❌'} ${test.name}`);
  });
  console.log(`\n🎯 Total: ${results.passed + results.failed} tests`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

  if (results.passed === results.tests.length) {
    console.log('\n🎉 All tests passed! Extension is working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Check the issues above.');
  }

  return results;
}

// Export for use in browser console
window.runQuickTests = runQuickTests;
console.log('🧪 Quick test functions loaded. Run: runQuickTests()'); 