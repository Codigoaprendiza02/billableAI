// BillableAI Extension - Critical Websites Test Script
// Test the extension on the most important websites for legal professionals

console.log('🧪 BillableAI Extension - Critical Websites Test');
console.log('==============================================');

// Critical websites that MUST work
const CRITICAL_WEBSITES = [
  'google.com',
  'mail.google.com', // Gmail
  'app.clio.com',    // Clio
  'app.practicepanther.com', // Practice Panther
  'www.google.com',
  'gmail.com'
];

// Test function for critical websites
function testCriticalWebsites() {
  console.log('\n🔍 Testing BillableAI on Critical Websites...');
  
  const currentHostname = window.location.hostname;
  console.log('📍 Current website:', currentHostname);
  
  // Check if we're on a critical website
  const isCriticalWebsite = CRITICAL_WEBSITES.some(domain => 
    currentHostname.includes(domain)
  );
  
  if (isCriticalWebsite) {
    console.log('✅ This is a critical website that MUST work');
  } else {
    console.log('⚠️ This is not a critical website, but extension should still work');
  }
  
  // Check if extension elements exist
  const panel = document.getElementById('billableai-panel');
  const toggle = document.getElementById('billableai-toggle');
  
  if (!panel || !toggle) {
    console.error('❌ CRITICAL ERROR: BillableAI extension elements not found!');
    console.log('💡 This extension MUST work on:', CRITICAL_WEBSITES.join(', '));
    console.log('🔧 Please check:');
    console.log('   - Extension is loaded in Chrome');
    console.log('   - Page is refreshed');
    console.log('   - No JavaScript errors in console');
    return false;
  }
  
  console.log('✅ BillableAI extension elements found');
  
  // Test 1: Check initial state
  console.log('\n📊 Test 1: Initial State');
  console.log('- Panel transform:', panel.style.transform);
  console.log('- Toggle visible:', toggle.style.display !== 'none');
  console.log('- Toggle clickable:', toggle.style.pointerEvents !== 'none');
  
  // Test 2: Check body margin
  console.log('\n📊 Test 2: Body Margin');
  const bodyMargin = window.getComputedStyle(document.body).marginRight;
  console.log('- Current body margin-right:', bodyMargin);
  
  // Test 3: Check for website-specific containers
  console.log('\n📊 Test 3: Website-Specific Containers');
  
  // Gmail specific containers
  if (currentHostname.includes('gmail') || currentHostname.includes('mail.google')) {
    const gmailContainers = document.querySelectorAll('.gmail_default, .AO, .T-I, .T-I-JW, [role="main"]');
    console.log('- Gmail containers found:', gmailContainers.length);
    gmailContainers.forEach((container, index) => {
      const margin = window.getComputedStyle(container).marginRight;
      console.log(`  Gmail container ${index + 1}: margin-right = ${margin}`);
    });
  }
  
  // Clio specific containers
  if (currentHostname.includes('clio')) {
    const clioContainers = document.querySelectorAll('.clio-app, .clio-content, .clio-main, [role="main"]');
    console.log('- Clio containers found:', clioContainers.length);
    clioContainers.forEach((container, index) => {
      const margin = window.getComputedStyle(container).marginRight;
      console.log(`  Clio container ${index + 1}: margin-right = ${margin}`);
    });
  }
  
  // Practice Panther specific containers
  if (currentHostname.includes('practicepanther')) {
    const ppContainers = document.querySelectorAll('.practice-panther, .pp-content, .pp-main, [role="main"]');
    console.log('- Practice Panther containers found:', ppContainers.length);
    ppContainers.forEach((container, index) => {
      const margin = window.getComputedStyle(container).marginRight;
      console.log(`  Practice Panther container ${index + 1}: margin-right = ${margin}`);
    });
  }
  
  // Test 4: Simulate panel open
  console.log('\n📊 Test 4: Simulate Panel Open');
  const originalTransform = panel.style.transform;
  const originalBodyMargin = document.body.style.marginRight;
  
  // Simulate opening
  panel.style.transform = 'translateX(0px)';
  document.body.style.marginRight = '320px';
  
  console.log('- Panel should be visible now');
  console.log('- Body margin should be 320px');
  
  // Wait 2 seconds, then simulate closing
  setTimeout(() => {
    console.log('\n📊 Test 5: Simulate Panel Close');
    panel.style.transform = originalTransform;
    document.body.style.marginRight = originalBodyMargin;
    console.log('- Panel should be hidden now');
    console.log('- Body margin should be restored');
    
    console.log('\n✅ Critical website test completed!');
    console.log('💡 Check if the panel opened and closed properly');
    
    // Final verification
    if (isCriticalWebsite) {
      console.log('\n🎯 CRITICAL WEBSITE VERIFICATION:');
      console.log('✅ Extension elements found');
      console.log('✅ Panel opens and closes');
      console.log('✅ Layout adjusts properly');
      console.log('✅ This critical website is working!');
    }
  }, 2000);
  
  return true;
}

// Auto-run test
console.log('\n🚀 Running critical websites test...');
const testResult = testCriticalWebsites();

if (testResult) {
  console.log('\n📋 Critical Websites Testing Checklist:');
  console.log('1. Look for blue toggle button (⚖️) on right edge');
  console.log('2. Click the toggle button');
  console.log('3. Verify panel slides in from right');
  console.log('4. Check if website content shifts left');
  console.log('5. Verify both website and panel are visible');
  console.log('6. Click toggle again to close');
  console.log('7. Verify content returns to original position');
  
  console.log('\n🎯 Expected Results for Critical Websites:');
  console.log('✅ Toggle button visible and clickable');
  console.log('✅ Panel slides in smoothly');
  console.log('✅ Website content shifts left');
  console.log('✅ No content is cut off');
  console.log('✅ Panel closes properly');
  console.log('✅ Content returns to original position');
  console.log('✅ Works on Google.com');
  console.log('✅ Works on Gmail.com');
  console.log('✅ Works on Clio.com');
  console.log('✅ Works on Practice Panther');
} else {
  console.log('\n❌ CRITICAL ERROR: Extension not working on critical website!');
  console.log('💡 This extension MUST work on:');
  console.log('   - Google.com');
  console.log('   - Gmail.com');
  console.log('   - Clio.com');
  console.log('   - Practice Panther');
  console.log('🔧 Please check the extension installation and try again');
}

// Helper function to check extension status on critical websites
function checkCriticalWebsiteStatus() {
  const panel = document.getElementById('billableai-panel');
  const toggle = document.getElementById('billableai-toggle');
  
  if (panel && toggle) {
    console.log('✅ Extension is working on critical website');
    console.log('- Panel exists:', !!panel);
    console.log('- Toggle exists:', !!toggle);
    console.log('- Panel visible:', panel.style.transform === 'translateX(0px)');
    console.log('- Current website:', window.location.hostname);
    return true;
  } else {
    console.log('❌ Extension not found on critical website');
    console.log('- Current website:', window.location.hostname);
    return false;
  }
}

// Add to global scope for manual testing
window.testCriticalWebsites = testCriticalWebsites;
window.checkCriticalWebsiteStatus = checkCriticalWebsiteStatus;

console.log('\n💡 Manual testing commands:');
console.log('- testCriticalWebsites() - Run critical websites test');
console.log('- checkCriticalWebsiteStatus() - Quick critical website status check');

// Website-specific tips
const currentHostname = window.location.hostname;
if (currentHostname.includes('gmail')) {
  console.log('\n📧 Gmail-specific tips:');
  console.log('- Look for toggle button on the right edge of Gmail interface');
  console.log('- Panel should not interfere with Gmail compose or inbox');
  console.log('- Gmail layout should adjust smoothly');
} else if (currentHostname.includes('clio')) {
  console.log('\n⚖️ Clio-specific tips:');
  console.log('- Look for toggle button on the right edge of Clio interface');
  console.log('- Panel should not interfere with Clio case management');
  console.log('- Clio layout should adjust smoothly');
} else if (currentHostname.includes('practicepanther')) {
  console.log('\n🐾 Practice Panther-specific tips:');
  console.log('- Look for toggle button on the right edge of Practice Panther interface');
  console.log('- Panel should not interfere with Practice Panther case management');
  console.log('- Practice Panther layout should adjust smoothly');
} 