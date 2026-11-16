// Minimal static server to open ARCADIA on a phone (VR mode).
// Usage: node herramientas/vr/servidor.js   →   http://localhost:8766
const http = require('http'), fs = require('fs'), path = require('path');
const raiz = path.resolve(__dirname, '..', '..'), puerto = +process.argv[2] || 8766;
const tipos = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.css': 'text/css' };
http.createServer((req, res) => {
  const ruta = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
  const p = path.join(raiz, ruta === '/' ? 'index.html' : ruta);
  if (!p.startsWith(raiz)) { res.writeHead(403); res.end(); return; }
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'Content-Type': tipos[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(d); });
}).listen(puerto, () => console.log('ARCADIA at http://localhost:' + puerto + '  (Ctrl+C to stop)'));
