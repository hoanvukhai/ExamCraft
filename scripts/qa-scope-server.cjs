const http = require('node:http');
const { build } = require('esbuild');
async function main() {
  const copilotBundle = await build({ entryPoints: ['qa/rebuild-2026-10-23/copilot-browser-entry.tsx'], bundle: true, platform: 'browser', format: 'iife', jsx: 'automatic', write: false, tsconfig: 'tsconfig.json', define: { 'process.env.NODE_ENV': '"production"' } });
  const bundle = await build({ entryPoints: ['qa/rebuild-2026-10-23/scope-browser-entry.tsx'], bundle: true, platform: 'browser', format: 'iife', jsx: 'automatic', write: false, tsconfig: 'tsconfig.json', define: { 'process.env.NODE_ENV': '"production"' } });
  const planBundle = await build({ entryPoints: ['qa/rebuild-2026-10-23/plan-browser-entry.tsx'], bundle: true, platform: 'browser', format: 'iife', jsx: 'automatic', write: false, tsconfig: 'tsconfig.json', define: { 'process.env.NODE_ENV': '"production"' } });
  const persistenceBundle = await build({ entryPoints: ['qa/rebuild-2026-10-23/persistence-browser-entry.tsx'], bundle: true, platform: 'browser', format: 'iife', jsx: 'automatic', write: false, tsconfig: 'tsconfig.json', define: { 'process.env.NODE_ENV': '"production"' } });
  const questionAiBundle = await build({ entryPoints: ['qa/rebuild-2026-10-23/question-ai-browser-entry.tsx'], bundle: true, platform: 'browser', format: 'iife', jsx: 'automatic', write: false, tsconfig: 'tsconfig.json', define: { 'process.env.NODE_ENV': '"production"' } });
  const server = http.createServer((req, res) => {
    if (req.headers.host !== '127.0.0.1:3122') { res.writeHead(403); return res.end(); }
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Security-Policy', "default-src 'self'; style-src 'unsafe-inline'; connect-src 'none'");
    if (req.url === '/copilot-bundle.js') { res.setHeader('Content-Type', 'application/javascript'); return res.end(copilotBundle.outputFiles[0].contents); }
    if (req.url === '/bundle.js') { res.setHeader('Content-Type', 'application/javascript'); return res.end(bundle.outputFiles[0].contents); }
    if (req.url === '/plan-bundle.js') { res.setHeader('Content-Type', 'application/javascript'); return res.end(planBundle.outputFiles[0].contents); }
    if (req.url === '/persistence-bundle.js') { res.setHeader('Content-Type', 'application/javascript'); return res.end(persistenceBundle.outputFiles[0].contents); }
    if (req.url === '/question-ai-bundle.js') { res.setHeader('Content-Type', 'application/javascript'); return res.end(questionAiBundle.outputFiles[0].contents); }
    if (!['/', '/plan', '/persistence', '/question-ai', '/copilot'].includes(req.url)) { res.writeHead(404); return res.end(); }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    const page = req.url === '/' ? 'scope' : req.url.slice(1);
    res.end(`<!doctype html><html lang="vi"><meta charset="utf-8"><title>ExamCraft QA ${page} component</title><style>body{font:16px system-ui;max-width:1000px;margin:24px auto;color:#182033}button,select,textarea,input{font:inherit;padding:6px;margin:4px}table,td,th{border:1px solid #ccd;border-collapse:collapse;padding:6px}pre{background:#f6f8fc;padding:12px}details{border:1px solid #ccd;padding:12px;margin:10px 0}textarea{display:block;width:85%}</style><div id="root"></div><script src="/${page === 'scope' ? 'bundle' : page + '-bundle'}.js"></script></html>`);
  });
  server.listen(3122, '127.0.0.1', () => console.log('Isolated mocked-scope component QA at http://127.0.0.1:3122; no DB/provider requests.'));
  process.on('SIGINT', () => server.close()); process.on('SIGTERM', () => server.close());
}
main().catch(() => { console.error('Scope QA harness failed'); process.exitCode = 1; });
