// BillableAI Extension - Quick Test Script
// Run this in browser console on any website to test the extension

console.log('🧪 BillableAI Extension - Quick Test Script');
console.log('==========================================');

// Test function
function testBillableAIExtension() {
    console.log('\n🔍 Starting BillableAI Extension Test...');
    
    // Check if extension elements exist
    const panel = document.getElementById('billableai-panel');
    const toggle = document.getElementById('billableai-toggle');
    
    if (!panel || !toggle) {
        console.error('❌ BillableAI extension elements not found!');
        console.log('💡 Make sure the extension is loaded in Chrome');
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
    
    // Test 3: Check main containers
    console.log('\n📊 Test 3: Main Containers');
    const containers = document.querySelectorAll('main, .main, .container, .content, .wrapper, .page, .site-content');
    console.log('- Found containers:', containers.length);
    containers.forEach((container, index) => {
        const margin = window.getComputedStyle(container).marginRight;
        console.log(`  Container ${index + 1}: margin-right = ${margin}`);
    });
    
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
        
        console.log('\n✅ Test completed!');
        console.log('💡 Check if the panel opened and closed properly');
    }, 2000);
    
    return true;
}

// Auto-run test
console.log('\n🚀 Running automatic test...');
const testResult = testBillableAIExtension();

if (testResult) {
    console.log('\n📋 Manual Testing Checklist:');
    console.log('1. Look for blue toggle button (⚖️) on right edge');
    console.log('2. Click the toggle button');
    console.log('3. Verify panel slides in from right');
    console.log('4. Check if website content shifts left');
    console.log('5. Verify both website and panel are visible');
    console.log('6. Click toggle again to close');
    console.log('7. Verify content returns to original position');
    
    console.log('\n🎯 Expected Results:');
    console.log('✅ Toggle button visible and clickable');
    console.log('✅ Panel slides in smoothly');
    console.log('✅ Website content shifts left');
    console.log('✅ No content is cut off');
    console.log('✅ Panel closes properly');
    console.log('✅ Content returns to original position');
} else {
    console.log('\n❌ Extension not found or not working properly');
    console.log('💡 Please check:');
    console.log('   - Extension is loaded in Chrome');
    console.log('   - Page is refreshed');
    console.log('   - No JavaScript errors in console');
}

// Helper function to check extension status
function checkExtensionStatus() {
    const panel = document.getElementById('billableai-panel');
    const toggle = document.getElementById('billableai-toggle');
    
    if (panel && toggle) {
        console.log('✅ Extension is working');
        console.log('- Panel exists:', !!panel);
        console.log('- Toggle exists:', !!toggle);
        console.log('- Panel visible:', panel.style.transform === 'translateX(0px)');
        return true;
    } else {
        console.log('❌ Extension not found');
        return false;
    }
}

// Add to global scope for manual testing
window.testBillableAI = testBillableAIExtension;
window.checkBillableAI = checkExtensionStatus;

console.log('\n💡 Manual testing commands:');
console.log('- testBillableAI() - Run full test');
console.log('- checkBillableAI() - Quick status check'); 