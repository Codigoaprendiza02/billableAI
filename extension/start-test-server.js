const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8000;

// MIME types for different file extensions
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // Parse the URL
  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;
  
  // Default to index.html if root is requested
  if (pathname === '/') {
    pathname = '/extension-diagnostic.html';
  }
  
  // Get the file path
  const filePath = path.join(__dirname, pathname);
  
  // Get file extension
  const extname = path.extname(filePath);
  const contentType = mimeTypes[extname] || 'application/octet-stream';
  
  // Read the file
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // File not found
        console.log(`File not found: ${filePath}`);
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(`
          <html>
            <head><title>404 - File Not Found</title></head>
            <body>
              <h1>404 - File Not Found</h1>
              <p>The file <code>${pathname}</code> was not found.</p>
              <p>Available files:</p>
              <ul>
                <li><a href="/extension-diagnostic.html">Extension Diagnostic</a></li>
                <li><a href="/test-background-service-worker.html">Background Service Worker Test</a></li>
                <li><a href="/test-basic-script.html">Basic Script Test</a></li>
                <li><a href="/test-simple-script.html">Simple Script Test</a></li>
                <li><a href="/test-modular-debug.html">Modular Debug Test</a></li>
              </ul>
            </body>
          </html>
        `);
      } else {
        // Server error
        console.error(`Server error: ${err.code}`);
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      // Success
      res.writeHead(200, { 
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Test server running at http://localhost:${PORT}`);
  console.log(`📁 Serving files from: ${__dirname}`);
  console.log(`🔧 Available test pages:`);
  console.log(`   - http://localhost:${PORT}/extension-diagnostic.html`);
  console.log(`   - http://localhost:${PORT}/test-background-service-worker.html`);
  console.log(`   - http://localhost:${PORT}/test-basic-script.html`);
  console.log(`   - http://localhost:${PORT}/test-simple-script.html`);
  console.log(`   - http://localhost:${PORT}/test-modular-debug.html`);
  console.log(`\n💡 Press Ctrl+C to stop the server`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down test server...');
  server.close(() => {
    console.log('✅ Test server stopped');
    process.exit(0);
  });
}); 