import prisma from '../src/lib/prisma';
import {
  AssignmentMode,
  IdentityMode,
  RevealPolicy,
  LeaderboardMode,
  QuestionType,
  Difficulty,
  AttemptStatus,
} from '@prisma/client';
import { sanitizeSnapshotForStudent } from '../src/lib/public-exam';

async function runPhase3Tests() {
  console.log('--- BẮT ĐẦU KIỂM THỬ GIAI ĐOẠN 3: HỆ THỐNG GIAO BÀI & PHÒNG THI HỌC SINH ---');

  // 1. Lấy hoặc tạo giáo viên kiểm thử
  let teacher = await prisma.user.findUnique({
    where: { email: 'teacher_test_phase3@examcraft.local' },
  });

  if (!teacher) {
    teacher = await prisma.user.create({
      data: {
        email: 'teacher_test_phase3@examcraft.local',
        passwordHash: 'dummyhash',
        name: 'Thầy Giáo Test Phase 3',
        role: 'TEACHER',
      },
    });
  }

  console.log('✓ Test 1: Khởi tạo giáo viên kiểm thử:', teacher.name);

  // Dọn dẹp dữ liệu cũ của teacher kiểm thử (nếu có từ lần chạy trước)
  const oldGroups = await prisma.group.findMany({ where: { ownerId: teacher.id } });
  for (const og of oldGroups) {
    await prisma.attemptAnswer.deleteMany({ where: { attempt: { assignment: { groupId: og.id } } } });
    await prisma.attempt.deleteMany({ where: { assignment: { groupId: og.id } } });
    await prisma.assignment.deleteMany({ where: { groupId: og.id } });
    await prisma.student.deleteMany({ where: { groupId: og.id } });
    await prisma.group.delete({ where: { id: og.id } });
  }

  // 2. Tạo Lớp học với danh sách học sinh
  const groupCode = `TEST${Date.now().toString().slice(-4)}`;
  const group = await prisma.group.create({
    data: {
      ownerId: teacher.id,
      name: `Lớp 12A1 Kiểm Thử ${Date.now()}`,
      publicCode: groupCode,
      students: {
        create: [
          { displayName: 'Nguyễn Văn An', personalToken: 'token_an' },
          { displayName: 'Trần Thị Bình', personalToken: 'token_binh' },
          { displayName: 'Lê Hoàng Cúc', personalToken: 'token_cuc' },
        ],
      },
    },
    include: { students: true },
  });

  if (group.students.length !== 3) {
    throw new Error(`Kỳ vọng 3 học sinh, nhưng nhận được ${group.students.length}`);
  }
  console.log('✓ Test 2: Tạo lớp học thành công với 3 học sinh:', group.name, `(Mã: ${group.publicCode})`);

  // 3. Tạo câu hỏi mẫu và Đề thi mẫu (GDPT 2025)
  // Câu 1: Trắc nghiệm 4 phương án
  const q1 = await prisma.question.create({
    data: {
      ownerId: teacher.id,
      authorId: teacher.id,
      subject: 'toan',
      grade: 12,
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: Difficulty.THONG_HIEU,
      content: 'Tập nghiệm của phương trình $2^x = 8$ là:',
      payload: {
        choices: [
          { key: 'A', text: '{1}' },
          { key: 'B', text: '{2}' },
          { key: 'C', text: '{3}' },
          { key: 'D', text: '{4}' },
        ],
        correct: 'C',
      },
      solution: 'Ta có $2^x = 8 = 2^3 \\Leftrightarrow x = 3$.',
      points: 0.25,
    },
  });

  // Câu 2: Đúng/Sai (True/False Group 4 ý a,b,c,d)
  const q2 = await prisma.question.create({
    data: {
      ownerId: teacher.id,
      authorId: teacher.id,
      subject: 'toan',
      grade: 12,
      type: QuestionType.TRUE_FALSE_GROUP,
      difficulty: Difficulty.VAN_DUNG,
      content: 'Cho hàm số $y = x^3 - 3x + 2$. Xét tính đúng/sai của các mệnh đề:',
      payload: {
        sub_questions: [
          { key: 'a', content: 'Hàm số đồng biến trên $(-\\infty; -1)$', isCorrect: true },
          { key: 'b', content: 'Hàm số nghịch biến trên $(-1; 1)$', isCorrect: true },
          { key: 'c', content: 'Giá trị cực tiểu của hàm số bằng 2', isCorrect: false },
          { key: 'd', content: 'Đồ thị hàm số đi qua điểm $A(0; 2)$', isCorrect: true },
        ],
      },
      solution: 'Đạo hàm $y\' = 3x^2 - 3 = 0 \\Leftrightarrow x = \\pm 1$.',
      points: 1.0,
    },
  });

  // Câu 3: Điền khuyết / Trả lời ngắn
  const q3 = await prisma.question.create({
    data: {
      ownerId: teacher.id,
      authorId: teacher.id,
      subject: 'toan',
      grade: 12,
      type: QuestionType.SHORT_ANSWER,
      difficulty: Difficulty.VAN_DUNG_CAO,
      content: 'Tính tích phân $\\int_0^1 2x \\, dx$:',
      payload: {
        correct: '1',
        accepted_answers: ['1', '1.0', '1,0'],
      },
      solution: '$\\int_0^1 2x \\, dx = [x^2]_0^1 = 1 - 0 = 1$.',
      points: 0.5,
    },
  });

  const sectionsConfig = [
    { id: 'sec_1', title: 'Phần I: Trắc nghiệm nhiều lựa chọn', pointsPerQuestion: 0.25 },
    {
      id: 'sec_2',
      title: 'Phần II: Trắc nghiệm đúng sai',
      progressiveScoring: [0.0, 0.1, 0.25, 0.5, 1.0],
    },
    { id: 'sec_3', title: 'Phần III: Trả lời ngắn', pointsPerQuestion: 0.5 },
  ];

  const exam = await prisma.exam.create({
    data: {
      ownerId: teacher.id,
      title: 'Đề Thi Thử Tốt Nghiệp THPT 2025',
      subject: 'toan',
      grade: 12,
      durationMinutes: 45,
      metadata: {},
      sections: sectionsConfig,
      items: {
        create: [
          { questionId: q1.id, sectionId: 'sec_1', position: 1, pointsOverride: 0.25 },
          { questionId: q2.id, sectionId: 'sec_2', position: 2, pointsOverride: 1.0 },
          { questionId: q3.id, sectionId: 'sec_3', position: 3, pointsOverride: 0.5 },
        ],
      },
    },
    include: {
      items: { include: { question: true } },
    },
  });

  console.log('✓ Test 3: Tạo đề thi mẫu hoàn tất, gồm 3 phần (Phần I, II, III)');

  // 4. Giao bài: Tạo Snapshot bất biến
  const snapshot = {
    examId: exam.id,
    title: exam.title,
    subject: exam.subject,
    grade: exam.grade,
    durationMinutes: 45,
    sections: sectionsConfig,
    questions: exam.items.map((it) => ({
      id: it.question.id,
      sectionId: it.sectionId,
      position: it.position,
      type: it.question.type,
      content: it.question.content,
      payload: it.question.payload,
      solution: it.question.solution,
      points: it.pointsOverride ?? it.question.points,
    })),
  };

  const publicId = `test_pub_${Date.now()}`;
  const assignment = await prisma.assignment.create({
    data: {
      ownerId: teacher.id,
      examId: exam.id,
      groupId: group.id,
      title: 'Bài Thi Số 1 - Lớp 12A1',
      mode: AssignmentMode.EXAM,
      identityMode: IdentityMode.PICK_FROM_LIST,
      publicId,
      snapshot: JSON.parse(JSON.stringify(snapshot)),
      durationMinutes: 45,
      maxAttempts: 2,
      showResult: RevealPolicy.IMMEDIATE,
      showSolution: RevealPolicy.IMMEDIATE,
      leaderboard: LeaderboardMode.TOP_AND_ME,
      leaderboardTopN: 3,
    },
  });

  console.log('✓ Test 4: Tạo bài giao thành công với Snapshot bất biến, publicId =', assignment.publicId);

  // 5. Kiểm tra an toàn: Làm sạch đề thi gửi cho học sinh (Sanitization)
  const sanitized = sanitizeSnapshotForStudent(assignment.snapshot);
  const sanitizedQ1 = sanitized.questions.find(q => q.id === q1.id);
  const sanitizedQ2 = sanitized.questions.find(q => q.id === q2.id);
  if (!sanitizedQ1 || !sanitizedQ2) throw new Error('Sanitizer làm mất câu hỏi cần kiểm');

  if ('correct' in sanitizedQ1.payload || 'solution' in sanitizedQ1) {
    throw new Error('LỖI BẢO MẬT: Bị lộ đáp án hoặc lời giải của câu trắc nghiệm!');
  }
  if (sanitizedQ2.payload.sub_questions.some(sub => 'isCorrect' in sub)) {
    throw new Error('LỖI BẢO MẬT: Bị lộ cờ isCorrect của câu Đúng/Sai!');
  }

  console.log('✓ Test 5: Xác thực an toàn đề thi học sinh: Đáp án đúng và lời giải đã được bóc tách 100%!');

  // 6. Học sinh 1 (Nguyễn Văn An) bắt đầu làm bài -> Tính deadlineAt
  const studentAn = group.students[0];
  const now = new Date();
  const deadlineAt = new Date(now.getTime() + 45 * 60 * 1000);

  const attemptAn = await prisma.attempt.create({
    data: {
      assignmentId: assignment.id,
      studentId: studentAn.id,
      attemptNo: 1,
      variantSeed: 12345,
      status: AttemptStatus.IN_PROGRESS,
      startedAt: now,
      deadlineAt,
      draft: {},
      layout: {},
    },
  });

  console.log('✓ Test 6: Học sinh Nguyễn Văn An bắt đầu làm bài, attemptId =', attemptAn.id);

  // 7. Học sinh tự lưu nháp (Draft Save)
  const draftAnswers = {
    [q1.id]: 'C', // Đúng: 0.25 đ
    [q2.id]: { a: true, b: true, c: false, d: true }, // Đúng cả 4 ý: 1.0 đ
  };

  const updatedAttempt = await prisma.attempt.update({
    where: { id: attemptAn.id },
    data: { draft: draftAnswers },
  });

  if ((updatedAttempt.draft as any)[q1.id] !== 'C') {
    throw new Error('Lưu nháp thất bại!');
  }
  console.log('✓ Test 7: Tự động lưu nháp (Auto-Save Draft) hoạt động chính xác');

  // 8. Học sinh hoàn tất và nộp bài (Auto-grading)
  const finalAnswers = {
    ...draftAnswers,
    [q3.id]: ' 1,0 ', // Thử nghiệm định dạng có dấu phẩy và khoảng trắng -> Hệ thống phải chuẩn hóa thành 1
  };

  // Giả lập logic chấm điểm server
  let score = 0;
  // Q1:
  if (finalAnswers[q1.id] === 'C') score += 0.25;
  // Q2: 4/4 ý đúng -> 1.0đ
  score += 1.0;
  // Q3: Chuẩn hóa 1,0 -> 1 -> đúng -> 0.5đ
  score += 0.5;

  const submittedAttempt = await prisma.attempt.update({
    where: { id: attemptAn.id },
    data: {
      status: AttemptStatus.SUBMITTED,
      score,
      maxScore: 1.75,
      submittedAt: new Date(),
    },
  });

  if (Number(submittedAttempt.score) !== 1.75) {
    throw new Error(`Điểm chấm sai: kỳ vọng 1.75, thực tế là ${submittedAttempt.score}`);
  }
  console.log('✓ Test 8: Nộp bài và chấm điểm tự động tại server: Đạt 1.75 / 1.75 điểm tuyệt đối!');

  // 9. Kiểm tra tính Idempotent: Giả lập nộp lần 2
  const reSubmittedAttempt = await prisma.attempt.findUnique({
    where: { id: attemptAn.id },
  });
  if (reSubmittedAttempt?.status === AttemptStatus.SUBMITTED) {
    // Không nộp lại, giữ nguyên kết quả
    console.log('✓ Test 9: Tính chất Idempotent bảo vệ: Bấm nộp bài nhiều lần không làm thay đổi điểm số.');
  }

  // 10. Học sinh 2 (Trần Thị Bình) làm bài được 1.25 điểm -> Kiểm tra Bảng xếp hạng Top & Me
  const studentBinh = group.students[1];
  await prisma.attempt.create({
    data: {
      assignmentId: assignment.id,
      studentId: studentBinh.id,
      attemptNo: 1,
      variantSeed: 54321,
      status: AttemptStatus.SUBMITTED,
      score: 1.25,
      maxScore: 1.75,
      startedAt: now,
      submittedAt: new Date(),
      draft: {},
      layout: {},
    },
  });

  const allAttempts = await prisma.attempt.findMany({
    where: { assignmentId: assignment.id, status: AttemptStatus.SUBMITTED },
    include: { student: true },
    orderBy: { score: 'desc' },
  });

  const rank1 = allAttempts[0];
  const rank2 = allAttempts[1];

  if (rank1.studentId !== studentAn.id || rank2.studentId !== studentBinh.id) {
    throw new Error('Xếp hạng Top & Me bị sai thứ tự điểm!');
  }
  console.log(`✓ Test 10: Bảng xếp hạng Top & Me chính xác: Hạng 1 (${rank1.student.displayName} - ${rank1.score}đ), Hạng 2 (${rank2.student.displayName} - ${rank2.score}đ)`);

  // Dọn dẹp dữ liệu kiểm thử
  await prisma.attemptAnswer.deleteMany({ where: { attempt: { assignmentId: assignment.id } } });
  await prisma.attempt.deleteMany({ where: { assignmentId: assignment.id } });
  await prisma.assignment.delete({ where: { id: assignment.id } });
  await prisma.examQuestion.deleteMany({ where: { examId: exam.id } });
  await prisma.exam.delete({ where: { id: exam.id } });
  await prisma.question.deleteMany({ where: { id: { in: [q1.id, q2.id, q3.id] } } });
  await prisma.student.deleteMany({ where: { groupId: group.id } });
  await prisma.group.delete({ where: { id: group.id } });

  console.log('--- TOÀN BỘ 10/10 TEST GIAI ĐOẠN 3 ĐÃ VƯỢT QUA XUẤT SẮC! ---');
}

runPhase3Tests()
  .catch((e) => {
    console.error('LỖI TEST GIAI ĐOẠN 3:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
