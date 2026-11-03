/* Manual user preview. This script makes no provider call. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { requireTestDatabase } = require('../../../tests/helpers/test-database.ts');
let stage = 'configuration';
async function main() {
  if (process.argv[3] !== '--user-preview') throw Error('Manual preview flag required.');
  process.loadEnvFile(process.argv[2]);
  if (!process.env.SESSION_SECRET)
    throw Error('Existing stable SESSION_SECRET required; no secret was generated.');
  const application = new URL(process.env.DATABASE_URL);
  const target = new URL(application);
  target.pathname = '/examcraft_test_20261022';
  const env = {
    ...process.env,
    TEST_DATABASE_URL: target.href,
    EXAMCRAFT_ALLOW_TEST_DB: '1',
    EXAMCRAFT_ISOLATED_TEST_SERVER: '0',
    EXAMCRAFT_REAL_AI: '1',
  };
  stage = 'URL isolation';
  requireTestDatabase(env);
  if (target.port !== '5436') throw Error('Wrong test port.');
  env.DATABASE_URL = target.href;
  for (const key of Object.keys(env))
    if (/^(GEMINI_API_KEY|GOOGLE_API_KEY|OPENAI_API_KEY)/.test(key)) delete env[key];
  delete env.GOOGLE_GEMINI_BASE_URL;
  stage = 'port check';
  try {
    await fetch('http://127.0.0.1:3123/api/health', { signal: AbortSignal.timeout(1000) });
    throw Error('Port busy; no existing process was stopped.');
  } catch (error) {
    if (error.message?.includes('Port busy')) throw error;
  }
  const db = new PrismaClient({ datasources: { db: { url: target.href } }, log: [] });
  const file = path.join(__dirname, 'manual-preview-identities.json');
  let old = [];
  try {
    old = JSON.parse(fs.readFileSync(file, 'utf8')).accounts ?? [];
  } catch {
    /* First manual run. */
  }
  const accounts = [],
    credentials = [];
  try {
    stage = 'SQL isolation';
    const rows = await db.$queryRawUnsafe('SELECT current_database()');
    if (rows[0].current_database !== 'examcraft_test_20261022')
      throw Error('Wrong connected database.');
    await db.$transaction(async (tx) => {
      for (const [role, label, stem] of [
        ['TEACHER', 'Giáo viên thử chat V2', 'teacher.chatv2'],
        ['SUPER_ADMIN', 'Quản trị thử chat V2', 'admin.chatv2'],
      ]) {
        const prior = old.find(
          (row) =>
            row.role === role && typeof row.id === 'string' && row.id.startsWith('manual_chat_v2_'),
        );
        const existing = prior ? await tx.user.findUnique({ where: { id: prior.id } }) : null;
        if (existing) {
          accounts.push({ id: existing.id, email: existing.email, role: existing.role });
          console.log(role + ': ' + existing.email + ' (giữ mật khẩu đã cấp; không đặt lại)');
          continue;
        }
        let email = stem + '@examcraft.test';
        if (await tx.user.findUnique({ where: { email } }))
          email = stem + '.' + crypto.randomUUID().slice(0, 8) + '@examcraft.test';
        const password = crypto.randomBytes(9).toString('base64url');
        stage = 'create ' + role;
        const user = await tx.user.create({
          data: {
            id: 'manual_chat_v2_' + crypto.randomUUID(),
            email,
            name: label,
            role,
            passwordHash: await bcrypt.hash(password, 10),
            isActive: true,
            mustChangePassword: false,
          },
        });
        accounts.push({ id: user.id, email: user.email, role: user.role });
        credentials.push({ role, email, password });
      }
    });
    stage = 'save manual identities';
    fs.writeFileSync(
      file,
      JSON.stringify(
        {
          database: 'examcraft_test_20261022',
          purpose: 'Manual preview: preserve until user finishes. No passwords or keys.',
          accounts,
        },
        null,
        2,
      ),
    );
  } finally {
    await db.$disconnect();
  }
  for (const account of credentials)
    console.log(
      'Tài khoản thử ' + account.role + ': ' + account.email + ' | Mật khẩu: ' + account.password,
    );
  console.log(
    'USER PREVIEW http://127.0.0.1:3123 ; test DB only; isolatedTest=false blocks automated tests. Stable encryption secret retained. No automatic AI calls.',
  );
  const log = fs.createWriteStream(path.join(__dirname, 'manual-preview.log'));
  const child = spawn(
    process.execPath,
    ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '3123'],
    { env, stdio: ['ignore', 'pipe', 'pipe'] },
  );
  for (const stream of [child.stdout, child.stderr])
    stream.on('data', (bytes) => {
      let text = String(bytes);
      for (const secret of [
        application.href,
        target.href,
        decodeURIComponent(target.password),
        env.SESSION_SECRET,
      ])
        if (secret) text = text.split(secret).join('[redacted]');
      log.write(text);
    });
  child.on('exit', (code) => {
    log.end();
    process.exitCode = code ?? 1;
  });
  process.on('SIGINT', () => child.kill('SIGINT'));
  process.on('SIGTERM', () => child.kill('SIGTERM'));
}
main().catch((error) => {
  console.error(
    'Manual preview failed at ' +
      stage +
      ' (' +
      error.name +
      (error.code ? ' ' + error.code : '') +
      '). No main database was modified.',
  );
  for (const line of String(error.message).split('\n'))
    if (
      /Unknown argument|Argument .* is missing|Invalid value for argument|Test target matches/.test(
        line,
      )
    )
      console.error(line.slice(0, 200));
  process.exitCode = 1;
});
