const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');

const PORT = 8080;
const BASE_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';

  const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(BASE_DIR, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const localUrl = `http://localhost:${PORT}/index.html`;

  // Find local IP address on Wi-Fi/LAN
  const nets = os.networkInterfaces();
  let wifiIp = null;
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        wifiIp = net.address;
        break;
      }
    }
    if (wifiIp) break;
  }

  console.log('========================================================');
  console.log('🚀 SERVER PWA DAPUR MOM FITRI BERHASIL BERJALAN!');
  console.log('========================================================');
  console.log(`\n💻 Buka di PC / Laptop:\n   👉 ${localUrl}`);
  if (wifiIp) {
    console.log(`\n📱 Buka di HP / Ponsel (Satu Jaringan Wi-Fi):\n   👉 http://${wifiIp}:${PORT}/index.html`);
  }
  console.log('\n✅ PWA SIAP DI-INSTALL:');
  console.log('• Di PC: Klik tombol (+) atau "Install" di bilah alamat browser.');
  console.log('• Di HP Android: Buka di Chrome -> Titik Tiga (⋮) -> Pasang Aplikasi.');
  console.log('• Di iPhone: Buka di Safari -> Tombol Bagikan -> Tambah ke Layar Utama.');
  console.log('========================================================\n');

  // Automatically open browser on Windows
  exec(`start ${localUrl}`);
});
