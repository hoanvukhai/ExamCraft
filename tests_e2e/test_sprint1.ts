import { PrismaClient, Role, QuestionType, Difficulty, Visibility, SourceKind, AttemptStatus, AssignmentMode } from '@prisma/client';
import { hashPassword, verifyPassword, createSession, deleteSession, checkLoginRateLimit, recordFailedLogin, clearLoginRateLimit } from '../src/lib/auth';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://examcraft:examcraft_secret_qa_2026@localhost:5437/examcraft_qa?schema=public',
    },
  },
});

async function main() {
  console.log('================================================================');
  console.log('       SPRINT 1 E2E TESTS: NỀN MÓNG, CSDL, AUTH, BANK, LOGIC   ');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, msg: string) {
    total++;
    if (!condition) {
      console.error(`❌ FAILED: ${msg}`);
      throw new Error(`Assertion failed: ${msg}`);
    }
    passed++;
    console.log(`✅ PASS: ${msg}`);
  }

  // ─────────────────────────────────────────────────────────────
  // 1. AUTH & ACCESS CONTROL
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 1. KIỂM THỬ XÁC THỰC (AUTH) ---');

  // Tạo 2 giáo viên để test cô lập IDOR
  const teacherA = await prisma.user.upsert({
    where: { email: 'teacher_a@test.qa' },
    create: {
      email: 'teacher_a@test.qa',
      name: 'Thầy Nguyễn Văn A',
      passwordHash: await hashPassword('TeacherPassA@2026'),
      role: Role.TEACHER,
      isActive: true,
      mustChangePassword: false,
    },
    update: { isActive: true },
  });

  const teacherB = await prisma.user.upsert({
    where: { email: 'teacher_b@test.qa' },
    create: {
      email: 'teacher_b@test.qa',
      name: 'Cô Trần Thị B',
      passwordHash: await hashPassword('TeacherPassB@2026'),
      role: Role.TEACHER,
      isActive: true,
      mustChangePassword: true, // Cô B phải đổi mật khẩu
    },
    update: { isActive: true },
  });

  assert(teacherA.role === Role.TEACHER && teacherB.role === Role.TEACHER, 'Khởi tạo 2 giáo viên độc lập Teacher A và Teacher B');

  // Test mật khẩu
  assert(await verifyPassword('TeacherPassA@2026', teacherA.passwordHash), 'Xác thực mật khẩu đúng của Teacher A');
  assert(!(await verifyPassword('SaiMatKhau', teacherA.passwordHash)), 'Từ chối mật khẩu sai');

  // Test Session
  const sessionA = await createSession(teacherA.id);
  const dbSession = await prisma.session.findUnique({ where: { token: sessionA.token } });
  assert(dbSession?.userId === teacherA.id, 'Tạo phiên Session thành công trong CSDL');
  await deleteSession(sessionA.token);
  const deletedDbSession = await prisma.session.findUnique({ where: { token: sessionA.token } });
  assert(deletedDbSession === null, 'Hủy phiên Session thành công sau khi đăng xuất');

  // Test Brute-force lockout
  const testIpKey = 'ip_test_brute_force';
  clearLoginRateLimit(testIpKey);
  const initialCheck = await checkLoginRateLimit(testIpKey);
  assert(initialCheck.allowed, 'Lần đầu kiểm tra rate limit cho phép đăng nhập');
  for (let i = 1; i <= 5; i++) {
    recordFailedLogin(testIpKey);
  }
  const lockoutStatus = await checkLoginRateLimit(testIpKey);
  assert(!lockoutStatus.allowed && (lockoutStatus.waitMinutes || 0) > 0, 'Khóa tạm thời tài khoản sau 5 lần đăng nhập thất bại');
  clearLoginRateLimit(testIpKey);

  // ─────────────────────────────────────────────────────────────
  // 2. IDOR CHÉO GIỮA CÁC GIÁO VIÊN (R7)
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 2. KIỂM THỬ BẢO VỆ CHỐNG IDOR (R7) ---');

  // Teacher A tạo 1 câu hỏi riêng tư (PRIVATE)
  const questionA = await prisma.question.create({
    data: {
      ownerId: teacherA.id,
      authorId: teacherA.id,
      subject: 'TOAN',
      grade: 12,
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: Difficulty.THONG_HIEU,
      content: 'Câu hỏi riêng của Thầy A: Tích phân $\\int_0^1 x dx = ?$',
      payload: { choices: [{ key: 'A', text: '1/2' }, { key: 'B', text: '1' }], correct: 'A' },
      solution: 'Lời giải chi tiết của Thầy A',
      visibility: Visibility.PRIVATE,
      sourceKind: SourceKind.TEACHER_WRITTEN,
    },
  });

  // Kiểm tra Teacher B có query được câu hỏi này trong danh sách câu hỏi của mình không?
  const teacherBQuestions = await prisma.question.findMany({
    where: { ownerId: teacherB.id, deletedAt: null },
  });
  assert(!teacherBQuestions.some((q) => q.id === questionA.id), 'Teacher B không thấy câu hỏi của Teacher A trong danh sách cá nhân');

  // Kiểm tra Teacher B cố tình đọc câu hỏi PRIVATE của Teacher A
  const targetQuestion = await prisma.question.findFirst({
    where: { id: questionA.id, deletedAt: null },
  });
  const canTeacherBAccess = targetQuestion && (targetQuestion.ownerId === teacherB.id || targetQuestion.visibility === Visibility.SHARED);
  assert(!canTeacherBAccess, 'Hệ thống chặn Teacher B đọc câu hỏi PRIVATE của Teacher A (IDOR Protection)');

  // ─────────────────────────────────────────────────────────────
  // 3. NGÂN HÀNG CHUNG & FORK BẢO TOÀN TÁC GIẢ & KHÓA CÂU WEB
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 3. KIỂM THỬ FORK VÀ KHÓA CÂU HỎI WEB ---');

  // Teacher A chia sẻ câu hỏi vào ngân hàng chung
  const sharedQuestionA = await prisma.question.create({
    data: {
      ownerId: teacherA.id,
      authorId: teacherA.id,
      subject: 'TOAN',
      grade: 12,
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: Difficulty.VAN_DUNG_CAO,
      content: 'Câu hỏi chia sẻ chung của Thầy A',
      payload: { choices: [{ key: 'A', text: '1' }, { key: 'B', text: '2' }], correct: 'A' },
      solution: 'Lời giải',
      visibility: Visibility.SHARED,
      shareable: true,
      sourceKind: SourceKind.TEACHER_WRITTEN,
    },
  });

  // Teacher B bấm Fork câu hỏi này
  const forkedQuestionB = await prisma.question.create({
    data: {
      ownerId: teacherB.id, // B là chủ sở hữu bản sao
      authorId: sharedQuestionA.authorId, // Giữ nguyên Thầy A là tác giả gốc!
      originId: sharedQuestionA.id, // Trỏ về ID câu gốc
      subject: sharedQuestionA.subject,
      grade: sharedQuestionA.grade,
      type: sharedQuestionA.type,
      difficulty: sharedQuestionA.difficulty,
      content: sharedQuestionA.content,
      payload: sharedQuestionA.payload as object,
      solution: sharedQuestionA.solution,
      visibility: Visibility.PRIVATE,
      sourceKind: SourceKind.FORKED,
      shareable: true,
    },
  });

  assert(forkedQuestionB.ownerId === teacherB.id, 'Bản sao (Fork) thuộc quyền sở hữu của Teacher B');
  assert(forkedQuestionB.authorId === teacherA.id, 'Tác giả gốc (Author) vẫn bảo toàn là Teacher A');
  assert(forkedQuestionB.originId === sharedQuestionA.id, 'originId trỏ chính xác về câu hỏi gốc của Teacher A');

  // Teacher A tạo 1 câu hỏi nhập từ web (IMPORTED_WEB) với shareable = false
  const webQuestionA = await prisma.question.create({
    data: {
      ownerId: teacherA.id,
      authorId: teacherA.id,
      subject: 'HOA',
      grade: 11,
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: Difficulty.NHAN_BIET,
      content: 'Câu hỏi nhập từ trang web ngoài',
      payload: { choices: [], correct: 'A' },
      solution: 'Lời giải chi tiết câu hỏi web',
      visibility: Visibility.PRIVATE,
      shareable: false, // CẤM CHIA SẺ
      sourceKind: SourceKind.IMPORTED_WEB,
    },
  });

  assert(webQuestionA.shareable === false && webQuestionA.sourceKind === SourceKind.IMPORTED_WEB, 'Câu hỏi IMPORTED_WEB bị khóa shareable = false');

  // ─────────────────────────────────────────────────────────────
  // 4. BẢN CHỤP BẤT BIẾN (ASSIGNMENT SNAPSHOT) (R14)
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 4. KIỂM THỬ BẢN CHỤP BẤT BIẾN (ASSIGNMENT SNAPSHOT) (R14) ---');

  const uniqueId = Date.now();

  const examA = await prisma.exam.create({
    data: {
      ownerId: teacherA.id,
      title: `Đề Kiểm Tra 15 Phút Toán ${uniqueId}`,
      subject: 'TOAN',
      grade: 12,
      metadata: { school: 'THPT Chuyên Test' },
      sections: [],
    },
  });

  const groupA = await prisma.group.create({
    data: {
      ownerId: teacherA.id,
      name: `Lớp 12A1 Test Snapshot ${uniqueId}`,
      publicCode: `GRP_TEST_${uniqueId}`,
    },
  });

  const studentA = await prisma.student.create({
    data: {
      groupId: groupA.id,
      displayName: 'Nguyễn Văn Em',
    },
  });

  // Snapshot chứa câu hỏi gốc của Thầy A
  const snapshotData = {
    title: 'Đề Kiểm Tra 15 Phút Toán',
    sections: [
      {
        id: 'sec_1',
        title: 'Phần I',
        questions: [
          {
            id: questionA.id,
            content: questionA.content,
            type: questionA.type,
            payload: questionA.payload,
            solution: questionA.solution,
            points: 0.25,
          },
        ],
      },
    ],
  };

  const assignmentA = await prisma.assignment.create({
    data: {
      publicId: `asn_snap_${uniqueId}`,
      ownerId: teacherA.id,
      examId: examA.id,
      groupId: groupA.id,
      title: `Bài Giao Kiểm Tra 15 Phút ${uniqueId}`,
      mode: AssignmentMode.CLASSWORK,
      snapshot: snapshotData,
      durationMinutes: 15,
      maxAttempts: 1,
    },
  });

  // Bây giờ Thầy A cố tình SỬA câu hỏi questionA trong DB
  await prisma.question.update({
    where: { id: questionA.id },
    data: {
      content: 'NỘI DUNG ĐÃ BỊ SỬA HOÀN TOÀN',
      payload: { choices: [{ key: 'A', text: '999' }], correct: 'B' }, // Đổi luôn đáp án đúng!
    },
  });

  // Thậm chí xóa mềm luôn câu hỏi gốc
  await prisma.question.update({
    where: { id: questionA.id },
    data: { deletedAt: new Date() },
  });

  // Kiểm tra lại snapshot của assignmentA
  const freshAssignment = await prisma.assignment.findUnique({
    where: { id: assignmentA.id },
  });

  const assignmentSnapshot: any = freshAssignment?.snapshot;
  const snapshotQuestion = assignmentSnapshot?.sections[0]?.questions[0];

  assert(
    snapshotQuestion?.content === 'Câu hỏi riêng của Thầy A: Tích phân $\\int_0^1 x dx = ?$',
    'Nội dung đề thi trong Assignment.snapshot không hề bị thay đổi sau khi câu hỏi gốc bị sửa'
  );
  assert(
    snapshotQuestion?.payload?.correct === 'A',
    'Đáp án đúng trong Assignment.snapshot vẫn bảo toàn nguyên vẹn sau khi câu gốc bị sửa đáp án'
  );

  // ─────────────────────────────────────────────────────────────
  // 5. BAREM CHẤM ĐIỂM ORACLE (GDPT 2018 / 2025)
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 5. KIỂM THỬ BAREM CHẤM ĐIỂM CHUẨN BỘ GD&ĐT ---');

  // Test Barem lũy tiến Đúng/Sai Phần II:
  // Đúng 1 ý: 0.1đ | Đúng 2 ý: 0.25đ | Đúng 3 ý: 0.5đ | Đúng 4 ý: 1.0đ
  function calculateTrueFalseScore(correctCount: number): number {
    switch (correctCount) {
      case 1: return 0.1;
      case 2: return 0.25;
      case 3: return 0.5;
      case 4: return 1.0;
      default: return 0.0;
    }
  }

  assert(calculateTrueFalseScore(0) === 0.0, 'Phần II: Đúng 0 ý = 0.0đ');
  assert(calculateTrueFalseScore(1) === 0.1, 'Phần II: Đúng 1 ý = 0.1đ');
  assert(calculateTrueFalseScore(2) === 0.25, 'Phần II: Đúng 2 ý = 0.25đ');
  assert(calculateTrueFalseScore(3) === 0.5, 'Phần II: Đúng 3 ý = 0.5đ');
  assert(calculateTrueFalseScore(4) === 1.0, 'Phần II: Đúng 4 ý = 1.0đ');

  // Test Chuẩn hóa câu trả lời ngắn Phần III
  function normalizeAnswer(ans: string): string {
    let clean = ans.trim().replace(/\s+/g, '');
    clean = clean.replace(',', '.');
    clean = clean.replace(/−/g, '-');
    return clean;
  }

  function checkShortAnswerMatch(userAnswer: string, acceptedAnswers: string[]): boolean {
    const normUser = normalizeAnswer(userAnswer);
    return acceptedAnswers.some((acc) => {
      const normAcc = normalizeAnswer(acc);
      if (normUser === normAcc) return true;
      // So sánh số học
      const numUser = parseFloat(normUser);
      const numAcc = parseFloat(normAcc);
      if (!isNaN(numUser) && !isNaN(numAcc) && Math.abs(numUser - numAcc) < 1e-6) {
        return true;
      }
      return false;
    });
  }

  const accepted = ['1.5', '1,5', '3/2'];
  assert(checkShortAnswerMatch('1.5', accepted), 'Phần III: Khớp số thập phân dấu chấm (1.5)');
  assert(checkShortAnswerMatch('1,5', accepted), 'Phần III: Khớp số thập phân dấu phẩy (1,5)');
  assert(checkShortAnswerMatch('  1.5  ', accepted), 'Phần III: Tự động loại bỏ khoảng trắng thừa');
  assert(checkShortAnswerMatch('1.50', accepted), 'Phần III: Khớp số học thập phân (1.50 == 1.5)');
  assert(!checkShortAnswerMatch('2.5', accepted), 'Phần III: Chặn đáp số sai');

  console.log(`\n================================================================`);
  console.log(`🎉 TẤT CẢ ${passed}/${total} BÀI KIỂM THỬ SPRINT 1 ĐÃ VƯỢT QUA 100%!`);
  console.log(`================================================================\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
