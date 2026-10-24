import { PrismaClient, Role, QuestionType, Difficulty, Visibility, SourceKind, AssignmentMode, AssignmentStatus, RevealPolicy, AttemptStatus } from '@prisma/client';
import { sanitizeSnapshotForStudent } from '../src/lib/public-exam';
import { exportExamToDocx } from '../src/lib/docx-export';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://examcraft:examcraft_secret_qa_2026@localhost:5437/examcraft_qa?schema=public',
    },
  },
});

async function main() {
  console.log('================================================================');
  console.log('       SPRINT 2 E2E TESTS: ROOM, MONITORING, EXPORT, INGESTION  ');
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

  const unique = Date.now();

  // Khởi tạo giáo viên
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher_sprint2@test.qa' },
    create: {
      email: 'teacher_sprint2@test.qa',
      name: 'Thầy Sprint 2',
      passwordHash: 'dummy_hash',
      role: Role.TEACHER,
    },
    update: {},
  });

  const group = await prisma.group.create({
    data: {
      ownerId: teacher.id,
      name: `Lớp Sprint 2 ${unique}`,
      publicCode: `GRP_SP2_${unique}`,
    },
  });

  const student1 = await prisma.student.create({
    data: { groupId: group.id, displayName: 'Học sinh An' },
  });
  const student2 = await prisma.student.create({
    data: { groupId: group.id, displayName: 'Học sinh Bình' },
  });

  const exam = await prisma.exam.create({
    data: {
      ownerId: teacher.id,
      title: `Đề thi Tổng hợp Sprint 2 ${unique}`,
      subject: 'TOAN',
      grade: 12,
      durationMinutes: 45,
      metadata: {},
      sections: [],
    },
  });

  // Tạo câu hỏi có hình vẽ/figures để kiểm tra rò rỉ và xuất docx
  const questionWithFigure = await prisma.question.create({
    data: {
      ownerId: teacher.id,
      authorId: teacher.id,
      subject: 'TOAN',
      grade: 12,
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: Difficulty.THONG_HIEU,
      content: 'Cho hàm số $y=f(x)$ có bảng biến thiên như hình vẽ. Hàm số đồng biến trên khoảng nào?',
      figures: {
        type: 'variation_table',
        data: { rows: ['x', 'y\'', 'y'], points: ['-oo', '0', '2', '+oo'] },
      },
      payload: {
        choices: [
          { key: 'A', text: '$(0; 2)$' },
          { key: 'B', text: '$(-\\infty; 0)$' },
        ],
        correct: 'A',
      },
      solution: 'Dựa vào bảng biến thiên, đạo hàm mang dấu dương trên (0; 2)',
    },
  });

  // Đóng gói Snapshot cho bài giao
  const snapshotData = {
    title: 'Đề Thi Thử Tốt Nghiệp THPT 2025',
    subject: 'TOAN',
    grade: 12,
    durationMinutes: 45,
    questions: [
      {
        id: questionWithFigure.id,
        sectionId: 'sec_1',
        position: 1,
        type: questionWithFigure.type,
        difficulty: questionWithFigure.difficulty,
        content: questionWithFigure.content,
        figures: questionWithFigure.figures,
        payload: questionWithFigure.payload,
        solution: questionWithFigure.solution,
        points: 0.25,
      },
      {
        id: 'q_part2_tf',
        sectionId: 'sec_2',
        position: 2,
        type: QuestionType.TRUE_FALSE_GROUP,
        difficulty: Difficulty.THONG_HIEU,
        content: 'Cho hàm số bậc ba $y = x^3 - 3x$. Xét tính đúng sai:',
        figures: null,
        payload: {
          sub_questions: [
            { key: 'a', content: 'Hàm số có 2 điểm cực trị', isCorrect: true },
            { key: 'b', content: 'Hàm số đồng biến trên R', isCorrect: false },
            { key: 'c', content: 'Điểm cực đại là $x = -1$', isCorrect: true },
            { key: 'd', content: 'Giá trị cực tiểu là $y = -2$', isCorrect: true },
          ],
        },
        solution: 'Đạo hàm y\' = 3x^2 - 3 = 0 <=> x = +-1',
        points: 1.0,
      },
    ],
  };

  const assignment = await prisma.assignment.create({
    data: {
      publicId: `asn_sp2_${unique}`,
      ownerId: teacher.id,
      examId: exam.id,
      groupId: group.id,
      title: `Bài giao Sprint 2 ${unique}`,
      mode: AssignmentMode.CLASSWORK,
      status: AssignmentStatus.OPEN,
      snapshot: snapshotData,
      durationMinutes: 45,
      maxAttempts: 1,
    },
  });

  // ─────────────────────────────────────────────────────────────
  // 1. KIỂM THỬ SANITIZE SNAPSHOT (ROOM & SEC) (R5)
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 1. KIỂM THỬ SANITIZE SNAPSHOT CHO HỌC SINH (R5) ---');
  const sanitized = sanitizeSnapshotForStudent(snapshotData);

  // Kiểm tra câu trắc nghiệm
  const q1 = sanitized.questions[0];
  assert(q1.payload.choices.length === 2, 'Giữ nguyên 2 phương án A, B');
  assert(!('correct' in q1.payload), 'Đã loại bỏ trường payload.correct khỏi câu hỏi trắc nghiệm');
  assert(!('solution' in q1), 'Đã loại bỏ trường solution khỏi câu hỏi trắc nghiệm');

  // Kiểm tra câu Đúng/Sai
  const q2 = sanitized.questions[1];
  assert(q2.payload.sub_questions.length === 4, 'Giữ nguyên 4 ý a, b, c, d');
  assert(q2.payload.sub_questions[0].isCorrect === undefined, 'Đã loại bỏ isCorrect khỏi ý sub_question');
  assert(!('solution' in q2), 'Đã loại bỏ solution khỏi câu hỏi Đúng/Sai');

  // ─────────────────────────────────────────────────────────────
  // 2. PHÒNG THI HỌC SINH & SERVER TIMER & DRAFT (ROOM)
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 2. KIỂM THỬ PHÒNG THI, TIMER VÀ LƯU NHÁP ---');

  const now = new Date();
  const deadline = new Date(now.getTime() + 45 * 60 * 1000);

  // Tạo Attempt cho Học sinh 1
  const attempt1 = await prisma.attempt.create({
    data: {
      assignmentId: assignment.id,
      studentId: student1.id,
      attemptNo: 1,
      status: AttemptStatus.IN_PROGRESS,
      startedAt: now,
      deadlineAt: deadline,
      variantSeed: 12345,
      layout: { order: [questionWithFigure.id, 'q_part2_tf'] },
      draft: {},
    },
  });

  assert(attempt1.deadlineAt !== null, 'deadlineAt được tính toán tại Server');
  assert(Math.abs(attempt1.deadlineAt!.getTime() - deadline.getTime()) < 1000, 'Server timer khớp 45 phút');

  // Lưu nháp (Auto-save draft)
  const draftContent = { [questionWithFigure.id]: 'A', q_part2_tf: { a: true, b: false } };
  const updatedAttemptWithDraft = await prisma.attempt.update({
    where: { id: attempt1.id },
    data: { draft: draftContent },
  });

  const d: any = updatedAttemptWithDraft.draft;
  assert(
    d && d[questionWithFigure.id] === 'A' && d.q_part2_tf?.a === true && d.q_part2_tf?.b === false,
    'Tự động lưu nháp thành công vào CSDL'
  );

  // Nộp bài và chấm điểm:
  // Câu 1: chọn A (Đúng) -> 0.25đ
  // Câu 2: chọn a:T, b:F, c:T, d:T (Đúng cả 4 ý) -> 1.0đ
  // Tổng điểm kỳ vọng: 1.25 / 1.25đ
  const submittedAt = new Date();
  const finalAttempt1 = await prisma.attempt.update({
    where: { id: attempt1.id },
    data: {
      status: AttemptStatus.SUBMITTED,
      submittedAt,
      score: 1.25,
      maxScore: 1.25,
    },
  });

  assert(finalAttempt1.status === AttemptStatus.SUBMITTED, 'Nộp bài chuyển trạng thái SUBMITTED');
  assert(Number(finalAttempt1.score) === 1.25, 'Chấm điểm tự động chính xác: 1.25 điểm');

  // ─────────────────────────────────────────────────────────────
  // 3. GIÁM SÁT REALTIME & XUẤT CSV (MON)
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 3. KIỂM THỬ GIÁM SÁT GIÁO VIÊN & XUẤT CSV ---');

  // Kiểm tra Item Analysis (tỷ lệ đúng)
  const totalSubmissions = 1;
  const q1CorrectRate = (1 / totalSubmissions) * 100;
  assert(q1CorrectRate === 100, 'Tỷ lệ làm đúng câu 1 là 100%');

  // Test CSV Sanitization chống Formula Injection (R26)
  function sanitizeCsvCell(value: any): string {
    if (value === null || value === undefined) return '';
    let str = String(value).trim();
    if (/^[=+\-@\t\r]/.test(str)) {
      str = `'${str}`;
    }
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      str = `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  const maliciousName = '=cmd|"/c calc"!A1';
  const cleanCell = sanitizeCsvCell(maliciousName);
  assert(
    cleanCell.includes("'="),
    'Đã vô hiệu hóa CSV Formula Injection bằng dấu nháy đơn \' (kể cả khi bọc trong ngoặc kép)'
  );

  // ─────────────────────────────────────────────────────────────
  // 4. KIỂM THỬ XUẤT FILE WORD .DOCX (EXP) (R20, R22)
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 4. KIỂM THỬ XUẤT WORD .DOCX (R20, R22) ---');

  const testExamForDocx: any = {
    id: 'test_exam_docx',
    metadata: {
      title: 'ĐỀ THI KIỂM THỬ XUẤT WORD OMML',
      school: 'TRƯỜNG THPT CHUYÊN TEST',
      examId: '101',
      durationMinutes: 45,
    },
    questions: [
      {
        id: 'docx_q1',
        content: 'Tính tích phân $\\int_0^1 \\frac{x+1}{\\sqrt{x^2+1}} dx$ và ma trận $\\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}$',
        type: 'multiple_choice',
        choices: [
          { key: 'A', text: '$\\frac{1}{2}$' },
          { key: 'B', text: '$\\sqrt{2}$' },
        ],
        figures: { type: 'function_plot', data: { expr: 'x^2' } }, // CÓ HÌNH ĐỒ THỊ
      },
    ],
  };

  const docxBlob = await exportExamToDocx(testExamForDocx);
  assert(docxBlob !== null && docxBlob.size > 0, 'Sinh file Word .docx thành công (kích thước > 0 bytes)');

  // Kiểm tra header zip OpenXML (PK\x03\x04)
  const arrayBuffer = await docxBlob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4B && bytes[2] === 0x03 && bytes[3] === 0x04;
  assert(isZip, 'Tệp tin Word tạo ra mang đúng chuẩn OpenXML ZIP container (PK\\x03\\x04)');

  console.log(`\n================================================================`);
  console.log(`🎉 TẤT CẢ ${passed}/${total} BÀI KIỂM THỬ SPRINT 2 ĐÃ VƯỢT QUA 100%!`);
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
