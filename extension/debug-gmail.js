// BillableAI Extension - Gmail Debug Script
// Debug why the panel is not opening on Gmail

console.log('🐛 BillableAI Extension - Gmail Debug Script');
console.log('==========================================');

// Debug function
function debugGmailExtension() {
  console.log('\n🔍 Debugging BillableAI on Gmail...');
  
  const currentHostname = window.location.hostname;
  console.log('📍 Current website:', currentHostname);
  
  // Check if we're on Gmail
  const isGmail = currentHostname.includes('gmail') || 
                  currentHostname.includes('mail.google') ||
                  document.querySelector('.gmail_default, .AO, .T-I');
  
  console.log('📧 Is Gmail detected:', isGmail);
  
  // Check if extension elements exist
  const panel = document.getElementById('billableai-panel');
  const toggle = document.getElementById('billableai-toggle');
  
  console.log('\n📊 Element Check:');
  console.log('- Panel exists:', !!panel);
  console.log('- Toggle exists:', !!toggle);
  
  if (panel) {
    console.log('- Panel transform:', panel.style.transform);
    console.log('- Panel display:', panel.style.display);
    console.log('- Panel visibility:', panel.style.visibility);
    console.log('- Panel z-index:', panel.style.zIndex);
  }
  
  if (toggle) {
    console.log('- Toggle display:', toggle.style.display);
    console.log('- Toggle visibility:', toggle.style.visibility);
    console.log('- Toggle z-index:', toggle.style.zIndex);
    console.log('- Toggle pointer-events:', toggle.style.pointerEvents);
  }
  
  // Check Gmail-specific functions
  console.log('\n📊 Function Check:');
  console.log('- window.adjustGmailLayout exists:', !!window.adjustGmailLayout);
  console.log('- window.restoreGmailLayout exists:', !!window.restoreGmailLayout);
  console.log('- window.adjustLayoutForPanel exists:', !!window.adjustLayoutForPanel);
  console.log('- window.restoreLayout exists:', !!window.restoreLayout);
  
  // Test panel opening manually
  console.log('\n📊 Manual Panel Test:');
  if (panel) {
    console.log('Testing panel opening...');
    const originalTransform = panel.style.transform;
    
    // Try to open panel
    panel.style.transform = 'translateX(0px)';
    console.log('- Panel transform set to translateX(0px)');
    console.log('- Panel should now be visible');
    
    // Check if it worked
    setTimeout(() => {
      console.log('- Panel transform after 1 second:', panel.style.transform);
      console.log('- Panel visible:', panel.style.transform === 'translateX(0px)');
      
      // Restore original
      panel.style.transform = originalTransform;
      console.log('- Panel restored to original state');
    }, 1000);
  }
  
  // Test toggle click manually
  console.log('\n📊 Manual Toggle Test:');
  if (toggle) {
    console.log('Testing toggle click...');
    console.log('- Toggle clickable:', toggle.style.pointerEvents !== 'none');
    console.log('- Toggle visible:', toggle.style.display !== 'none');
    
    // Simulate click
    console.log('- Simulating toggle click...');
    toggle.click();
    
    setTimeout(() => {
      if (panel) {
        console.log('- Panel transform after click:', panel.style.transform);
        console.log('- Panel visible after click:', panel.style.transform === 'translateX(0px)');
      }
    }, 500);
  }
  
  // Check for Gmail containers
  console.log('\n📊 Gmail Container Check:');
  const gmailContainers = document.querySelectorAll('.gmail_default, .AO, .T-I');
  console.log('- Gmail containers found:', gmailContainers.length);
  
  gmailContainers.forEach((container, index) => {
    console.log(`  Container ${index + 1}: ${container.tagName}.${container.className}`);
  });
  
  // Check for any JavaScript errors
  console.log('\n📊 Error Check:');
  console.log('- Check browser console for any JavaScript errors');
  console.log('- Look for any "BillableAI" related error messages');
  
  return true;
}

// Auto-run debug
console.log('\n🚀 Running Gmail debug...');
debugGmailExtension();

// Helper functions for manual testing
function testPanelOpen() {
  const panel = document.getElementById('billableai-panel');
  if (panel) {
    panel.style.transform = 'translateX(0px)';
    console.log('✅ Panel opened manually');
  } else {
    console.log('❌ Panel not found');
  }
}

function testPanelClose() {
  const panel = document.getElementById('billableai-panel');
  if (panel) {
    panel.style.transform = 'translateX(100%)';
    console.log('✅ Panel closed manually');
  } else {
    console.log('❌ Panel not found');
  }
}

function testToggleClick() {
  const toggle = document.getElementById('billableai-toggle');
  if (toggle) {
    toggle.click();
    console.log('✅ Toggle clicked manually');
  } else {
    console.log('❌ Toggle not found');
  }
}

// Add to global scope for manual testing
window.debugGmailExtension = debugGmailExtension;
window.testPanelOpen = testPanelOpen;
window.testPanelClose = testPanelClose;
window.testToggleClick = testToggleClick;

console.log('\n💡 Manual testing commands:');
console.log('- debugGmailExtension() - Run full debug');
console.log('- testPanelOpen() - Manually open panel');
console.log('- testPanelClose() - Manually close panel');
console.log('- testToggleClick() - Manually click toggle');

console.log('\n🐛 Debug tips:');
console.log('- Check if panel and toggle elements exist');
console.log('- Check if Gmail-specific functions are loaded');
console.log('- Check for any JavaScript errors in console');
console.log('- Test panel opening manually');
console.log('- Test toggle clicking manually'); 