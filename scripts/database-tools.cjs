const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const crypto = require('node:crypto');

const workspace = path.resolve(__dirname, '..');
function argumentsFor(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) throw new Error('Unexpected argument.');
    const key = argv[i].slice(2);
    args[key] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
  }
  return args;
}
function configuration(args) {
  const envPath = path.resolve(workspace, typeof args['env-file'] === 'string' ? args['env-file'] : '.env');
  if (fs.existsSync(envPath)) process.loadEnvFile(envPath);
  let url;
  try { url = new URL(process.env.DATABASE_URL || ''); } catch { throw new Error('DATABASE_URL is missing or invalid.'); }
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) throw new Error('Only the local PostgreSQL service is supported.');
  const database = decodeURIComponent(url.pathname.slice(1));
  const user = decodeURIComponent(url.username);
  if (!/^[A-Za-z0-9_]+$/.test(database) || !/^[A-Za-z0-9_]+$/.test(user)) throw new Error('Unsupported database or role identifier.');
  const container = typeof args.container === 'string' ? args.container : 'examcraft_postgres';
  if (!/^[A-Za-z0-9_.-]+$/.test(container)) throw new Error('Invalid Docker container name.');
  return { database, user, container, port: url.port || '5432', host: url.hostname };
}
function docker(args, options = {}) {
  const result = spawnSync('docker', args, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, ...options });
  if (result.error || result.status !== 0) throw new Error('Docker/PostgreSQL operation failed. No database credentials were printed. Check Docker availability and local database access.');
  return result.stdout;
}
function verifyContainer(config) {
  const info = JSON.parse(docker(['inspect', '--format', '{{json .NetworkSettings.Ports}}', config.container]));
  const bindings = info['5432/tcp'];
  if (!Array.isArray(bindings) || !bindings.some(binding => binding.HostPort === config.port)) throw new Error('Docker published port does not match DATABASE_URL.');
  const running = docker(['inspect', '--format', '{{.State.Running}}', config.container]).trim();
  if (running !== 'true') throw new Error('Database container is not running.');
}
function pg(config, executable, args, options) {
  return docker(['exec', '-i', config.container, executable, '-U', config.user, ...args], options);
}
function sql(config, database, statement) {
  return pg(config, 'psql', ['--no-psqlrc', '--set', 'ON_ERROR_STOP=1', '--tuples-only', '--no-align', '--dbname', database, '--command', statement]).trim();
}
function hashFile(file) { return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'); }
function withinWorkspace(file) {
  const absolute = path.resolve(file);
  const relative = path.relative(workspace, absolute);
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Output must stay within the project workspace.');
  return absolute;
}
module.exports = { fs, path, workspace, argumentsFor, configuration, verifyContainer, pg, sql, hashFile, withinWorkspace };
