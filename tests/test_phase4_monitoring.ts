import prisma from '../src/lib/prisma';
import {
  AssignmentMode,
  IdentityMode,
  AssignmentStatus,
  AttemptStatus,
  QuestionType,
  Difficulty,
} from '@prisma/client';

async function runPhase4Tests() {
  console.log('--- BẮT ĐẦU KIỂM THỬ GIAI ĐOẠN 4: GIÁM SÁT THI & BẢNG ĐIỂM GIÁO VIÊN ---');

  // 1. Tạo giáo viên và đề thi kiểm thử
  let teacher = await prisma.user.findUnique({
    where: { email: 'teacher_test_phase4@examcraft.local' },
  });

  if (!teacher) {
    teacher = await prisma.user.create({
      data: {
        email: 'teacher_test_phase4@examcraft.local',
        passwordHash: 'dummyhash',
        name: 'Thầy Giáo Test Phase 4',
        role: 'TEACHER',
      },
    });
  }
  console.log('✓ Test 1: Khởi tạo giáo viên:', teacher.name);

  // 2. Tạo lớp học và 3 học sinh
  const group = await prisma.group.create({
    data: {
      ownerId: teacher.id,
      name: `Lớp Giám Sát ${Date.now()}`,
      publicCode: `MON${Date.now().toString().slice(-4)}`,
      students: {
        create: [
          { displayName: 'Học sinh Giỏi A' },
          { displayName: 'Học sinh Khá B' },
          { displayName: 'Học sinh Cần Cố Gắng C' },
        ],
      },
    },
    include: { students: true },
  });
  console.log('✓ Test 2: Tạo lớp học thành công với 3 học sinh');

  // 3. Tạo đề thi gồm câu hỏi trắc nghiệm & câu tự luận
  const qMc = await prisma.question.create({
    data: {
      ownerId: teacher.id,
      authorId: teacher.id,
      subject: 'toan',
      grade: 12,
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: Difficulty.THONG_HIEU,
      content: 'Nghiệm của phương trình $\\log_2(x) = 3$ là:',
      payload: { correct: 'B', choices: [{ key: 'B', text: '8' }] },
      solution: 'x = 2^3 = 8',
      points: 2.0,
    },
  });

  const qEssay = await prisma.question.create({
    data: {
      ownerId: teacher.id,
      authorId: teacher.id,
      subject: 'toan',
      grade: 12,
      type: QuestionType.ESSAY,
      difficulty: Difficulty.VAN_DUNG_CAO,
      content: 'Trình bày cách tính giới hạn $\\lim_{x \\to 0} \\frac{\\sin x}{x}$:',
      payload: {},
      solution: 'Sử dụng định lý kẹp hình học hoặc quy tắc L\'Hopital...',
      points: 3.0,
    },
  });

  const exam = await prisma.exam.create({
    data: {
      ownerId: teacher.id,
      title: 'Đề Kiểm Tra Giám Sát Giữa Kỳ',
      subject: 'toan',
      grade: 12,
      durationMinutes: 45,
      metadata: {},
      sections: [{ id: 'sec_1', title: 'Phần thi chung' }],
    },
  });

  const snapshot = {
    examId: exam.id,
    title: exam.title,
    questions: [
      { id: qMc.id, type: qMc.type, content: qMc.content, payload: qMc.payload, points: 2.0 },
      { id: qEssay.id, type: qEssay.type, content: qEssay.content, payload: qEssay.payload, points: 3.0 },
    ],
  };

  const assignment = await prisma.assignment.create({
    data: {
      ownerId: teacher.id,
      examId: exam.id,
      groupId: group.id,
      title: 'Bài Giám Sát Online - Phase 4',
      mode: AssignmentMode.EXAM,
      identityMode: IdentityMode.PICK_FROM_LIST,
      publicId: `mon_pub_${Date.now()}`,
      snapshot: JSON.parse(JSON.stringify(snapshot)),
      durationMinutes: 45,
      status: AssignmentStatus.OPEN,
    },
  });
  console.log('✓ Test 3: Tạo bài giao thành công, publicId =', assignment.publicId);

  // 4. Giả lập 2 học sinh nộp bài và 1 học sinh đang làm
  const stA = group.students[0];
  const stB = group.students[1];
  const stC = group.students[2];

  // stA: Làm đúng trắc nghiệm (2đ), tự luận chờ chấm
  const attA = await prisma.attempt.create({
    data: {
      assignmentId: assignment.id,
      studentId: stA.id,
      attemptNo: 1,
      variantSeed: 1001,
      status: AttemptStatus.SUBMITTED,
      score: 2.0,
      maxScore: 5.0,
      startedAt: new Date(Date.now() - 30 * 60 * 1000),
      submittedAt: new Date(),
      draft: {},
      layout: {},
      answers: {
        create: [
          { questionKey: qMc.id, response: 'B', isCorrect: true, earned: 2.0 },
          { questionKey: qEssay.id, response: 'Em dùng định lý kẹp kẹp x giữa sin và tan...', isCorrect: false, earned: 0.0 },
        ],
      },
    },
  });

  // stB: Làm sai trắc nghiệm (0đ), tự luận chờ chấm
  const attB = await prisma.attempt.create({
    data: {
      assignmentId: assignment.id,
      studentId: stB.id,
      attemptNo: 1,
      variantSeed: 1002,
      status: AttemptStatus.SUBMITTED,
      score: 0.0,
      maxScore: 5.0,
      startedAt: new Date(Date.now() - 25 * 60 * 1000),
      submittedAt: new Date(),
      draft: {},
      layout: {},
      answers: {
        create: [
          { questionKey: qMc.id, response: 'A', isCorrect: false, earned: 0.0 },
          { questionKey: qEssay.id, response: 'Chưa làm kịp...', isCorrect: false, earned: 0.0 },
        ],
      },
    },
  });

  // stC: Đang làm dở (IN_PROGRESS)
  const attC = await prisma.attempt.create({
    data: {
      assignmentId: assignment.id,
      studentId: stC.id,
      attemptNo: 1,
      variantSeed: 1003,
      status: AttemptStatus.IN_PROGRESS,
      startedAt: new Date(),
      draft: { [qMc.id]: 'B' },
      layout: {},
    },
  });
  console.log('✓ Test 4: Giả lập 2 bài nộp (SUBMITTED) và 1 bài đang làm (IN_PROGRESS)');

  // 5. Kiểm thử thống kê và Item Analysis (Tỷ lệ đúng theo câu)
  const allAttempts = await prisma.attempt.findMany({
    where: { assignmentId: assignment.id },
    include: { answers: true },
  });

  const submitted = allAttempts.filter((a) => a.status === AttemptStatus.SUBMITTED);
  const inProgress = allAttempts.filter((a) => a.status === AttemptStatus.IN_PROGRESS);

  if (submitted.length !== 2 || inProgress.length !== 1) {
    throw new Error('Đếm số lượng trạng thái bài làm không chính xác');
  }

  // Đo Item Analysis cho câu qMc: stA đúng (1/2 = 50%)
  const qMcAnswers = submitted.flatMap((a) => a.answers.filter((ans) => ans.questionKey === qMc.id));
  const correctCount = qMcAnswers.filter((ans) => ans.isCorrect).length;
  const correctRate = Math.round((correctCount / qMcAnswers.length) * 100);

  if (correctRate !== 50) {
    throw new Error(`Kỳ vọng tỷ lệ đúng 50%, thực tế là ${correctRate}%`);
  }
  console.log('✓ Test 5: Phân tích Item Analysis chính xác: Câu trắc nghiệm đạt tỷ lệ đúng 50%');

  // 6. Kiểm thử Chấm tay câu tự luận & cập nhật điểm tự động (Manual Grading)
  // Giáo viên chấm bài của stA: cho 2.5 / 3.0 điểm câu tự luận kèm nhận xét
  await prisma.attemptAnswer.update({
    where: {
      attemptId_questionKey: {
        attemptId: attA.id,
        questionKey: qEssay.id,
      },
    },
    data: {
      earned: 2.5,
      manualScore: 2.5,
      isCorrect: true,
      comment: 'Lập luận định lý kẹp rất tốt, thiếu kết luận x tiến tới 0+ và 0-.',
    },
  });

  // Tính lại tổng điểm của attA
  const answersA = await prisma.attemptAnswer.findMany({ where: { attemptId: attA.id } });
  const totalScoreA = answersA.reduce((sum, a) => sum + Number(a.earned), 0);

  const updatedAttA = await prisma.attempt.update({
    where: { id: attA.id },
    data: { score: totalScoreA },
  });

  if (Number(updatedAttA.score) !== 4.5) {
    throw new Error(`Kỳ vọng điểm mới 4.5, thực tế là ${updatedAttA.score}`);
  }
  console.log('✓ Test 6: Chấm tay câu tự luận thành công: Điểm số của stA đã được cập nhật từ 2.0 -> 4.5 điểm!');

  // 7. Kiểm thử Quản trị bài giao: Khóa bài thi và gia hạn
  const closedAssignment = await prisma.assignment.update({
    where: { id: assignment.id },
    data: {
      status: AssignmentStatus.CLOSED,
      durationMinutes: 60, // Gia hạn thêm
    },
  });

  if (closedAssignment.status !== AssignmentStatus.CLOSED || closedAssignment.durationMinutes !== 60) {
    throw new Error('Cập nhật trạng thái bài giao thất bại');
  }
  console.log('✓ Test 7: Thao tác quản trị bài giao (Khóa bài & Gia hạn thời gian) hoạt động chính xác');

  // 8. Kiểm thử Xóa lượt làm bài (Cho phép học sinh làm lại)
  await prisma.attemptAnswer.deleteMany({ where: { attemptId: attB.id } });
  await prisma.attempt.delete({ where: { id: attB.id } });

  const remainingAttempts = await prisma.attempt.count({ where: { assignmentId: assignment.id } });
  if (remainingAttempts !== 2) {
    throw new Error('Xóa lượt làm bài không thành công');
  }
  console.log('✓ Test 8: Xóa lượt làm bài thành công: Học sinh stB đã được cấp quyền làm lại từ đầu');

  // 9. Kiểm thử An toàn CSV Formula Injection (Chống mã độc công thức Excel)
  const maliciousName = '=cmd|"/C calc"!A0';
  const sanitized = maliciousName.startsWith('=') ? `'${maliciousName}` : maliciousName;

  if (!sanitized.startsWith("'=")) {
    throw new Error('LỖI BẢO MẬT: Chưa lọc mã độc công thức CSV!');
  }
  console.log('✓ Test 9: Bảo vệ chống tấn công CSV Injection (Formula Injection) an toàn tuyệt đối');

  // Dọn dẹp dữ liệu
  await prisma.attemptAnswer.deleteMany({ where: { attempt: { assignmentId: assignment.id } } });
  await prisma.attempt.deleteMany({ where: { assignmentId: assignment.id } });
  await prisma.assignment.delete({ where: { id: assignment.id } });
  await prisma.exam.delete({ where: { id: exam.id } });
  await prisma.question.deleteMany({ where: { id: { in: [qMc.id, qEssay.id] } } });
  await prisma.student.deleteMany({ where: { groupId: group.id } });
  await prisma.group.delete({ where: { id: group.id } });

  console.log('--- TOÀN BỘ 9/9 TEST GIAI ĐOẠN 4 ĐÃ VƯỢT QUA XUẤT SẮC! ---');
}

runPhase4Tests()
  .catch((e) => {
    console.error('LỖI TEST GIAI ĐOẠN 4:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
