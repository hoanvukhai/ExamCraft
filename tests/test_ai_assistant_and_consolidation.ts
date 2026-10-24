import prisma from '../src/lib/prisma';
import { getTeacherAiProfilePrompt, upsertTeacherAiMemory } from '../src/lib/teacher-profile';

async function testAssistantAndConsolidation() {
  console.log('--- KIỂM TRA TÍNH NĂNG CONSOLIDATION & HỒ SƠ CHÂN DUNG NGƯỜI DÙNG ---');

  const user = await prisma.user.findFirst({
    where: { role: 'TEACHER' },
  });

  if (!user) {
    console.error('[FAIL] Không tìm thấy giáo viên');
    process.exit(1);
  }

  console.log(`[1] Giáo viên kiểm thử: ${user.name}`);

  // Test 1: Upsert tri thức mới
  const m1 = await upsertTeacherAiMemory(user.id, {
    category: 'PEDAGOGICAL_STYLE',
    title: 'Giải thích bản chất nghiệm hình học',
    insight: 'Luôn kèm hình ảnh hoặc diễn giải ý nghĩa hình học của đạo hàm và tích phân.',
    confidence: 0.9,
  });
  console.log('[2] Tạo tri thức 1 thành công:', m1.id, m1.title);

  // Test 2: Thử hợp nhất (Upsert lại cùng tiêu đề để kiểm tra chống phình to dữ liệu)
  const m1Updated = await upsertTeacherAiMemory(user.id, {
    category: 'PEDAGOGICAL_STYLE',
    title: 'Giải thích bản chất nghiệm hình học',
    insight: 'Cập nhật: Luôn kèm hình ảnh minh họa tọa độ Oxy khi giải tích phân.',
    confidence: 0.95,
  });

  if (m1Updated.id === m1.id && m1Updated.insight.includes('Cập nhật')) {
    console.log('[3] Hợp nhất (Consolidation) thành công: Không tạo bản ghi rác mới! (PASS)');
  } else {
    console.error('[FAIL] Hợp nhất thất bại');
    process.exit(1);
  }

  // Test 3: Trích xuất Prompt với giới hạn Top-K an toàn
  const profilePrompt = await getTeacherAiProfilePrompt(user.id, 'toan');
  console.log(`[4] Trích xuất Prompt thành công: ${profilePrompt.activeMemoryCount} tri thức hoạt động`);
  console.log('    Nội dung Prompt trích xuất:\n' + profilePrompt.instructionPrompt.trim());

  // Dọn dẹp bản ghi test
  await prisma.teacherAiMemory.delete({
    where: { id: m1.id },
  });
  console.log('[5] Dọn dẹp test hoàn tất: PASS');

  console.log('=== KIỂM THỬ THÀNH CÔNG 100% ===');
}

testAssistantAndConsolidation()
  .catch((e) => {
    console.error('Lỗi:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
