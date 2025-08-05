// OAuth callback JavaScript
async function processAuth(code) {
  const statusDiv = document.getElementById('status');
  const authButton = document.getElementById('authButton');
  
  try {
    statusDiv.innerHTML = '<p>⏳ Sending authorization code to server...</p>';
    authButton.disabled = true;
    authButton.textContent = 'Processing...';
    
    const response = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code })
    });
    
    statusDiv.innerHTML = '<p>✅ Response received from server</p>';
    
    if (!response.ok) {
      throw new Error('HTTP ' + response.status + ': ' + response.statusText);
    }
    
    const result = await response.json();
    statusDiv.innerHTML = '<p>✅ Processing server response...</p>';
    
    if (result.success) {
      document.body.innerHTML = '<h1 style="color: #10b981;">🎉 Authentication Complete!</h1><p>You can now close this window and use the BillableAI extension.</p><p><strong>JWT Token:</strong> <code style="background: rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 4px;">' + (result.token ? result.token.substring(0, 50) + '...' : 'Generated') + '</code></p>';
    } else {
      document.body.innerHTML = '<h1 style="color: #dc2626;">❌ Authentication Failed</h1><p>Error: ' + (result.error || 'Unknown error') + '</p><p>Please check your backend logs for more details.</p>';
    }
  } catch (error) {
    console.error('Authentication error:', error);
    statusDiv.innerHTML = '<p style="color: #dc2626;">❌ Error: ' + error.message + '</p>';
    authButton.disabled = false;
    authButton.textContent = 'Retry Authentication';
  }
}

// Auto-start authentication after 2 seconds
function startAuth(code) {
  setTimeout(() => {
    processAuth(code);
  }, 2000);
} 