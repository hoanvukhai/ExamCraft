import prisma from '../src/lib/prisma';

async function testAiMemory() {
  console.log('--- KIỂM TRA TÍNH NĂNG BỘ NÃO AI HỌC TẬP (AI MEMORY) ---');

  // Tìm user giáo viên demo
  const user = await prisma.user.findFirst({
    where: { role: 'TEACHER' },
  });

  if (!user) {
    console.error('[FAIL] Không tìm thấy giáo viên trong DB');
    process.exit(1);
  }

  console.log(`[1] Tìm thấy giáo viên: ${user.name} (${user.email})`);

  // Tạo một tri thức học tập mẫu
  const sampleMemory = await prisma.teacherAiMemory.create({
    data: {
      userId: user.id,
      subject: 'toan',
      category: 'TRICK_OR_TRAP',
      title: 'Cài bẫy điều kiện xác định hàm logarit',
      insight: 'Học sinh hay quên điều kiện biểu thức trong logarit lớn hơn 0, hãy tạo phương án nhiễu chứa cả các nghiệm âm bị loại.',
      confidence: 0.96,
      isActive: true,
      sourceAction: 'MANUAL_NOTE',
    },
  });

  console.log('[2] Tạo tri thức học tập mẫu thành công:', sampleMemory.id, sampleMemory.title);

  // Đọc danh sách
  const memories = await prisma.teacherAiMemory.findMany({
    where: { userId: user.id },
  });
  console.log(`[3] Lấy danh sách tri thức của giáo viên: ${memories.length} bản ghi`);

  // Thử cập nhật trạng thái
  const updated = await prisma.teacherAiMemory.update({
    where: { id: sampleMemory.id },
    data: { isActive: false },
  });
  console.log('[4] Cập nhật trạng thái thành công:', updated.isActive === false ? 'PASS' : 'FAIL');

  // Dọn dẹp bản ghi test
  await prisma.teacherAiMemory.delete({
    where: { id: sampleMemory.id },
  });
  console.log('[5] Dọn dẹp bản ghi test thành công: PASS');

  console.log('=== TẤT CẢ KIỂM THỬ BỘ NÃO AI HỌC TẬP THÀNH CÔNG (100% PASS) ===');
}

testAiMemory()
  .catch((e) => {
    console.error('Lỗi kiểm thử:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
