// Usage: node scripts/run-with-test-db.cjs scripts/make-test-accounts.ts
// Creates (or recreates) three throwaway accounts in the TEST database only: an administrator and two teachers.
// The teachers must change their password on first sign-in, as the test guide expects. Run it, then start the isolated server:
//   node scripts/test-server.cjs --production      (needs a finished `npm run build`; serves http://127.0.0.1:3117 on the test database)
import { randomBytes } from 'node:crypto';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { requireTestDatabase } from '../../tests/helpers/test-database';

const db = new PrismaClient({ datasources: { db: { url: requireTestDatabase() } }, log: [] });
const password = () => 'Tam' + randomBytes(6).toString('base64url') + '9a';

(async () => {
  const accounts = [
    { email: 'test-codex-admin-1026@examcraft.test', name: 'Quản trị thử', role: Role.SUPER_ADMIN, mustChangePassword: false },
    { email: 'test-codex-gv1-1026@examcraft.test', name: 'Giáo viên thử 1', role: Role.TEACHER, mustChangePassword: false },
    { email: 'test-codex-gv2-1026@examcraft.test', name: 'Giáo viên thử 2', role: Role.TEACHER, mustChangePassword: false },
  ];
  for (const account of accounts) {
    const plain = password();
    const data = { name: account.name, role: account.role, passwordHash: await bcrypt.hash(plain, 10), mustChangePassword: account.mustChangePassword, isActive: true, aiDailyLimit: 200 };
    await db.user.create({ data: { email: account.email, ...data } });
    console.log(`${account.email}  mật khẩu ${account.mustChangePassword ? 'tạm' : ''}: ${plain}`);
  }
  console.log('Chỉ có trong cơ sở dữ liệu thử. Mật khẩu chỉ hiện lần này; chạy lại lệnh để đặt mật khẩu mới.');
  await db.$disconnect();
})().catch(error => { console.error('failed:', String(error?.message ?? error).slice(0, 300)); process.exitCode = 1; });

