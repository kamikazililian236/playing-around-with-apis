/**
 * FocusStudio - Lightweight Stateless HTTP server
 * Requires ZERO external dependencies (uses Node.js standard library)
 * Author: Lilian Kamikazi
 */
 
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // custom header to verify loda balancing between web-01 and web-02
  res.setHeader('X-Served-By', os.hostname());

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // 1. Health check endpoint for HAProxy load balancers
  if (pathname == '/api/health') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    return res.end(JSON.stringify({
      status: 'healthy',
      server: os.hostname(),
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString()
    }));
  }


    // 2. Unknown API route -> 404 JSON
    if (pathname.startsWith('/api/')) {
      res.writeHead(404, { 'Content-Type': 'application/json'});
      return res.end(JSON.stringify({ error: 'Not Found' }));
    }

    // 3. Status file serving from public/
    let decodedPath;
    try {
      decodedPath = decodeURIComponent(pathname);
    } catch {
      res. writeHead(400, { 'Content-Type': 'text/plain' });
      return res.end('Bad Request');
    }

    const relativePath = decodedPath === '/' ? 'index.html' : decodedPath.replace(/^\/+/, '');
    const filePath = path.resolve(PUBLIC_DIR, relativePath); 

    // Security check against directory traversal
    if (!filePath.startsWith(PUBLIC_DIR + path.sep)) {
      res.writeHead(403, { 'Content-Type': 'text/plain'});
      return res.end('Forbidden');
  }

  fs.stat(filePath, (err,stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, {'Content-Type': 'text/plain'});
      return res.end('404 Not Found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain'});
        return res.end('Internal Server Error');
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[FocusStudio] Server active on  http://0.0.0.0:${PORT} (Node: ${os.hostname()}) `);
  });
