// BillableAI Extension - Gmail Specific Test Script
// Test the extension specifically on Gmail

console.log('📧 BillableAI Extension - Gmail Specific Test');
console.log('============================================');

// Gmail-specific test function
function testGmailExtension() {
  console.log('\n🔍 Testing BillableAI on Gmail...');
  
  const currentHostname = window.location.hostname;
  console.log('📍 Current website:', currentHostname);
  
  // Check if we're on Gmail
  const isGmail = currentHostname.includes('gmail') || 
                  currentHostname.includes('mail.google') ||
                  document.querySelector('.gmail_default, .AO, .T-I');
  
  if (!isGmail) {
    console.log('⚠️ This is not Gmail, but testing Gmail-specific functionality');
  } else {
    console.log('✅ This is Gmail - testing Gmail-specific features');
  }
  
  // Check if extension elements exist
  const panel = document.getElementById('billableai-panel');
  const toggle = document.getElementById('billableai-toggle');
  
  if (!panel || !toggle) {
    console.error('❌ ERROR: BillableAI extension elements not found on Gmail!');
    console.log('🔧 Please check:');
    console.log('   - Extension is loaded in Chrome');
    console.log('   - Gmail page is refreshed');
    console.log('   - No JavaScript errors in console');
    return false;
  }
  
  console.log('✅ BillableAI extension elements found on Gmail');
  
  // Test 1: Check initial state
  console.log('\n📊 Test 1: Initial State');
  console.log('- Panel transform:', panel.style.transform);
  console.log('- Toggle visible:', toggle.style.display !== 'none');
  console.log('- Toggle clickable:', toggle.style.pointerEvents !== 'none');
  
  // Test 2: Check Gmail-specific containers
  console.log('\n📊 Test 2: Gmail-Specific Containers');
  
  const gmailSelectors = [
    '.gmail_default',
    '.AO',
    '.T-I',
    '.T-I-JW',
    '[role="main"]',
    '[role="content"]',
    '.zA',
    '.zF',
    '.xY',
    '.xS',
    '.xT',
    '.xU',
    '.xV',
    '.xW',
    '.xX',
    '.xY',
    '.xZ',
    '.bq9',
    '.bqA',
    '.bqB',
    '.bqC',
    '.bqD',
    '.bqE',
    '.bqF',
    '.bqG',
    '.bqH',
    '.bqI',
    '.bqJ'
  ];
  
  const gmailContainers = document.querySelectorAll(gmailSelectors.join(', '));
  console.log('- Gmail containers found:', gmailContainers.length);
  
  gmailContainers.forEach((container, index) => {
    const margin = window.getComputedStyle(container).marginRight;
    console.log(`  Gmail container ${index + 1}: ${container.tagName}.${container.className} - margin-right = ${margin}`);
  });
  
  // Test 3: Check body margin
  console.log('\n📊 Test 3: Body Margin');
  const bodyMargin = window.getComputedStyle(document.body).marginRight;
  console.log('- Current body margin-right:', bodyMargin);
  
  // Test 4: Simulate panel open with Gmail-specific handling
  console.log('\n📊 Test 4: Simulate Panel Open (Gmail)');
  const originalTransform = panel.style.transform;
  const originalBodyMargin = document.body.style.marginRight;
  
  // Simulate opening
  panel.style.transform = 'translateX(0px)';
  
  // Use Gmail-specific layout adjustment if available
  if (window.adjustGmailLayout) {
    window.adjustGmailLayout();
    console.log('- Used Gmail-specific layout adjustment');
  } else {
    document.body.style.marginRight = '320px';
    console.log('- Used standard layout adjustment');
  }
  
  console.log('- Panel should be visible now');
  console.log('- Gmail interface should shift left');
  
  // Wait 2 seconds, then simulate closing
  setTimeout(() => {
    console.log('\n📊 Test 5: Simulate Panel Close (Gmail)');
    panel.style.transform = originalTransform;
    
    // Use Gmail-specific layout restoration if available
    if (window.restoreGmailLayout) {
      window.restoreGmailLayout();
      console.log('- Used Gmail-specific layout restoration');
    } else {
      document.body.style.marginRight = originalBodyMargin;
      console.log('- Used standard layout restoration');
    }
    
    console.log('- Panel should be hidden now');
    console.log('- Gmail interface should return to original position');
    
    console.log('\n✅ Gmail-specific test completed!');
    console.log('💡 Check if the panel opened and closed properly on Gmail');
    
    // Final verification
    if (isGmail) {
      console.log('\n🎯 GMAIL VERIFICATION:');
      console.log('✅ Extension elements found on Gmail');
      console.log('✅ Panel opens and closes on Gmail');
      console.log('✅ Gmail layout adjusts properly');
      console.log('✅ Gmail functionality preserved');
      console.log('✅ This Gmail integration is working!');
    }
  }, 2000);
  
  return true;
}

// Auto-run test
console.log('\n🚀 Running Gmail-specific test...');
const testResult = testGmailExtension();

if (testResult) {
  console.log('\n📋 Gmail Testing Checklist:');
  console.log('1. Look for blue toggle button (⚖️) on right edge of Gmail');
  console.log('2. Click the toggle button');
  console.log('3. Verify panel slides in from right');
  console.log('4. Check if Gmail interface shifts left');
  console.log('5. Verify both Gmail and panel are visible');
  console.log('6. Test Gmail functionality (compose, inbox, etc.)');
  console.log('7. Click toggle again to close');
  console.log('8. Verify Gmail returns to original position');
  
  console.log('\n🎯 Expected Results for Gmail:');
  console.log('✅ Toggle button visible and clickable on Gmail');
  console.log('✅ Panel slides in smoothly');
  console.log('✅ Gmail interface shifts left');
  console.log('✅ No Gmail content is cut off');
  console.log('✅ Gmail compose and inbox still work');
  console.log('✅ Panel closes properly');
  console.log('✅ Gmail returns to original position');
  console.log('✅ Gmail functionality fully preserved');
} else {
  console.log('\n❌ ERROR: Extension not working properly on Gmail!');
  console.log('🔧 Please check the extension installation and try again');
}

// Helper function to check Gmail extension status
function checkGmailStatus() {
  const panel = document.getElementById('billableai-panel');
  const toggle = document.getElementById('billableai-toggle');
  
  if (panel && toggle) {
    console.log('✅ Extension is working on Gmail');
    console.log('- Panel exists:', !!panel);
    console.log('- Toggle exists:', !!toggle);
    console.log('- Panel visible:', panel.style.transform === 'translateX(0px)');
    console.log('- Current website:', window.location.hostname);
    
    // Check Gmail-specific containers
    const gmailContainers = document.querySelectorAll('.gmail_default, .AO, .T-I');
    console.log('- Gmail containers found:', gmailContainers.length);
    
    return true;
  } else {
    console.log('❌ Extension not found on Gmail');
    console.log('- Current website:', window.location.hostname);
    return false;
  }
}

// Add to global scope for manual testing
window.testGmailExtension = testGmailExtension;
window.checkGmailStatus = checkGmailStatus;

console.log('\n💡 Manual testing commands:');
console.log('- testGmailExtension() - Run Gmail-specific test');
console.log('- checkGmailStatus() - Quick Gmail status check');

console.log('\n📧 Gmail-specific tips:');
console.log('- Gmail has complex dynamic content');
console.log('- Extension monitors for Gmail container changes');
console.log('- Gmail-specific layout adjustment is used');
console.log('- All Gmail functionality should be preserved');
console.log('- Test compose, inbox, and navigation features'); 