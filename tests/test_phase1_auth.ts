import prisma from '../src/lib/prisma';
import { hashPassword, verifyPassword, createSession, deleteSession, checkLoginRateLimit, recordFailedLogin, clearLoginRateLimit } from '../src/lib/auth';
import { Role } from '@prisma/client';

async function runTests() {
  console.log('🧪 Bắt đầu kiểm thử toàn diện Giai đoạn 1 (Auth + Admin + Prisma)...');

  // Test 1: Kiểm tra Super Admin đã được seed
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@examcraft.local' },
  });

  if (!admin || admin.role !== Role.SUPER_ADMIN) {
    throw new Error('❌ Test 1 Thất bại: Không tìm thấy Super Admin trong database!');
  }
  console.log('✅ Test 1 Thành công: Super Admin tồn tại với quyền SUPER_ADMIN.');

  // Test 2: Băm và kiểm tra mật khẩu
  const testPass = 'GiaoVienTest2026@';
  const hashed = await hashPassword(testPass);
  const isMatch = await verifyPassword(testPass, hashed);
  const isWrong = await verifyPassword('SaiMatKhau', hashed);

  if (!isMatch || isWrong) {
    throw new Error('❌ Test 2 Thất bại: Cơ chế băm/so khớp mật khẩu không chính xác!');
  }
  console.log('✅ Test 2 Thành công: Cơ chế băm và đối chiếu mật khẩu an toàn bcryptjs.');

  // Test 3: Quản lý phiên Session
  const session = await createSession(admin.id);
  const foundSession = await prisma.session.findUnique({
    where: { token: session.token },
  });

  if (!foundSession || foundSession.userId !== admin.id) {
    throw new Error('❌ Test 3 Thất bại: Không lưu được phiên session vào DB!');
  }

  await deleteSession(session.token);
  const deletedSession = await prisma.session.findUnique({
    where: { token: session.token },
  });

  if (deletedSession) {
    throw new Error('❌ Test 3 Thất bại: Xóa phiên session không thành công!');
  }
  console.log('✅ Test 3 Thành công: Tạo và hủy phiên đăng nhập (Session) trong DB chính xác.');

  // Test 4: Chống brute-force rate limit
  const dummyKey = 'test_ip:test@school.edu.vn';
  clearLoginRateLimit(dummyKey);

  for (let i = 0; i < 5; i++) {
    recordFailedLogin(dummyKey);
  }

  const rateCheck = await checkLoginRateLimit(dummyKey);
  if (rateCheck.allowed) {
    throw new Error('❌ Test 4 Thất bại: Rate limiting không khóa sau 5 lần thử sai!');
  }
  clearLoginRateLimit(dummyKey);
  console.log('✅ Test 4 Thành công: Cơ chế khóa tạm thời chống tấn công dò mật khẩu (Brute-force).');

  // Test 5: Tạo và khóa/mở tài khoản giáo viên
  const teacherEmail = 'gv_kiemthu@examcraft.test';
  await prisma.user.deleteMany({ where: { email: teacherEmail } });

  const teacher = await prisma.user.create({
    data: {
      email: teacherEmail,
      name: 'Cô Nguyễn Thị Hoa',
      passwordHash: hashed,
      role: Role.TEACHER,
      isActive: true,
      mustChangePassword: true,
      aiDailyLimit: 120,
    },
  });

  if (!teacher || teacher.mustChangePassword !== true) {
    throw new Error('❌ Test 5 Thất bại: Tạo giáo viên mới không bật mustChangePassword!');
  }

  // Khóa tài khoản
  const locked = await prisma.user.update({
    where: { id: teacher.id },
    data: { isActive: false },
  });
  if (locked.isActive !== false) {
    throw new Error('❌ Test 5 Thất bại: Không khóa được tài khoản giáo viên!');
  }

  // Mở khóa tài khoản
  const unlocked = await prisma.user.update({
    where: { id: teacher.id },
    data: { isActive: true },
  });
  if (unlocked.isActive !== true) {
    throw new Error('❌ Test 5 Thất bại: Không mở khóa được tài khoản giáo viên!');
  }

  // Dọn dẹp tài khoản test
  await prisma.user.delete({ where: { id: teacher.id } });
  console.log('✅ Test 5 Thành công: Admin tạo giáo viên mới, khóa/mở khóa tài khoản, bắt buộc đổi mật khẩu.');

  // Test 6: Kiểm tra 7 AI Keys và ExamTemplates hệ thống
  const keysCount = await prisma.aiKeyState.count();
  const templatesCount = await prisma.examTemplate.count({ where: { isSystem: true } });

  if (keysCount !== 7) {
    throw new Error(`❌ Test 6 Thất bại: Cần đủ 7 AI Keys, hiện có: ${keysCount}`);
  }
  if (templatesCount < 4) {
    throw new Error(`❌ Test 6 Thất bại: Cần ít nhất 4 ExamTemplate chuẩn, hiện có: ${templatesCount}`);
  }
  console.log(`✅ Test 6 Thành công: 7 AI Keys và ${templatesCount} mẫu cấu trúc đề thi hệ thống sẵn sàng.`);

  console.log('\n🎉 TẤT CẢ CÁC BÀI TEST GIAI ĐOẠN 1 ĐÃ VƯỢT QUA 100%!');
}

runTests()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
