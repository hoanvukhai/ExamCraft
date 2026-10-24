// A separate localhost origin; the harness refuses unknown IndexedDB/localStorage data.
const http = require('node:http');
const { build } = require('esbuild');
async function main() {
  const bundle = await build({ entryPoints: ['qa/rebuild-2026-10-23/indexeddb-browser-entry.ts'], bundle: true, platform: 'browser', format: 'iife', write: false, tsconfig: 'tsconfig.json' });
  const html = '<!doctype html><html lang="vi"><meta charset="utf-8"><title>ExamCraft QA IndexedDB</title><style>body{font:16px system-ui;max-width:1000px;margin:32px auto;background:#f6f8fc;color:#172033}button{padding:12px 20px;font:inherit}pre{white-space:pre-wrap;background:white;padding:20px;border:1px solid #ccd;border-radius:10px}</style><h1>ExamCraft — Kiểm IndexedDB thật</h1><p>Chỉ origin QA 127.0.0.1:3121. Dữ liệu giả; không gọi PostgreSQL hay AI.</p><button id="run">Chạy kiểm giao dịch IndexedDB</button><pre id="result">Chưa chạy.</pre><script src="/bundle.js"></script></html>';
  const server = http.createServer((req, res) => {
    if (req.headers.host !== '127.0.0.1:3121') { res.writeHead(403); return res.end(); }
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Security-Policy', "default-src 'self'; style-src 'unsafe-inline'; connect-src 'none'");
    if (req.url === '/bundle.js') { res.setHeader('Content-Type', 'application/javascript'); return res.end(bundle.outputFiles[0].contents); }
    if (req.url !== '/') { res.writeHead(404); return res.end(); }
    res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(html);
  });
  server.listen(3121, '127.0.0.1', () => console.log('IndexedDB-only QA harness http://127.0.0.1:3121 — no production app route added.'));
  process.on('SIGINT', () => server.close()); process.on('SIGTERM', () => server.close());
}
main().catch(() => { console.error('Could not start IndexedDB QA harness'); process.exitCode = 1; });
