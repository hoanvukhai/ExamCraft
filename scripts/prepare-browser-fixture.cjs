const path = require('node:path');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { requireTestDatabase } = require('../tests/helpers/test-database.ts');
process.loadEnvFile(path.resolve('.env'));
const application = new URL(process.env.DATABASE_URL);
const target = new URL(application); target.pathname = '/examcraft_test_20261022';
const env = { ...process.env, TEST_DATABASE_URL: target.href, EXAMCRAFT_ALLOW_TEST_DB: '1' };
const prisma = new PrismaClient({ datasources: { db: { url: requireTestDatabase(env) } }, log: [] });
(async () => {
  try {
    const passwordHash = await bcrypt.hash('ExamCraft-local-fixture-2026', 10);
    for (const index of [1, 2]) await prisma.user.upsert({ where: { email: `qa_browser_${index}@example.invalid` },
      create: { email: `qa_browser_${index}@example.invalid`, name: `Giáo viên thử nghiệm ${index}`, passwordHash, role: 'TEACHER', mustChangePassword: false, isActive: true, aiDailyLimit: 0 },
      update: { passwordHash, mustChangePassword: false, isActive: true, aiDailyLimit: 0 } });
    console.log('Two fake browser teachers are ready in the isolated test database. No API keys were provisioned.');
  } finally { await prisma.$disconnect(); }
})().catch(() => { console.error('Could not prepare isolated browser fixtures.'); process.exitCode = 1; });
