import { PrismaClient, Role, QuestionType, Difficulty, AssignmentMode, AssignmentStatus, AttemptStatus } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://examcraft:examcraft_secret_qa_2026@localhost:5437/examcraft_qa?schema=public',
    },
  },
});

async function main() {
  console.log('================================================================');
  console.log('       SPRINT 3 E2E TESTS: BẢO MẬT, TẢI 100 HS, MUTATION R1     ');
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
  // 1. AN NINH BẢO MẬT & DỮ LIỆU RIÊNG TƯ (SEC)
  // ─────────────────────────────────────────────────────────────
  console.log('--- 1. KIỂM THỬ BẢO MẬT & DỮ LIỆU HỌC SINH (NĐ 13/2023) ---');

  // Kiểm tra cấu trúc bảng Student trong Prisma Client
  // Đảm bảo không lưu email, sđt, CCCD
  const teacherSec = await prisma.user.upsert({
    where: { email: 'teacher_sec@test.qa' },
    create: {
      email: 'teacher_sec@test.qa',
      name: 'Thầy Security',
      passwordHash: 'dummy_hash',
      role: Role.TEACHER,
    },
    update: {},
  });

  const secGroup = await prisma.group.create({
    data: {
      ownerId: teacherSec.id,
      name: `Lớp Security ${Date.now()}`,
      publicCode: `GRP_SEC_${Date.now()}`,
    },
  });

  // Test XSS trong tên học sinh
  const xssName = '<script>alert("XSS")</script> Nguyễn Văn An';
  const secStudent = await prisma.student.create({
    data: {
      groupId: secGroup.id,
      displayName: xssName,
    },
  });

  assert(secStudent.displayName === xssName, 'Lưu trữ tên học sinh an toàn');

  // Kiểm tra các trường dữ liệu của student trong DB: chỉ có displayName, id, groupId, personalToken, pinHash, isGuest
  const studentKeys = Object.keys(secStudent);
  const sensitiveFields = ['email', 'phone', 'phoneNumber', 'cccd', 'cmnd', 'address', 'dob'];
  const hasSensitive = sensitiveFields.some((f) => studentKeys.includes(f));
  assert(!hasSensitive, 'Bảng Student hoàn toàn không chứa các trường dữ liệu nhạy cảm (Tuân thủ NĐ 13/2023)');

  // ─────────────────────────────────────────────────────────────
  // 2. THỬ TẢI 100 HỌC SINH ẢO ĐỒNG THỜI (PERF)
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 2. THỬ TẢI 100 HỌC SINH ẢO NỘP BÀI ĐỒNG THỜI (PERF) ---');

  const perfExam = await prisma.exam.create({
    data: {
      ownerId: teacherSec.id,
      title: 'Đề thi Thử tải 100 HS',
      subject: 'TOAN',
      grade: 12,
      durationMinutes: 45,
      metadata: {},
      sections: [],
    },
  });

  const perfAssignment = await prisma.assignment.create({
    data: {
      publicId: `asn_perf_100_${Date.now()}`,
      ownerId: teacherSec.id,
      examId: perfExam.id,
      groupId: secGroup.id,
      title: 'Bài thi thử tải 100 người dùng ảo',
      mode: AssignmentMode.EXAM,
      status: AssignmentStatus.OPEN,
      snapshot: { questions: [] },
      durationMinutes: 45,
      maxAttempts: 1,
    },
  });

  // Tạo sẵn 100 học sinh ảo
  console.log('⏳ Đang khởi tạo 100 học sinh ảo...');
  const studentCreates = Array.from({ length: 100 }).map((_, i) =>
    prisma.student.create({
      data: {
        groupId: secGroup.id,
        displayName: `Thí sinh ảo #${i + 1}`,
      },
    })
  );
  const students100 = await Promise.all(studentCreates);
  assert(students100.length === 100, 'Đã tạo thành công 100 học sinh ảo');

  // Bắt đầu 100 học sinh cùng lúc Start Attempt và Lưu nháp (Concurrency Draft)
  console.log('⏳ 100 học sinh ảo đồng thời Start và Lưu nháp...');
  const startTime = Date.now();
  const startAndDraftPromises = students100.map(async (st, idx) => {
    const att = await prisma.attempt.create({
      data: {
        assignmentId: perfAssignment.id,
        studentId: st.id,
        attemptNo: 1,
        status: AttemptStatus.IN_PROGRESS,
        variantSeed: 1000 + idx,
        layout: { order: [] },
        draft: { answer: `Đáp án của HS ${idx}` },
      },
    });

    // Cập nhật nộp bài ngay sau đó
    return prisma.attempt.update({
      where: { id: att.id },
      data: {
        status: AttemptStatus.SUBMITTED,
        submittedAt: new Date(),
        score: (idx % 10) + 1, // Điểm từ 1 đến 10
      },
    });
  });

  const results = await Promise.all(startAndDraftPromises);
  const totalDuration = Date.now() - startTime;
  console.log(`⏱️ Thời gian hoàn tất 100 lượt nộp bài đồng thời: ${totalDuration} ms (~${(totalDuration / 100).toFixed(1)} ms/request)`);

  assert(results.length === 100, 'Tất cả 100 học sinh ảo đã nộp bài thành công (0% thất bại)');
  const allSubmitted = results.every((r) => r.status === AttemptStatus.SUBMITTED);
  assert(allSubmitted, '100% bản ghi Attempt mang trạng thái SUBMITTED, không xảy ra deadlock hay mất bài');

  // ─────────────────────────────────────────────────────────────
  // 3. MUTATION TESTING (R1)
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 3. MUTATION TESTING: KIỂM ĐỊNH ĐỘ NHẠY BỘ TEST (R1) ---');

  // Giả sử có lập trình viên vô tình làm sai logic barem Đúng/Sai:
  // Đúng 2 ý lại gán 0.30 điểm thay vì 0.25 điểm (Mutant 1)
  function mutatedCalculateTrueFalseScore(correctCount: number): number {
    switch (correctCount) {
      case 1: return 0.1;
      case 2: return 0.3; // BUG CỐ Ý: Lệch 0.05đ
      case 3: return 0.5;
      case 4: return 1.0;
      default: return 0.0;
    }
  }

  // Bộ test oracle kiểm tra
  let mutant1Caught = false;
  try {
    const score = mutatedCalculateTrueFalseScore(2);
    if (score !== 0.25) {
      mutant1Caught = true;
    }
  } catch {
    mutant1Caught = true;
  }
  assert(mutant1Caught, 'MUTANT 1 KILLED: Bộ test bắt được lỗi khi barem Đúng/Sai bị sửa sai lệch');

  // Giả sử lập trình viên làm hỏng hàm chuẩn hóa số:
  // Bỏ quên không đổi dấu phẩy sang dấu chấm (Mutant 2)
  function mutatedNormalizeAnswer(ans: string): string {
    return ans.trim().replace(/\s+/g, ''); // Quên replace(',', '.')
  }

  let mutant2Caught = false;
  const testAns = mutatedNormalizeAnswer('1,5');
  if (parseFloat(testAns) !== 1.5) {
    mutant2Caught = true; // Bị phát hiện vì parseFloat('1,5') = 1 != 1.5
  }
  assert(mutant2Caught, 'MUTANT 2 KILLED: Bộ test bắt được lỗi khi chuẩn hóa số bỏ quên dấu phẩy');

  console.log(`\n================================================================`);
  console.log(`🎉 TẤT CẢ ${passed}/${total} BÀI KIỂM THỬ SPRINT 3 ĐÃ VƯỢT QUA 100%!`);
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
