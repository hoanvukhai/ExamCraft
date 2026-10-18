import { execSync } from 'child_process';

const testSuites = [
  { name: 'Giai đoạn 1: Auth & Docker PostgreSQL', file: 'tests/test_phase1_auth.ts' },
  { name: 'Giai đoạn 2: CSDL Câu hỏi, Đề thi & 7 Gemini Keys', file: 'tests/test_phase2_db_ai.ts' },
  { name: 'Giai đoạn 3: Giao bài & Phòng thi học sinh', file: 'tests/test_phase3_student_flow.ts' },
  { name: 'Giai đoạn 4: Giám sát bài thi & Bảng điểm giáo viên', file: 'tests/test_phase4_monitoring.ts' },
  { name: 'Giai đoạn 5: Xuất file Word .docx & Định dạng A4', file: 'tests/test_phase5_word_quality.ts' },
  { name: 'Giai đoạn 6: Bảo mật, Sao lưu & Kiểm chứng toàn diện', file: 'tests/test_phase6_security_audit.ts' },
];

console.log('===============================================================');
console.log('       EXAMCRAFT v3.1 — KIỂM THỬ TỰ ĐỘNG TOÀN BỘ CÁC GIAI ĐOẠN');
console.log('===============================================================\n');

let passedCount = 0;

for (const suite of testSuites) {
  process.stdout.write(`⏳ Đang chạy: ${suite.name}... `);
  try {
    execSync(`npx tsx ${suite.file}`, { stdio: 'pipe' });
    console.log('✅ ĐẠT (100%)');
    passedCount++;
  } catch (err: any) {
    console.log('❌ THẤT BẠI!');
    console.error(err.stderr ? err.stderr.toString() : (err.stdout ? err.stdout.toString() : err.message));
    process.exit(1);
  }
}

console.log('\n===============================================================');
console.log(`🎉 TẤT CẢ ${passedCount}/${testSuites.length} GIAI ĐOẠN ĐÃ VƯỢT QUA KIỂM THỬ XUẤT SẮC!`);
console.log('===============================================================');
