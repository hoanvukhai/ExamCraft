const http = require('node:http');
const crypto = require('node:crypto');
const { build } = require('esbuild');
async function main() {
  const owner = 'qa-writer-' + crypto.randomUUID();
  const bundle = await build({ entryPoints: ['qa/rebuild-2026-10-23/writer-browser-entry.ts'], bundle: true, platform: 'browser', format: 'iife', write: false, tsconfig: 'tsconfig.json' });
  const html = `<!doctype html><html lang="vi" data-qa-owner="${owner}"><meta charset="utf-8"><title>ExamCraft QA nháp nhiều tab</title><style>body{font:16px system-ui;max-width:1000px;margin:24px auto;background:#f6f8fc;color:#172033}button{padding:10px;margin:4px;font:inherit}pre{white-space:pre-wrap;background:white;padding:16px;border:1px solid #ccd}</style><h1>Kiểm nháp riêng từng tab</h1><p id="writer"></p><p>localStorage thật ở origin QA riêng. Không DB, không AI, không xóa dữ liệu.</p><button id="write">Ghi nháp của tab này</button><button id="save">Xác nhận đã lưu tab này</button><button id="retire">Kết thúc nháp tab này</button><button id="read">Đọc danh sách phục hồi</button><pre id="result">Chưa chạy.</pre><script src="/bundle.js"></script></html>`;
  const server = http.createServer((req, res) => {
    if (req.headers.host !== '127.0.0.1:3121') { res.writeHead(403); return res.end(); }
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Security-Policy', "default-src 'self'; style-src 'unsafe-inline'; connect-src 'none'");
    if (req.url === '/bundle.js') { res.setHeader('Content-Type', 'application/javascript'); return res.end(bundle.outputFiles[0].contents); }
    if (!/^\/\?writer=[ab]$/.test(req.url ?? '')) { res.writeHead(404); return res.end(); }
    res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(html);
  });
  server.listen(3121, '127.0.0.1', () => console.log('Two-tab writer QA: http://127.0.0.1:3121/?writer=a and ?writer=b; each server run has a unique QA-only owner.'));
  process.on('SIGINT', () => server.close()); process.on('SIGTERM', () => server.close());
}
main().catch(() => { console.error('Writer QA harness failed'); process.exitCode = 1; });
