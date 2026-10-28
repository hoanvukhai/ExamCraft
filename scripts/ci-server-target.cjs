/* eslint-disable @typescript-eslint/no-require-imports -- Shared CommonJS CLI configuration. */
function ciServerTarget(env = process.env) {
  const raw = env.EXAMCRAFT_TEST_ORIGIN || `http://127.0.0.1:${env.EXAMCRAFT_TEST_PORT || '3117'}`;
  let url;
  try { url = new URL(raw); } catch { throw Error('Invalid local CI server address.'); }
  if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1' || url.username || url.password ||
      url.pathname !== '/' || url.search || url.hash) throw Error('CI requires a local HTTP server without credentials or a path.');
  const port = Number(url.port || '80');
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw Error('Invalid CI test port.');
  if (env.EXAMCRAFT_TEST_PORT && Number(env.EXAMCRAFT_TEST_PORT) !== port) throw Error('CI server address and port disagree.');
  return { origin: url.origin, port: String(port) };
}
module.exports = { ciServerTarget };
