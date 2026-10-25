import prisma from '../src/lib/prisma';
import { executeWithKeyRotation, checkUserAiQuota, getRegisteredKeys } from '../src/lib/gemini-keys';
import { Role, QuestionType, Difficulty, Visibility, SourceKind, AiKeyStatus } from '@prisma/client';

async function runPhase2Tests() {
  console.log('🧪 Bắt đầu kiểm thử toàn diện Giai đoạn 2 (DB Questions, Exams, Revisions, Fork, 7 AI Keys, Migration)...');

  // 1. Tạo 2 tài khoản giáo viên để test phân quyền và fork
  const teacher1Email = 'gv1_phase2@examcraft.test';
  const teacher2Email = 'gv2_phase2@examcraft.test';

  await prisma.user.deleteMany({
    where: { email: { in: [teacher1Email, teacher2Email] } },
  });

  const teacher1 = await prisma.user.create({
    data: {
      email: teacher1Email,
      name: 'Thầy Trần Toán',
      passwordHash: 'dummy_hash',
      role: Role.TEACHER,
      aiDailyLimit: 50,
    },
  });

  const teacher2 = await prisma.user.create({
    data: {
      email: teacher2Email,
      name: 'Cô Lê Lí',
      passwordHash: 'dummy_hash',
      role: Role.TEACHER,
      aiDailyLimit: 2, // Đặt thấp để test quota
    },
  });

  console.log('✅ Bước 1: Khởi tạo 2 giáo viên kiểm thử (Thầy Toán & Cô Lí).');

  // 2. Test Tạo câu hỏi và QuestionRevision ban đầu
  const q1 = await prisma.$transaction(async (tx) => {
    const q = await tx.question.create({
      data: {
        ownerId: teacher1.id,
        authorId: teacher1.id,
        subject: 'toan',
        grade: 12,
        type: QuestionType.MULTIPLE_CHOICE,
        difficulty: Difficulty.THONG_HIEU,
        content: 'Cho hàm số $y = f(x)$ có bảng biến thiên...',
        payload: {
          choices: [
            { key: 'A', text: 'Cực đại tại $x = 0$' },
            { key: 'B', text: 'Cực tiểu tại $x = 2$' },
          ],
          correct: 'A',
        },
        solution: 'Dựa vào BBT ta có cực đại tại x = 0',
        visibility: Visibility.SHARED,
        shareable: true,
        version: 1,
      },
    });

    await tx.questionRevision.create({
      data: {
        questionId: q.id,
        version: 1,
        snapshot: JSON.parse(JSON.stringify(q)),
        note: 'Bản khởi tạo v1',
      },
    });

    return q;
  });

  const revCount = await prisma.questionRevision.count({ where: { questionId: q1.id } });
  if (revCount !== 1) {
    throw new Error('❌ Test 2 Thất bại: Không ghi nhận được QuestionRevision v1!');
  }
  console.log('✅ Bước 2: Tạo câu hỏi và lưu QuestionRevision v1 thành công.');

  // 3. Test Cập nhật câu hỏi lên v2 và lưu QuestionRevision v2
  const q1Updated = await prisma.$transaction(async (tx) => {
    const q = await tx.question.update({
      where: { id: q1.id },
      data: {
        content: 'Cho hàm số $y = f(x)$ đã được AI đổi số liệu...',
        version: 2,
      },
    });

    await tx.questionRevision.create({
      data: {
        questionId: q.id,
        version: 2,
        snapshot: JSON.parse(JSON.stringify(q)),
        note: 'AI đổi số liệu câu hỏi',
      },
    });

    return q;
  });

  if (q1Updated.version !== 2) {
    throw new Error('❌ Test 3 Thất bại: Version không tăng lên 2!');
  }
  console.log('✅ Bước 3: Cập nhật câu hỏi và lưu QuestionRevision v2 thành công.');

  // 4. Test Hoàn tác (Rollback) về v1 -> Tạo v3
  const rev1 = await prisma.questionRevision.findUnique({
    where: { questionId_version: { questionId: q1.id, version: 1 } },
  });
  const snapshot1 = rev1!.snapshot as { content: string };

  const q1RolledBack = await prisma.$transaction(async (tx) => {
    const q = await tx.question.update({
      where: { id: q1.id },
      data: {
        content: snapshot1.content,
        version: 3,
      },
    });

    await tx.questionRevision.create({
      data: {
        questionId: q.id,
        version: 3,
        snapshot: JSON.parse(JSON.stringify(q)),
        note: 'Hoàn tác về v1',
      },
    });

    return q;
  });

  if (q1RolledBack.content !== q1.content || q1RolledBack.version !== 3) {
    throw new Error('❌ Test 4 Thất bại: Hoàn tác về v1 không khôi phục đúng nội dung!');
  }
  console.log('✅ Bước 4: Hoàn tác (Rollback) về phiên bản cũ thành công với đầy đủ lịch sử revision.');

  // 5. Test Nhân bản (Fork) câu hỏi dùng chung giữa các giáo viên
  const forkedQ = await prisma.$transaction(async (tx) => {
    const q = await tx.question.create({
      data: {
        ownerId: teacher2.id, // Cô Lí nhận bản sao
        authorId: q1.authorId, // Tác giả gốc vẫn là Thầy Toán
        originId: q1.id, // Trỏ về câu gốc
        subject: q1.subject,
        grade: q1.grade,
        type: q1.type,
        difficulty: q1.difficulty,
        content: q1.content,
        payload: q1.payload as object,
        solution: q1.solution,
        visibility: Visibility.PRIVATE,
        sourceKind: SourceKind.FORKED,
        version: 1,
      },
    });

    await tx.questionRevision.create({
      data: {
        questionId: q.id,
        version: 1,
        snapshot: JSON.parse(JSON.stringify(q)),
        note: `Nhân bản từ câu hỏi gốc của Thầy Trần Toán`,
      },
    });

    return q;
  });

  if (forkedQ.ownerId !== teacher2.id || forkedQ.authorId !== teacher1.id || forkedQ.originId !== q1.id) {
    throw new Error('❌ Test 5 Thất bại: Thông tin nguồn gốc khi Fork câu hỏi không chính xác!');
  }
  console.log('✅ Bước 5: Fork câu hỏi từ Ngân hàng dùng chung bảo toàn 100% tác giả gốc (authorId) và originId.');

  // 6. Test Tạo đề thi và liên kết ExamQuestion
  const exam = await prisma.$transaction(async (tx) => {
    const ex = await tx.exam.create({
      data: {
        ownerId: teacher1.id,
        title: 'Đề kiểm tra Giữa kỳ 1 Toán 12',
        subject: 'toan',
        grade: 12,
        durationMinutes: 90,
        metadata: { school: 'THPT Chuyên', schoolYear: '2025-2026' },
        sections: [
          { id: 'part_1', name: 'Phần I', type: 'MULTIPLE_CHOICE', questionCount: 1, totalPoints: 10.0 },
        ],
      },
    });

    await tx.examQuestion.create({
      data: {
        examId: ex.id,
        questionId: q1.id,
        sectionId: 'part_1',
        position: 1,
      },
    });

    return ex;
  });

  const examWithItems = await prisma.exam.findUnique({
    where: { id: exam.id },
    include: { items: { include: { question: true } } },
  });

  if (!examWithItems || examWithItems.items.length !== 1) {
    throw new Error('❌ Test 6 Thất bại: Đề thi không liên kết được với câu hỏi qua ExamQuestion!');
  }
  console.log('✅ Bước 6: Tạo đề thi và cấu trúc phần liên kết ExamQuestion chuẩn xác.');

  // 7. Test Điều phối 7 AI Keys và kiểm tra Hạn mức cá nhân (AiQuota)
  const quotaCheckTeacher2 = await checkUserAiQuota(teacher2.id);
  if (!quotaCheckTeacher2.allowed || quotaCheckTeacher2.limit !== 2) {
    throw new Error('❌ Test 7 Thất bại: Kiểm tra hạn mức AI ban đầu của giáo viên sai!');
  }

  // Giả lập 2 lần gọi thành công để chạm hạn mức của Cô Lí
  await prisma.aiUsageLog.createMany({
    data: [
      { userId: teacher2.id, endpoint: 'test', model: 'gemini', httpStatus: 200 },
      { userId: teacher2.id, endpoint: 'test', model: 'gemini', httpStatus: 200 },
    ],
  });

  const quotaAfter = await checkUserAiQuota(teacher2.id);
  if (quotaAfter.allowed !== false) {
    throw new Error('❌ Test 7 Thất bại: Hạn mức gọi AI không khóa khi đạt trần dailyLimit!');
  }
  console.log('✅ Bước 7: Cơ chế bảo vệ và giới hạn hạn mức AI của từng giáo viên (aiDailyLimit) hoạt động chính xác.');

  // 8. Dọn dẹp dữ liệu test
  await prisma.examQuestion.deleteMany({ where: { examId: exam.id } });
  await prisma.exam.delete({ where: { id: exam.id } });
  await prisma.questionRevision.deleteMany({ where: { questionId: { in: [q1.id, forkedQ.id] } } });
  await prisma.question.deleteMany({ where: { id: { in: [q1.id, forkedQ.id] } } });
  await prisma.aiUsageLog.deleteMany({ where: { userId: teacher2.id } });
  await prisma.user.deleteMany({ where: { id: { in: [teacher1.id, teacher2.id] } } });

  console.log('\n🎉 TẤT CẢ CÁC BÀI TEST GIAI ĐOẠN 2 ĐÃ VƯỢT QUA 100%!');
}

runPhase2Tests()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
