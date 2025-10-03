const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3456;
const STATIC_DIR = path.join(__dirname, '..');

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Serve static files from the deployment directory
app.use(express.static(STATIC_DIR, {
  extensions: ['html', 'htm'],
  index: 'index.html'
}));

// Handle specific routes for HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(STATIC_DIR, 'index.html'));
});

// Catch-all route to handle missing files
app.get('*', (req, res) => {
  // Check if the requested file exists
  const requestedFile = path.join(STATIC_DIR, req.path);
  
  // If it's a file request without extension, try adding .html
  if (!path.extname(req.path)) {
    const htmlFile = requestedFile + '.html';
    if (fs.existsSync(htmlFile)) {
      return res.sendFile(htmlFile);
    }
  }
  
  // If file exists, serve it
  if (fs.existsSync(requestedFile)) {
    return res.sendFile(requestedFile);
  }
  
  // Otherwise, send 404
  res.status(404).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>404 - Page Not Found</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          text-align: center;
          padding: 50px;
        }
        h1 { color: #dc2626; }
        a { color: #2563eb; text-decoration: none; }
        a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <h1>404 - Page Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <p><a href="/">Go to Homepage</a></p>
    </body>
    </html>
  `);
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).send('Internal Server Error');
});

const server = app.listen(PORT, () => {
  console.log(`\n✨ Static server is running!`);
  console.log(`📁 Serving files from: ${STATIC_DIR}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`\n📝 Available pages:`);
  
  // List available HTML files
  const files = fs.readdirSync(STATIC_DIR);
  files.filter(file => file.endsWith('.html')).forEach(file => {
    console.log(`   - http://localhost:${PORT}/${file}`);
  });
  
  console.log(`\n🛑 Press Ctrl+C to stop\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});