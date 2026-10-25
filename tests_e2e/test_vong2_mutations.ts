import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface Mutant {
  id: string;
  name: string;
  category: string;
  file: string;
  search: string;
  replace: string;
  description: string;
}

const mutants: Mutant[] = [
  {
    id: 'MUT-01',
    name: 'Scoring: Sửa barem Đúng/Sai từ 0.1đ thành 0.2đ',
    category: 'Chấm điểm',
    file: 'src/config/subjects/toan_thpt.json',
    search: '"progressiveScoring": [0.0, 0.1, 0.25, 0.5, 1.0]',
    replace: '"progressiveScoring": [0.0, 0.2, 0.4, 0.6, 1.0]',
    description: 'Sửa barem điểm Đúng/Sai lũy tiến trong cấu hình môn Toán'
  },
  {
    id: 'MUT-02',
    name: 'Scoring: Bỏ hàm tính điểm trong scoring.ts',
    category: 'Chấm điểm',
    file: 'src/lib/scoring.ts',
    search: 'return Math.round(total * 100) / 100;',
    replace: 'return 0;',
    description: 'Hàm calculateExamTotalPoints luôn trả về 0 điểm'
  },
  {
    id: 'MUT-03',
    name: 'Sanitize: Không lọc payload.correct khỏi đề thi học sinh',
    category: 'Bảo mật đề thi',
    file: 'src/app/api/public/assignments/[publicId]/route.ts',
    search: 'cleanPayload.choices = q.payload.choices.map((c: any) => ({',
    replace: 'cleanPayload.correct = q.payload.correct; cleanPayload.choices = q.payload.choices.map((c: any) => ({',
    description: 'Làm rò rỉ đáp án trắc nghiệm trong hàm sanitizeSnapshotForStudent'
  },
  {
    id: 'MUT-04',
    name: 'Auth Lockout: Tăng số lần thử sai tối đa từ 5 lên 50',
    category: 'Xác thực & Lockout',
    file: 'src/lib/auth.ts',
    search: 'const MAX_ATTEMPTS = 5;',
    replace: 'const MAX_ATTEMPTS = 50;',
    description: 'Làm suy yếu cơ chế chống Brute-force'
  },
  {
    id: 'MUT-05',
    name: 'Auth Bcrypt: Cho phép mọi mật khẩu đều xác thực thành công',
    category: 'Xác thực',
    file: 'src/lib/auth.ts',
    search: 'return bcrypt.compare(password, hash);',
    replace: 'return true;',
    description: 'Vô hiệu hóa kiểm tra mật khẩu'
  },
  {
    id: 'MUT-06',
    name: 'CSV Escape: Bỏ logic escape công thức nguy hiểm trong xuất CSV',
    category: 'Bảo mật CSV',
    file: 'src/app/api/teacher/assignments/[id]/export-csv/route.ts',
    search: "str = `'${str}`;",
    replace: "// str = `'${str}`;",
    description: 'Không thêm dấu nháy đơn vào trước các ô chứa =,+,-,@'
  },
  {
    id: 'MUT-07',
    name: 'IDOR: Bỏ kiểm tra ownerId trong API lấy danh sách câu hỏi',
    category: 'Phân quyền IDOR',
    file: 'src/app/api/questions/route.ts',
    search: 'ownerId: user.id,',
    replace: '// ownerId: user.id,',
    description: 'Cho phép giáo viên lấy danh sách câu hỏi của bất kỳ ai'
  },
  {
    id: 'MUT-08',
    name: 'Shuffler: Phá vỡ ánh xạ đáp án đúng khi hoán vị',
    category: 'Trộn đề',
    file: 'src/lib/shuffler.ts',
    search: "correct_answer: newCorrectKey,",
    replace: "correct_answer: 'Z',",
    description: 'Gán sai nhãn đáp án đúng sau khi trộn câu hỏi trắc nghiệm'
  },
  {
    id: 'MUT-09',
    name: 'Submit: Cho phép nộp đè lên bài thi đã SUBMITTED và reset điểm',
    category: 'Toàn vẹn bài nộp',
    file: 'src/app/api/public/attempts/[id]/submit/route.ts',
    search: 'if (attempt.status === AttemptStatus.SUBMITTED) {',
    replace: 'if (false && attempt.status === AttemptStatus.SUBMITTED) {',
    description: 'Vô hiệu hóa kiểm tra idempotent khi nộp bài'
  },
  {
    id: 'MUT-10',
    name: 'Submit Grading: Ép điểm bài nộp luôn bằng 0',
    category: 'Chấm điểm API',
    file: 'src/app/api/public/attempts/[id]/submit/route.ts',
    search: 'totalScore = Math.round(totalScore * 100) / 100;',
    replace: 'totalScore = 0;',
    description: 'Cố ý làm sai lệch điểm số nộp bài trên API'
  }
];

interface MutationResult {
  mutant: Mutant;
  status: 'KILLED' | 'SURVIVED' | 'ERROR';
  output: string;
}

async function runMutationTesting() {
  console.log('===============================================================');
  console.log('   CHIẾN DỊCH MUTATION TESTING VÒNG 2 TRÊN tests/run_all_v3_tests.ts');
  console.log('===============================================================\n');

  const results: MutationResult[] = [];
  let killedCount = 0;
  let survivedCount = 0;

  for (const m of mutants) {
    const filePath = path.resolve(m.file);
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ Không tìm thấy file: ${m.file} cho ${m.id}`);
      continue;
    }

    const originalContent = fs.readFileSync(filePath, 'utf-8');
    if (!originalContent.includes(m.search)) {
      console.log(`⚠️ Không tìm thấy target content trong ${m.file} cho ${m.id}`);
      continue;
    }

    // 1. Áp dụng mutant
    const mutatedContent = originalContent.replace(m.search, m.replace);
    fs.writeFileSync(filePath, mutatedContent, 'utf-8');

    process.stdout.write(`🔬 [${m.id}] Đang kiểm thử: ${m.name}... `);

    // 2. Chạy bộ test gốc của repo
    try {
      execSync('npx tsx tests/run_all_v3_tests.ts', { stdio: 'pipe', timeout: 30000 });
      // Nếu bộ test vẫn pass 100% -> Mutant đã sống sót (Bộ test của repo không bắt được lỗi này!)
      console.log('🔴 SURVIVED (Test pass bất chấp mutant!)');
      survivedCount++;
      results.push({ mutant: m, status: 'SURVIVED', output: 'Tests passed without error' });
    } catch (error: unknown) {
      const err = error as { stdout?: { toString(): string }; message: string };
      // Nếu bộ test bị fail -> Mutant đã bị tiêu diệt (Bộ test bắt được lỗi!)
      console.log('🟢 KILLED (Test phát hiện và chặn đứng)');
      killedCount++;
      const errMsg = err.stdout ? err.stdout.toString() : err.message;
      results.push({ mutant: m, status: 'KILLED', output: errMsg.slice(0, 150) });
    } finally {
      // 3. Khôi phục nguyên vẹn 100% file gốc ngay lập tức
      fs.writeFileSync(filePath, originalContent, 'utf-8');
    }
  }

  console.log('\n===============================================================');
  console.log(`📊 TỔNG KẾT MUTATION TESTING TRÊN BỘ TEST tests/run_all_v3_tests.ts:`);
  console.log(`- Tổng số mutant thử nghiệm: ${mutants.length}`);
  console.log(`- Số mutant bị TIÊU DIỆT (KILLED): ${killedCount} (${((killedCount / mutants.length) * 100).toFixed(1)}%)`);
  console.log(`- Số mutant SỐNG SÓT (SURVIVED): ${survivedCount} (${((survivedCount / mutants.length) * 100).toFixed(1)}%)`);
  console.log('===============================================================\n');

  // Ghi kết quả vào file evidence
  const evidencePath = path.resolve('qa/evidence/mutation_results_v2.json');
  fs.writeFileSync(evidencePath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`Đã lưu báo cáo chi tiết đột biến tại: ${evidencePath}`);
}

runMutationTesting().catch(console.error);
