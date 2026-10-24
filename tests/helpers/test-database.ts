/** Validate test targets without connecting, printing credentials, or loading .env. */
export function requireTestDatabase(env: Record<string, string | undefined> = process.env): string {
  if (env.EXAMCRAFT_ALLOW_TEST_DB !== '1') throw new Error('DB tests require EXAMCRAFT_ALLOW_TEST_DB=1 and an isolated TEST_DATABASE_URL.');
  const raw = env.TEST_DATABASE_URL;
  if (!raw) throw new Error('Missing TEST_DATABASE_URL; the application database is never a fallback.');
  let target: URL;
  try { target = new URL(raw); } catch { throw new Error('Invalid TEST_DATABASE_URL.'); }
  const localHosts = ['localhost', '127.0.0.1', '[::1]'];
  if (!['postgres:', 'postgresql:'].includes(target.protocol) || !localHosts.includes(target.hostname)) throw new Error('DB tests require a local PostgreSQL target.');
  if (!/^examcraft_(test|qa)(_[a-z0-9_]+)?$/i.test(target.pathname.slice(1))) throw new Error('Test database name must start with examcraft_test or examcraft_qa.');
  if (env.DATABASE_URL) {
    let app: URL;
    try { app = new URL(env.DATABASE_URL); } catch { throw new Error('Invalid application database configuration; isolation cannot be verified.'); }
    // Credentials, schema, and localhost aliases do not isolate a database.
    const sameHost = localHosts.includes(app.hostname) || app.hostname === target.hostname;
    if (sameHost && (app.port || '5432') === (target.port || '5432') && app.pathname === target.pathname) throw new Error('Test target matches the application database.');
  }
  return raw;
}
