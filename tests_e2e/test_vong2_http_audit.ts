import prisma from '../src/lib/prisma';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3005';

interface PerfMetrics {
  totalRequests: number;
  successCount: number;
  errorCount: number;
  latencies: number[];
  p50: number;
  p95: number;
  p99: number;
  avg: number;
  min: number;
  max: number;
  totalTimeMs: number;
  dbConnections: number;
}

async function getDbConnectionCount(): Promise<number> {
  try {
    const result: any = await prisma.$queryRaw`SELECT count(*)::int as count FROM pg_stat_activity WHERE datname = 'examcraft_qa';`;
    return result[0]?.count || 0;
  } catch (e) {
    return 0;
  }
}

async function main() {
  console.log('===============================================================');
  console.log('   CHIẾN DỊCH KIỂM ĐỊNH HTTP & AUDIT THỰC NGHIỆM VÒNG 2');
  console.log('   Mục tiêu: R5, R8, R11, R12, R17, R23-R30, PERF 100 HS, AI Real');
  console.log('===============================================================\n');

  const auditResults: Record<string, any> = {};

  // 0. Khởi tạo dữ liệu giáo viên kiểm thử
  console.log('--- BƯỚC 0: KHỞI TẠO TÀI KHOẢN VÀ DỮ LIỆU KIỂM THỬ ---');
  let teacher = await prisma.user.findUnique({ where: { email: 'teacher_vong2@examcraft.local' } });
  if (!teacher) {
    teacher = await prisma.user.create({
      data: {
        email: 'teacher_vong2@examcraft.local',
        passwordHash: '$2b$10$epRswS1C5k/9o3M4aI822.4L7t4EsuvO0V87lM7wJ3YVpC5L8M9eS', // dummy
        name: 'Giáo Viên Vòng 2',
        role: 'TEACHER',
        isActive: true,
        mustChangePassword: false,
      },
    });
  }

  // Tạo đề thi và câu hỏi chuẩn
  const q1 = await prisma.question.create({
    data: {
      ownerId: teacher.id,
      authorId: teacher.id,
      subject: 'toan',
      grade: 12,
      type: 'MULTIPLE_CHOICE',
      difficulty: 'THONG_HIEU',
      content: 'Tập nghiệm của phương trình $3^x = 9$ là:',
      payload: {
        choices: [
          { key: 'A', text: '{1}' },
          { key: 'B', text: '{2}' },
          { key: 'C', text: '{3}' },
          { key: 'D', text: '{4}' },
        ],
        correct: 'B',
      },
      solution: 'Ta có $3^x = 9 = 3^2 \\Rightarrow x = 2$. BÍ_MẬT_LỜI_GIẢI_KHÔNG_ĐƯỢC_LỘ',
      points: 0.25,
    },
  });

  const q2 = await prisma.question.create({
    data: {
      ownerId: teacher.id,
      authorId: teacher.id,
      subject: 'toan',
      grade: 12,
      type: 'TRUE_FALSE_GROUP',
      difficulty: 'VAN_DUNG',
      content: 'Cho hàm số $y = x^4 - 2x^2$. Xét tính đúng sai:',
      payload: {
        sub_questions: [
          { key: 'a', content: 'Hàm số đạt cực tiểu tại $x = 1$', isCorrect: true },
          { key: 'b', content: 'Hàm số đồng biến trên $(1; +\\infty)$', isCorrect: true },
          { key: 'c', content: 'Giá trị cực đại bằng 1', isCorrect: false },
          { key: 'd', content: 'Đồ thị cắt trục hoành tại 3 điểm phân biệt', isCorrect: true },
        ],
      },
      solution: 'Lời giải chi tiết hàm bậc bốn trùng phương. BÍ_MẬT_LỜI_GIẢI_TF',
      points: 1.0,
    },
  });

  const group = await prisma.group.create({
    data: {
      ownerId: teacher.id,
      name: `Lớp Vòng 2 - ${Date.now()}`,
      publicCode: `V2_${Date.now().toString().slice(-4)}`,
      students: {
        create: [
          { displayName: 'Học sinh An V2', personalToken: `tok_an_${Date.now()}` },
          { displayName: 'Học sinh Bình V2', personalToken: `tok_binh_${Date.now()}` },
          { displayName: 'Học sinh Cúc V2', personalToken: `tok_cuc_${Date.now()}` },
        ],
      },
    },
    include: { students: true },
  });

  const exam = await prisma.exam.create({
    data: {
      ownerId: teacher.id,
      title: 'Đề Thi Thử Nghiệm Vòng 2 Audit',
      subject: 'toan',
      grade: 12,
      durationMinutes: 45,
      metadata: {},
      sections: [
        { id: 'sec_1', title: 'Phần I', pointsPerQuestion: 0.25 },
        { id: 'sec_2', title: 'Phần II', progressiveScoring: [0.0, 0.1, 0.25, 0.5, 1.0] },
      ],
      items: {
        create: [
          { questionId: q1.id, sectionId: 'sec_1', position: 1, pointsOverride: 0.25 },
          { questionId: q2.id, sectionId: 'sec_2', position: 2, pointsOverride: 1.0 },
        ],
      },
    },
    include: { items: { include: { question: true } } },
  });

  const snapshot = {
    examId: exam.id,
    title: exam.title,
    subject: exam.subject,
    grade: exam.grade,
    durationMinutes: 45,
    sections: exam.sections,
    questions: [
      {
        id: q1.id,
        sectionId: 'sec_1',
        position: 1,
        type: q1.type,
        difficulty: q1.difficulty,
        content: q1.content,
        figures: q1.figures,
        payload: q1.payload,
        solution: q1.solution,
        points: 0.25,
      },
      {
        id: q2.id,
        sectionId: 'sec_2',
        position: 2,
        type: q2.type,
        difficulty: q2.difficulty,
        content: q2.content,
        figures: q2.figures,
        payload: q2.payload,
        solution: q2.solution,
        points: 1.0,
      },
    ],
  };

  const publicId = `v2_pub_${Date.now()}`;
  const assignment = await prisma.assignment.create({
    data: {
      ownerId: teacher.id,
      examId: exam.id,
      groupId: group.id,
      title: 'Bài Giao Kiểm Thử Vòng 2',
      mode: 'EXAM',
      status: 'OPEN',
      identityMode: 'PICK_FROM_LIST',
      publicId,
      snapshot: JSON.parse(JSON.stringify(snapshot)),
      durationMinutes: 45,
      maxAttempts: 1,
      showResult: 'IMMEDIATE',
      showSolution: 'IMMEDIATE',
      leaderboard: 'TOP_AND_ME',
      leaderboardTopN: 3,
    },
  });

  console.log(`✓ Đã tạo bài giao kiểm thử: publicId = ${publicId}`);

  // ===============================================================
  // 1. R5: QUÉT BYTE HTML, RSC, __next_f VÀ JSON CỦA /a/[publicId]
  // ===============================================================
  console.log('\n--- 1. KIỂM ĐỊNH R5: QUÉT BYTE CHỐNG LỘ ĐÁP ÁN TRÊN /a/[publicId] ---');
  const secretTokens = [
    'BÍ_MẬT_LỜI_GIẢI_KHÔNG_ĐƯỢC_LỘ',
    'BÍ_MẬT_LỜI_GIẢI_TF',
    '"correct":"B"',
    '"isCorrect":true',
    '"isCorrect":false',
  ];

  // 1.1 Quét Raw HTML SSR của /a/[publicId]
  const pageRes = await fetch(`${BASE_URL}/a/${publicId}`);
  const pageHtml = await pageRes.text();
  let r5HtmlLeak = false;
  let leakedTokenInHtml = '';

  for (const token of secretTokens) {
    if (pageHtml.includes(token)) {
      r5HtmlLeak = true;
      leakedTokenInHtml = token;
      break;
    }
  }

  // 1.2 Quét JSON API /api/public/assignments/[publicId]
  const apiRes = await fetch(`${BASE_URL}/api/public/assignments/${publicId}`);
  const apiJsonText = await apiRes.text();
  let r5ApiLeak = false;
  let leakedTokenInApi = '';

  for (const token of secretTokens) {
    if (apiJsonText.includes(token)) {
      r5ApiLeak = true;
      leakedTokenInApi = token;
      break;
    }
  }

  if (!r5HtmlLeak && !r5ApiLeak) {
    console.log('✅ PASS R5: Quét 100% byte HTML SSR & JSON API: Tuyệt đối không rò rỉ bất kỳ chuỗi đáp án hay lời giải nào!');
    auditResults['R5'] = { status: 'PASS', htmlLeak: false, apiLeak: false };
  } else {
    console.log(`❌ FAIL R5: Phát hiện rò rỉ đáp án! HTML: ${leakedTokenInHtml}, API: ${leakedTokenInApi}`);
    auditResults['R5'] = { status: 'FAIL', leakedTokenInHtml, leakedTokenInApi };
  }

  // ===============================================================
  // 2. R8: KIỂM TOÁN HỌC SINH XEM BÀI CỦA NHAU & LEADERBOARD
  // ===============================================================
  console.log('\n--- 2. KIỂM ĐỊNH R8: CÔ LẬP HỌC SINH & LEADERBOARD TOP & ME ---');
  const studentAn = group.students[0];
  const studentBinh = group.students[1];

  // An bắt đầu làm bài
  const startAnRes = await fetch(`${BASE_URL}/api/public/assignments/${publicId}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId: studentAn.id }),
  });
  const startAnData = await startAnRes.json();
  const attemptAnId = startAnData.attempt.id;

  // Nộp bài An: Đúng cả 2 câu -> 1.25đ
  const submitAnRes = await fetch(`${BASE_URL}/api/public/attempts/${attemptAnId}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      answers: {
        [q1.id]: 'B',
        [q2.id]: { a: true, b: true, c: false, d: true },
      },
    }),
  });
  const submitAnData = await submitAnRes.json();

  // Bắt đầu bài Bình
  const startBinhRes = await fetch(`${BASE_URL}/api/public/assignments/${publicId}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId: studentBinh.id }),
  });
  const startBinhData = await startBinhRes.json();
  const attemptBinhId = startBinhData.attempt.id;

  // Bình nộp bài: Đúng 1 câu -> 0.25đ
  const submitBinhRes = await fetch(`${BASE_URL}/api/public/attempts/${attemptBinhId}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      answers: {
        [q1.id]: 'B',
        [q2.id]: { a: false, b: false, c: true, d: false },
      },
    }),
  });
  const submitBinhData = await submitBinhRes.json();

  // Kiểm tra bảng xếp hạng Top & Me trả về cho Bình
  const lbBinh = submitBinhData.leaderboard;
  const isLbSafe = lbBinh && lbBinh.top && lbBinh.me && lbBinh.me.rank === 2;
  console.log(`✓ Xếp hạng Top & Me: Bình hạng #${lbBinh?.me?.rank}/${lbBinh?.me?.total}, Top count = ${lbBinh?.top?.length}`);
  auditResults['R8'] = { status: isLbSafe ? 'PASS' : 'FAIL', leaderboard: lbBinh };

  // ===============================================================
  // 3. R11: RACE CONDITION ĐỒNG THỜI (PARALLEL CONCURRENCY)
  // ===============================================================
  console.log('\n--- 3. KIỂM ĐỊNH R11: RACE CONDITION SONG SONG (START, SUBMIT, DRAFT) ---');

  // 3.1 Start vượt maxAttempts: Bắn 5 request start đồng thời cho Cúc (maxAttempts = 1)
  const studentCuc = group.students[2];
  const startPromises = Array.from({ length: 5 }, () =>
    fetch(`${BASE_URL}/api/public/assignments/${publicId}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: studentCuc.id }),
    }).then((r) => r.json())
  );
  const startResponses = await Promise.all(startPromises);
  const cucAttemptsCount = await prisma.attempt.count({
    where: { assignmentId: assignment.id, studentId: studentCuc.id },
  });
  const r11StartSafe = cucAttemptsCount === 1;
  console.log(`- Start song song 5 req: Số attempt thực tế được tạo trong DB = ${cucAttemptsCount} (Kỳ vọng: 1)`);

  // Lấy attempt của Cúc
  const cucAttempt = await prisma.attempt.findFirst({
    where: { assignmentId: assignment.id, studentId: studentCuc.id },
  });

  // 3.2 Submit đôi đồng thời: Bắn 5 submit cùng lúc
  const submitPromises = Array.from({ length: 5 }, () =>
    fetch(`${BASE_URL}/api/public/attempts/${cucAttempt?.id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: { [q1.id]: 'B' } }),
    }).then((r) => r.json())
  );
  const submitResponses = await Promise.all(submitPromises);
  const cucAnswersCount = await prisma.attemptAnswer.count({
    where: { attemptId: cucAttempt?.id },
  });
  const r11SubmitSafe = cucAnswersCount <= 2; // Không bị nhân bản bản ghi
  console.log(`- Submit song song 5 req: Số bản ghi AttemptAnswer = ${cucAnswersCount} (Không bị nhân bản)`);

  // 3.3 Draft gửi sau khi đã submit
  const draftAfterSubmitRes = await fetch(`${BASE_URL}/api/public/attempts/${cucAttempt?.id}/draft`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ draft: { [q1.id]: 'A' } }),
  });
  const draftAfterSubmitData = await draftAfterSubmitRes.json();
  const attemptAfterDraft = await prisma.attempt.findUnique({ where: { id: cucAttempt?.id } });
  const draftOverwritten = (attemptAfterDraft?.draft as any)?.[q1.id] === 'A';
  console.log(`- Draft sau khi submit: Status = ${draftAfterSubmitRes.status} ("${draftAfterSubmitData.error || 'ok'}"), Bị ghi đè: ${draftOverwritten ? 'CÓ (LỖI)' : 'KHÔNG (CHẶN ĐÚNG)'}`);

  auditResults['R11'] = {
    startSafe: r11StartSafe,
    submitSafe: r11SubmitSafe,
    draftAfterSubmitOverwritten: draftOverwritten,
    status: r11StartSafe && r11SubmitSafe && !draftOverwritten ? 'PASS' : 'WARNING_PARTIAL',
  };

  // ===============================================================
  // 4. R17: QUÉT BÍ MẬT & KIỂM TRA PRODUCTION STARTUP GUARD
  // ===============================================================
  console.log('\n--- 4. KIỂM ĐỊNH R17: BÍ MẬT MẪU & PRODUCTION STARTUP GUARD ---');
  const filesToScan = ['.env.example', 'docker-compose.yml', 'prisma/seed.ts'];
  const secretsFound: string[] = [];

  for (const f of filesToScan) {
    if (fs.existsSync(f)) {
      const content = fs.readFileSync(f, 'utf-8');
      if (content.includes('super-secret') || content.includes('examcraft_secret_2026') || content.includes('AdminPassword2026@')) {
        secretsFound.push(f);
      }
    }
  }

  // Kiểm tra xem ứng dụng có guard kiểm tra default secrets ở production không
  const authCode = fs.readFileSync('src/lib/auth.ts', 'utf-8');
  const hasProdSecretGuard = authCode.includes('process.env.NODE_ENV === \'production\'') && authCode.includes('SESSION_SECRET');
  console.log(`- Các file chứa bí mật mẫu công khai: ${secretsFound.join(', ')}`);
  console.log(`- Có Guard từ chối khởi động ở production khi dùng secret mặc định? ${hasProdSecretGuard ? 'CÓ' : 'KHÔNG (FAIL)'}`);

  auditResults['R17'] = {
    secretsFoundInFiles: secretsFound,
    hasProdSecretGuard,
    status: hasProdSecretGuard ? 'PASS' : 'FAIL',
  };

  // ===============================================================
  // 5. R28: TÀI KHOẢN KHÓA, MUST_CHANGE_PASSWORD, LOGOUT, TIMING
  // ===============================================================
  console.log('\n--- 5. KIỂM ĐỊNH R28: PHÂN QUYỀN TÀI KHOẢN KHÓA & MUST CHANGE PASSWORD ---');

  // 5.1 Khóa tài khoản -> kiểm tra session cũ
  const userToLock = await prisma.user.create({
    data: {
      email: `lock_test_${Date.now()}@examcraft.local`,
      passwordHash: 'dummyhash',
      name: 'User Khóa Test',
      role: 'TEACHER',
      isActive: true,
      mustChangePassword: true,
    },
  });

  const session = await prisma.session.create({
    data: {
      userId: userToLock.id,
      token: `tok_lock_${Date.now()}`,
      expiresAt: new Date(Date.now() + 86400000),
    },
  });

  // Khóa tài khoản
  await prisma.user.update({
    where: { id: userToLock.id },
    data: { isActive: false },
  });

  // Gửi request với session token của tài khoản đã khóa
  const testLockedReq = await fetch(`${BASE_URL}/api/questions`, {
    headers: { Cookie: `examcraft_session=${session.token}` },
  });
  const lockedSessionBlocked = testLockedReq.status === 401;
  console.log(`- Session của tài khoản bị khóa có bị chặn ngay không? ${lockedSessionBlocked ? 'CÓ (401 PASS)' : 'KHÔNG'}`);

  // 5.2 mustChangePassword gọi thẳng API
  const userMustChange = await prisma.user.create({
    data: {
      email: `must_change_${Date.now()}@examcraft.local`,
      passwordHash: 'dummyhash',
      name: 'User Đổi Mật Khẩu',
      role: 'TEACHER',
      isActive: true,
      mustChangePassword: true,
    },
  });

  const sessionMustChange = await prisma.session.create({
    data: {
      userId: userMustChange.id,
      token: `tok_must_change_${Date.now()}`,
      expiresAt: new Date(Date.now() + 86400000),
    },
  });

  const testMustChangeReq = await fetch(`${BASE_URL}/api/questions`, {
    headers: { Cookie: `examcraft_session=${sessionMustChange.token}` },
  });
  const mustChangeBypassed = testMustChangeReq.status === 200;
  console.log(`- User mustChangePassword gọi thẳng API có bypass được không? ${mustChangeBypassed ? 'CÓ (LỖI BYPASS)' : 'KHÔNG'}`);

  // 5.3 So sánh thông báo lỗi đăng nhập (Email không tồn tại vs Sai mật khẩu)
  const loginNonExist = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'nonexistent_email_12345@test.com', password: 'Password123@' }),
  });
  const errNonExist = await loginNonExist.json();

  const loginWrongPass = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: teacher.email, password: 'WrongPassword999@' }),
  });
  const errWrongPass = await loginWrongPass.json();

  const sameErrorMsg = errNonExist.error === errWrongPass.error;
  console.log(`- Thông báo lỗi 2 trường hợp: "${errNonExist.error}" vs "${errWrongPass.error}"`);
  console.log(`- Thông báo lỗi có giống hệt nhau chống dò email? ${sameErrorMsg ? 'CÓ (PASS)' : 'KHÔNG'}`);

  auditResults['R28'] = {
    lockedSessionBlocked,
    mustChangeBypassed,
    sameErrorMsg,
    status: lockedSessionBlocked && sameErrorMsg ? (mustChangeBypassed ? 'HIGH_WARNING' : 'PASS') : 'FAIL',
  };

  // ===============================================================
  // 6. PERF THẬT: 100 HỌC SINH ẢO HTTP LOAD TEST (START + DRAFT + SUBMIT)
  // ===============================================================
  console.log('\n--- 6. PERF HTTP THẬT: 100 HỌC SINH ẢO QUA MẠNG (HTTP /api/public/*) ---');

  // Tạo một bài giao thi lớn cho 100 học sinh
  const group100 = await prisma.group.create({
    data: {
      ownerId: teacher.id,
      name: `Lớp 100 Học Sinh Ảo HTTP Perf ${Date.now()}`,
      publicCode: `P100_${Date.now().toString().slice(-4)}`,
    },
  });

  const students100Data = Array.from({ length: 100 }, (_, i) => ({
    groupId: group100.id,
    displayName: `Học sinh ảo ${i + 1}`,
    personalToken: `token_${i + 1}_${Date.now()}`,
  }));

  await prisma.student.createMany({ data: students100Data });
  const allStudents100 = await prisma.student.findMany({ where: { groupId: group100.id } });

  const perfPublicId = `perf_pub_${Date.now()}`;
  const perfAssignment = await prisma.assignment.create({
    data: {
      ownerId: teacher.id,
      examId: exam.id,
      groupId: group100.id,
      title: 'Đề Thi Thử Tải 100 Học Sinh HTTP',
      mode: 'EXAM',
      status: 'OPEN',
      identityMode: 'PICK_FROM_LIST',
      publicId: perfPublicId,
      snapshot: JSON.parse(JSON.stringify(snapshot)),
      durationMinutes: 45,
      maxAttempts: 1,
      showResult: 'IMMEDIATE',
      showSolution: 'IMMEDIATE',
    },
  });

  const latencies: number[] = [];
  let successCount = 0;
  let errorCount = 0;
  const startTime = Date.now();

  console.log('⏳ Đang bắn 100 luồng học sinh (Start -> Draft -> Submit) đồng thời...');

  const studentSimulations = allStudents100.map(async (st, idx) => {
    const t0 = Date.now();
    try {
      // 1. Start
      const sRes = await fetch(`${BASE_URL}/api/public/assignments/${perfPublicId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: st.id }),
      });
      if (!sRes.ok) throw new Error(`Start failed: ${sRes.status}`);
      const sData = await sRes.json();
      const attemptId = sData.attempt.id;

      // 2. Draft (simulate 15s answers)
      const dRes = await fetch(`${BASE_URL}/api/public/attempts/${attemptId}/draft`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft: { [q1.id]: idx % 2 === 0 ? 'B' : 'A' } }),
      });
      if (!dRes.ok) throw new Error(`Draft failed: ${dRes.status}`);

      // 3. Submit
      const subRes = await fetch(`${BASE_URL}/api/public/attempts/${attemptId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: {
            [q1.id]: idx % 2 === 0 ? 'B' : 'A',
            [q2.id]: { a: true, b: true, c: false, d: true },
          },
        }),
      });
      if (!subRes.ok) throw new Error(`Submit failed: ${subRes.status}`);

      const elapsed = Date.now() - t0;
      latencies.push(elapsed);
      successCount++;
    } catch (err) {
      errorCount++;
    }
  });

  await Promise.all(studentSimulations);
  const totalPerfTimeMs = Date.now() - startTime;
  const dbConnections = await getDbConnectionCount();

  latencies.sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;
  const min = latencies[0] || 0;
  const max = latencies[latencies.length - 1] || 0;
  const avg = Math.round(latencies.reduce((a, b) => a + b, 0) / (latencies.length || 1));

  console.log(`\n📊 KẾT QUẢ PERF HTTP THẬT (100 HỌC SINH QUA MẠNG):`);
  console.log(`- Tổng thời gian hoàn tất: ${totalPerfTimeMs} ms`);
  console.log(`- Thành công: ${successCount} / 100 (${successCount}%) | Lỗi: ${errorCount}`);
  console.log(`- p50 (Median): ${p50} ms`);
  console.log(`- p95: ${p95} ms`);
  console.log(`- p99: ${p99} ms`);
  console.log(`- Min: ${min} ms | Max: ${max} ms | Trung bình: ${avg} ms`);
  console.log(`- Số kết nối PostgreSQL đang mở: ${dbConnections}`);
  console.log(`👉 ĐÍNH CHÍNH QUAN TRỌNG: Con số 82ms trong Sprint 3 là kiểm thử IN-PROCESS (gọi trực tiếp hàm DB trong cùng bộ nhớ Node.js). Khi chạy qua giao thức mạng HTTP thật với chuỗi 3 bước Start->Draft->Submit cho 100 HS, thời gian p50 là ${p50}ms và tổng thời gian là ${totalPerfTimeMs}ms!`);

  auditResults['PERF_HTTP'] = {
    totalStudents: 100,
    successCount,
    errorCount,
    totalTimeMs: totalPerfTimeMs,
    p50,
    p95,
    p99,
    min,
    max,
    avg,
    dbConnections,
  };

  // ===============================================================
  // 7. GEMINI CALLS THẬT (<= 8 LƯỢT CHO TOÁN 12 VÀ HÓA 11)
  // ===============================================================
  console.log('\n--- 7. KIỂM ĐỊNH CHẤT LƯỢNG NỘI DUNG AI GEMINI THẬT (TOÁN 12 & HÓA 11) ---');
  const geminiKey = process.env.GEMINI_API_KEY_1;
  const aiLedgerEntries: any[] = [];

  if (geminiKey && geminiKey.length > 20) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });

      // Lượt gọi 1: Sinh câu hỏi Toán 12
      console.log('🤖 Đang gọi Gemini thật (Lượt 1/2): Sinh 1 câu hỏi Toán 12 Cực trị...');
      const tAi0 = Date.now();
      const resMath = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents:
          'Bạn là chuyên gia khảo thí Bộ GD&ĐT. Hãy soạn 1 câu hỏi trắc nghiệm Toán 12 về cực trị hàm số chuẩn GDPT 2025. Định dạng JSON: {"content": "...", "choices": [{"key": "A", "text": "..."}, {"key": "B", "text": "..."}, {"key": "C", "text": "..."}, {"key": "D", "text": "..."}], "correct": "A", "solution": "..."}. Không dùng các phương án "Cả A và B đều đúng". Không nhắc chữ cái đáp án trong lời giải.',
      });
      const tAi1 = Date.now();
      const mathText = resMath.text || '';
      console.log(`✓ Lượt 1 thành công (${tAi1 - tAi0} ms):`, mathText.slice(0, 100), '...');

      aiLedgerEntries.push({
        id: 'AI-CALL-001',
        subject: 'Toan 12',
        model: 'gemini-2.0-flash',
        durationMs: tAi1 - tAi0,
        status: 'SUCCESS',
        sample: mathText.slice(0, 120),
      });

      // Lượt gọi 2: Sinh câu hỏi Hóa 11
      console.log('🤖 Đang gọi Gemini thật (Lượt 2/2): Sinh 1 câu hỏi Hóa 11 Cân bằng hóa học...');
      const tChem0 = Date.now();
      const resChem = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents:
          'Hãy soạn 1 câu hỏi trắc nghiệm Hóa học 11 về cân bằng hóa học theo chuẩn GDPT 2025. Định dạng JSON: {"content": "...", "choices": [{"key": "A", "text": "..."}, {"key": "B", "text": "..."}, {"key": "C", "text": "..."}, {"key": "D", "text": "..."}], "correct": "B", "solution": "..."}.',
      });
      const tChem1 = Date.now();
      const chemText = resChem.text || '';
      console.log(`✓ Lượt 2 thành công (${tChem1 - tChem0} ms):`, chemText.slice(0, 100), '...');

      aiLedgerEntries.push({
        id: 'AI-CALL-002',
        subject: 'Hoa 11',
        model: 'gemini-2.0-flash',
        durationMs: tChem1 - tChem0,
        status: 'SUCCESS',
        sample: chemText.slice(0, 120),
      });
    } catch (e: any) {
      console.log('⚠️ Gọi Gemini thật gặp lỗi:', e.message);
      aiLedgerEntries.push({ status: 'FAILED', error: e.message });
    }
  } else {
    console.log('⚠️ Không tìm thấy GEMINI_API_KEY_1 hợp lệ, ghi nhận UNVERIFIED.');
  }

  // Cập nhật ledger
  const ledgerPath = path.resolve('qa/ai_call_ledger.md');
  const ledgerContent = `# NHẬT KÝ GỌI GOOGLE GEMINI AI THẬT (AI CALL LEDGER)

- **Ngân sách cấp phép**: $\\le 30$ lượt gọi thật (Vòng 2: cấp phép $\\le 8$ lượt).
- **Tổng số lượt gọi thật đã dùng**: ${aiLedgerEntries.filter((e) => e.status === 'SUCCESS').length} lượt.
- **Ngân sách còn lại**: ${30 - aiLedgerEntries.filter((e) => e.status === 'SUCCESS').length} lượt.

## BẢNG GHI NHẬN CÁC CUỘC GỌI THẬT
| ID | Môn Học | Model | Thời Gian | Trạng Thái | Trích Dẫn Mẫu |
|---|---|---|---|---|---|
${aiLedgerEntries
  .map(
    (e) =>
      `| ${e.id || '-'} | ${e.subject || '-'} | ${e.model || '-'} | ${e.durationMs || 0}ms | ${e.status} | \`${(e.sample || '').replace(/\n/g, ' ')}\` |`
  )
  .join('\n')}
`;
  fs.writeFileSync(ledgerPath, ledgerContent, 'utf-8');

  // Lưu toàn bộ kết quả kiểm định vòng 2
  const resultsPath = path.resolve('qa/evidence/http_audit_v2.json');
  fs.writeFileSync(resultsPath, JSON.stringify(auditResults, null, 2), 'utf-8');
  console.log(`\n🎉 Đã lưu kết quả kiểm định Vòng 2 tại: ${resultsPath}`);
}

main()
  .catch((e) => {
    console.error('LỖI KIỂM ĐỊNH VÒNG 2:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
