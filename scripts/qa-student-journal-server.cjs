const http = require('node:http');
const { build } = require('esbuild');
async function main() {
  const bundle = await build({ entryPoints: ['qa/rebuild-2026-10-24/student-journal-browser-entry.tsx'], bundle: true, platform: 'browser', format: 'iife', jsx: 'automatic', write: false, tsconfig: 'tsconfig.json', define: { 'process.env.NODE_ENV': '"production"' } });
  http.createServer((req, res) => {
    if (req.headers.host !== '127.0.0.1:3124') { res.writeHead(403); return res.end(); }
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Security-Policy', "default-src 'self'; style-src 'unsafe-inline'; connect-src 'none'");
    if (req.url === '/bundle.js') { res.setHeader('Content-Type', 'application/javascript'); return res.end(bundle.outputFiles[0].contents); }
    if (!/^\/(?:\?mode=(?:denied|corrupt|choice|expired|late|offline))?$/.test(req.url)) { res.writeHead(404); return res.end(); }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end('<!doctype html><html lang="vi"><meta charset="utf-8"><title>QA nhật ký học sinh</title><div id="root"></div><script src="/bundle.js"></script></html>');
  }).listen(3124, '127.0.0.1', () => console.log('Student component QA at http://127.0.0.1:3124; fake API, no DB/provider.'));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
