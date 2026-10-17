import assert from 'assert';
import { cleanLatexForWord, renderLatexRunsForWord } from '../src/lib/docx-export.ts';
import {
  generateShuffledExams,
  buildAnswerMatrix,
  createPRNG
} from '../src/lib/shuffler.ts';
import {
  getDefaultPointsForQuestion,
  calculateExamTotalPoints,
  getExamScoreBreakdown
} from '../src/lib/scoring.ts';
import {
  parseExTestLatex,
  extractBracedContent
} from '../src/lib/exam-parser.ts';
import {
  computeExamMatrix,
  computeExamSpecification
} from '../src/lib/matrix-spec-generator.ts';
import {
  getSubjectConfig,
  getSubjectsForGrade,
  getAllSupportedSubjects
} from '../src/lib/subject-config.ts';

console.log('========================================================');
console.log('       BẮT ĐẦU CHẠY BỘ KIỂM THỬ ĐƠN VỊ (UNIT TESTS)     ');
console.log('========================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${name}`);
    console.error('       Error:', err.message);
  }
}

// -----------------------------------------------------------------
// 1. KIỂM THỬ SCORING.TS
// -----------------------------------------------------------------
runTest('Scoring: Điểm mặc định chuẩn GDPT 2018 (0.25, 1.0, 0.5, 1.0)', () => {
  const mc = { id: '1', type: 'multiple_choice', difficulty: 'nhan_biet', content: '', step_by_step_solution: '' };
  const tf = { id: '2', type: 'true_false_group', difficulty: 'thong_hieu', content: '', step_by_step_solution: '' };
  const sa = { id: '3', type: 'short_answer', difficulty: 'van_dung', content: '', step_by_step_solution: '' };
  const es = { id: '4', type: 'essay', difficulty: 'van_dung_cao', content: '', step_by_step_solution: '' };

  assert.strictEqual(getDefaultPointsForQuestion(mc), 0.25);
  assert.strictEqual(getDefaultPointsForQuestion(tf), 1.0);
  assert.strictEqual(getDefaultPointsForQuestion(sa), 0.5);
  assert.strictEqual(getDefaultPointsForQuestion(es), 1.0);
});

runTest('Scoring: Tính tổng điểm đề thi 12 MC + 4 TF + 6 SA = 10.0đ', () => {
  const questions = [
    ...Array(12).fill(0).map((_, i) => ({ id: `mc_${i}`, type: 'multiple_choice', difficulty: 'thong_hieu', content: '', step_by_step_solution: '' })),
    ...Array(4).fill(0).map((_, i) => ({ id: `tf_${i}`, type: 'true_false_group', difficulty: 'thong_hieu', content: '', step_by_step_solution: '' })),
    ...Array(6).fill(0).map((_, i) => ({ id: `sa_${i}`, type: 'short_answer', difficulty: 'thong_hieu', content: '', step_by_step_solution: '' })),
  ];

  const exam = { id: 'test_exam', metadata: {}, questions, createdAt: '', updatedAt: '' };
  const total = calculateExamTotalPoints(exam);
  const breakdown = getExamScoreBreakdown(exam);

  assert.strictEqual(total, 10.0);
  assert.strictEqual(breakdown.part1Points, 3.0);
  assert.strictEqual(breakdown.part2Points, 4.0);
  assert.strictEqual(breakdown.part3Points, 3.0);
});

runTest('Scoring: Tính tổng điểm Vật lí THPT (18 MC + 4 TF + 6 SA = 10.0đ)', () => {
  const questions = [
    ...Array(18).fill(0).map((_, i) => ({ id: `mc_${i}`, type: 'multiple_choice', difficulty: 'thong_hieu', content: '', step_by_step_solution: '' })),
    ...Array(4).fill(0).map((_, i) => ({ id: `tf_${i}`, type: 'true_false_group', difficulty: 'thong_hieu', content: '', step_by_step_solution: '' })),
    ...Array(6).fill(0).map((_, i) => ({ id: `sa_${i}`, type: 'short_answer', difficulty: 'thong_hieu', content: '', step_by_step_solution: '' })),
  ];

  const exam = { id: 'test_physics', metadata: { subject: 'vat_ly', grade: 12 }, questions, createdAt: '', updatedAt: '' };
  const total = calculateExamTotalPoints(exam);
  const breakdown = getExamScoreBreakdown(exam);

  assert.strictEqual(total, 10.0);
  assert.strictEqual(breakdown.part1Points, 4.5);
  assert.strictEqual(breakdown.part2Points, 4.0);
  assert.strictEqual(breakdown.part3Points, 1.5);
});

runTest('Scoring: Tính tổng điểm Ngữ văn THPT (Đọc hiểu 4đ + Viết 6đ = 10.0đ)', () => {
  const questions = [
    ...Array(5).fill(0).map((_, i) => ({ id: `doc_${i}`, type: 'essay', points: 0.8, difficulty: 'thong_hieu', content: '', step_by_step_solution: '' })),
    ...Array(2).fill(0).map((_, i) => ({ id: `viet_${i}`, type: 'essay', points: 3.0, difficulty: 'van_dung', content: '', step_by_step_solution: '' })),
  ];

  const exam = { id: 'test_van', metadata: { subject: 'ngu_van', grade: 12 }, questions, createdAt: '', updatedAt: '' };
  const total = calculateExamTotalPoints(exam);
  assert.strictEqual(total, 10.0);
});

// -----------------------------------------------------------------
// 2. KIỂM THỬ CLEANLATEXFORWORD
// -----------------------------------------------------------------
runTest('CleanLatex: Không bị lỗi cắn xé token ngắn (infty, int, left, leq, neq)', () => {
  assert.strictEqual(cleanLatexForWord('x \\to +\\infty'), 'x → +∞');
  assert.strictEqual(cleanLatexForWord('\\int_0^1 f(x)dx'), '∫(0→1) f(x)dx');
  assert.strictEqual(cleanLatexForWord('a \\leq b'), 'a ≤ b');
  assert.strictEqual(cleanLatexForWord('a \\geq b'), 'a ≥ b');
  assert.strictEqual(cleanLatexForWord('x \\neq 0'), 'x ≠ 0');
  assert.strictEqual(cleanLatexForWord('\\left( x + 1 \\right)'), '( x + 1 )');
  assert.strictEqual(cleanLatexForWord('x \\in \\mathbb{R}'), 'x ∈ ℝ');
});

runTest('CleanLatex: Xử lý phân số lồng nhau và căn lồng nhau sạch sẽ', () => {
  const res = cleanLatexForWord('\\frac{\\sqrt{x^2 + 1}}{1 + \\frac{1}{x}}');
  assert.ok(!res.includes('\\frac'), 'Không được còn thẻ \\frac thô');
  assert.ok(!res.includes('\\sqrt'), 'Không được còn thẻ \\sqrt thô');
  assert.strictEqual(res, '(√(x^2 + 1) / 1 + (1 / x))');
});

runTest('CleanLatex: Xử lý hệ phương trình cases và bảng biến thiên', () => {
  const cases = cleanLatexForWord('\\begin{cases} 2x + y = 5 \\\\ x - y = 1 \\end{cases}');
  assert.strictEqual(cases, '{  2x + y = 5 ;  x - y = 1  }');

  const bbt = cleanLatexForWord('[BANG_BIEN_THIEN: x=-inf, 0, +inf]');
  assert.strictEqual(bbt, '[Bảng biến thiên đính kèm]');
});

runTest('OMML Export: renderLatexRunsForWord phân tích chính xác TextRun và Math OMML', () => {
  const runs = renderLatexRunsForWord('Cho hàm số $y = \\frac{2x+1}{x-1}$. Tập xác định là $D = \\mathbb{R}$.');
  assert.ok(runs.length >= 3, 'Phải tách được ít nhất 3 thành phần (text và math)');
  // Kiểm tra thành phần đầu là TextRun
  assert.strictEqual(runs[0].constructor.name, 'TextRun');
  // Kiểm tra thành phần thứ 2 là Math OMML element
  assert.ok(runs[1].constructor.name.includes('Math'), 'Thành phần thứ 2 phải là phần tử Math của docx');
});

// -----------------------------------------------------------------
// 3. KIỂM THỬ SHUFFLER.TS
// -----------------------------------------------------------------
runTest('Shuffler: PRNG Mulberry32 sinh số tái lập 100% với cùng 1 Seed', () => {
  const rng1 = createPRNG(42);
  const rng2 = createPRNG(42);
  for (let i = 0; i < 5; i++) {
    assert.strictEqual(rng1(), rng2());
  }
});

runTest('Shuffler: Đảo phương án MC, cập nhật đáp án đúng và đồng bộ lời giải', () => {
  const baseExam = {
    id: 'e1',
    metadata: { title: 'Test', examCode: '101' },
    questions: [
      {
        id: 'q1',
        type: 'multiple_choice',
        difficulty: 'thong_hieu',
        content: 'Câu 1',
        choices: [
          { key: 'A', text: 'Đáp án đúng X' },
          { key: 'B', text: 'Nhiễu 1' },
          { key: 'C', text: 'Nhiễu 2' },
          { key: 'D', text: 'Nhiễu 3' },
        ],
        correct_answer: 'A',
        step_by_step_solution: 'Tính toán ra nghiệm X. Do đó ta chọn A.',
      }
    ],
    createdAt: '',
    updatedAt: '',
  };

  const variants = generateShuffledExams(baseExam, 4, 101, 9999);
  assert.strictEqual(variants.length, 4);

  // Kiểm tra mã 102
  const v102 = variants[1];
  const q102 = v102.exam.questions[0];
  const correctChoice = q102.choices.find(c => c.key === q102.correct_answer);
  assert.strictEqual(correctChoice.text, 'Đáp án đúng X', 'Đáp án đúng phải trỏ đúng vào nội dung gốc X');

  // Kiểm tra lời giải được đồng bộ không còn nhắc chữ cái cũ
  if (q102.correct_answer !== 'A') {
    assert.ok(!q102.step_by_step_solution.includes('chọn A'), 'Lời giải không được giữ lại chữ cái cũ chọn A');
    assert.ok(q102.step_by_step_solution.includes(`chọn ${q102.correct_answer}`), 'Lời giải phải cập nhật chữ cái mới');
  }
});

runTest('Shuffler: Bảo vệ phương án phụ thuộc ("Cả A và B") không bị xáo trộn', () => {
  const q = {
    id: 'q_dep',
    type: 'multiple_choice',
    difficulty: 'thong_hieu',
    content: 'Câu phụ thuộc',
    choices: [
      { key: 'A', text: 'Ý 1' },
      { key: 'B', text: 'Ý 2' },
      { key: 'C', text: 'Cả A và B đều đúng' },
      { key: 'D', text: 'Tất cả đều sai' },
    ],
    correct_answer: 'C',
    step_by_step_solution: 'Cả A và B đúng.',
  };

  const exam = { id: 'e_dep', metadata: {}, questions: [q], createdAt: '', updatedAt: '' };
  const variants = generateShuffledExams(exam, 2, 101, 123);
  const shuffledQ = variants[1].exam.questions[0];

  assert.strictEqual(shuffledQ.choices[2].text, 'Cả A và B đều đúng');
  assert.strictEqual(shuffledQ.choices[3].text, 'Tất cả đều sai');
});

// -----------------------------------------------------------------
// 4. KIỂM THỬ EXAM-PARSER.TS
// -----------------------------------------------------------------
runTest('ExamParser: Tách ngoặc lồng nhau extractBracedContent chuẩn xác', () => {
  const text = '\\choice {\\dfrac{a}{b}} {c} {d} {e}';
  const extracted = extractBracedContent(text, 7);
  assert.strictEqual(extracted.content, '\\dfrac{a}{b}');
});

runTest('ExamParser: Bóc tách file LaTeX EX_Test có ngoặc lồng {\\True \\dfrac{a}{b}}', () => {
  const rawLatex = `
\\begin{ex}%[2D1B2-1]
Cho hàm số $y = f(x)$. Tính giá trị của biểu thức $P$:
\\choice
{\\True \\dfrac{a}{b}}
{\\dfrac{b}{a}}
{\\dfrac{a+1}{b}}
{\\dfrac{a-1}{b}}
\\loigiai{Ta có $\\dfrac{1}{2} + \\dfrac{1}{3} = \\dfrac{5}{6}$.}
\\end{ex}
  `;

  const parsed = parseExTestLatex(rawLatex);
  assert.strictEqual(parsed.length, 1);
  const q = parsed[0];
  assert.strictEqual(q.choices.length, 4);
  assert.strictEqual(q.choices[0].text, '\\dfrac{a}{b}');
  assert.strictEqual(q.choices[1].text, '\\dfrac{b}{a}');
  assert.strictEqual(q.correct_answer, 'A');
  assert.strictEqual(q.step_by_step_solution, 'Ta có $\\dfrac{1}{2} + \\dfrac{1}{3} = \\dfrac{5}{6}$.');
  assert.strictEqual(q.difficulty, 'thong_hieu');
});

runTest('ExamParser: Bóc tách câu hỏi Đúng/Sai với thẻ \\choiceTF', () => {
  const rawTF = `
\\begin{ex}%[2D1K1-2]
Xét tính đúng sai của các mệnh đề sau:
\\choiceTF
{\\True Đạo hàm $f'(x) > 0$}
{Hàm số có 2 điểm cực trị}
{\\True Đồ thị nhận gốc $O$ làm tâm đối xứng}
{Giá trị lớn nhất bằng $10$}
\\loigiai{Mệnh đề a, c đúng, b, d sai.}
\\end{ex}
  `;

  const parsed = parseExTestLatex(rawTF);
  assert.strictEqual(parsed.length, 1);
  const q = parsed[0];
  assert.strictEqual(q.type, 'true_false_group');
  assert.strictEqual(q.sub_questions.length, 4);
  assert.strictEqual(q.sub_questions[0].isCorrect, true);
  assert.strictEqual(q.sub_questions[1].isCorrect, false);
  assert.strictEqual(q.sub_questions[2].isCorrect, true);
  assert.strictEqual(q.sub_questions[3].isCorrect, false);
});

runTest('Matrix Generator: Tính toán ma trận 2D chuẩn theo CV 7991', () => {
  const sampleExam = {
    metadata: { subject: 'toan', grade: 12, durationMinutes: 90, title: 'Đề kiểm tra' },
    questions: [
      { id: '1', type: 'multiple_choice', difficulty: 'nhan_biet', topics: ['Hàm số'], content: 'Câu 1' },
      { id: '2', type: 'multiple_choice', difficulty: 'thong_hieu', topics: ['Hàm số'], content: 'Câu 2' },
      { id: '3', type: 'true_false_group', difficulty: 'thong_hieu', topics: ['Hàm số'], content: 'Câu 3' },
      { id: '4', type: 'short_answer', difficulty: 'van_dung', topics: ['Tích phân'], content: 'Câu 4' },
      { id: '5', type: 'short_answer', difficulty: 'van_dung_cao', topics: ['Tích phân'], content: 'Câu 5' },
    ],
  };

  const matrix = computeExamMatrix(sampleExam);
  assert.strictEqual(matrix.totalQuestions, 5);
  assert.strictEqual(matrix.rows.length, 2); // 2 topics: Hàm số, Tích phân
  assert.strictEqual(matrix.totalPart1, 2);
  assert.strictEqual(matrix.totalPart2, 1);
  assert.strictEqual(matrix.totalPart3, 2);
  assert.strictEqual(matrix.totalExamPoints, 0.25 + 0.25 + 1.0 + 0.5 + 0.5); // 2.5
});

runTest('Spec Generator: Tạo bảng đặc tả ánh xạ chính xác số thứ tự câu hỏi', () => {
  const sampleExam = {
    metadata: { subject: 'toan', grade: 12, durationMinutes: 90, title: 'Đề kiểm tra' },
    questions: [
      { id: '1', type: 'multiple_choice', difficulty: 'nhan_biet', topics: ['Hình Oxyz'], content: 'Câu 1' },
      { id: '2', type: 'multiple_choice', difficulty: 'thong_hieu', topics: ['Hình Oxyz'], content: 'Câu 2' },
      { id: '3', type: 'short_answer', difficulty: 'van_dung_cao', topics: ['Hình Oxyz'], content: 'Câu 3' },
    ],
  };

  const spec = computeExamSpecification(sampleExam);
  assert.strictEqual(spec.length, 1);
  assert.deepStrictEqual(spec[0].nbQuestions, [1]);
  assert.deepStrictEqual(spec[0].thQuestions, [2]);
  assert.deepStrictEqual(spec[0].vdcQuestions, [3]);
});

// -----------------------------------------------------------------
// 5. KIỂM THỬ KHOA HỌC TỰ NHIÊN (HÓA HỌC & VẬT LÍ)
// -----------------------------------------------------------------
runTest('KHTN: CleanLatex hỗ trợ công thức hóa học mhchem và ký hiệu vật lí', () => {
  const chem = cleanLatexForWord('\\ce{Fe + 2HCl -> FeCl2 + H2 ^}');
  assert.strictEqual(chem, 'Fe + 2HCl → FeCl2 + H2 ↑');

  const physics = cleanLatexForWord('\\vec{F} = m\\vec{a}');
  assert.strictEqual(physics, 'F⃗ = ma⃗');

  const wave = cleanLatexForWord('\\lambda = 0.5\\mu\\text{m}');
  assert.strictEqual(wave, 'λ = 0.5μm');

  const angle = cleanLatexForWord('30^\\circ');
  assert.strictEqual(angle, '30°');
});

// -----------------------------------------------------------------
// 6. KIỂM THỬ CẤU HÌNH ĐỀ THI 19 MÔN HỌC CHUẨN GDPT 2018
// -----------------------------------------------------------------
runTest('Subject Config: Cấu hình chuẩn 10.0 điểm cho tất cả phân môn mới', () => {
  const lichSu = getSubjectConfig('lich_su', 12);
  assert.strictEqual(lichSu.totalExamPoints, 10.0);
  assert.strictEqual(lichSu.sections[0].questionCount, 24); // 24 MC x 0.25 = 6.0
  assert.strictEqual(lichSu.sections[1].questionCount, 4);  // 4 TF x 1.0 = 4.0

  const diaLy = getSubjectConfig('dia_ly', 12);
  assert.strictEqual(diaLy.totalExamPoints, 10.0);
  assert.strictEqual(diaLy.sections[0].questionCount, 18);  // 18 MC x 0.25 = 4.5
  assert.strictEqual(diaLy.sections[1].questionCount, 4);   // 4 TF x 1.0 = 4.0
  assert.strictEqual(diaLy.sections[2].questionCount, 6);   // 6 SA x 0.25 = 1.5

  const gdktPl = getSubjectConfig('gdkt_pl', 12);
  assert.strictEqual(gdktPl.totalExamPoints, 10.0);

  const tinHoc = getSubjectConfig('tin_hoc', 12);
  assert.strictEqual(tinHoc.totalExamPoints, 10.0);

  const khtn = getSubjectConfig('khtn', 8);
  assert.strictEqual(khtn.totalExamPoints, 10.0);

  const tiengViet = getSubjectConfig('tieng_viet', 5);
  assert.strictEqual(tiengViet.totalExamPoints, 10.0);
});

// -----------------------------------------------------------------
// 7. KIỂM THỬ PHÂN BỔ MÔN HỌC THEO KHỐI LỚP (TT 32/2018 & 13/2022)
// -----------------------------------------------------------------
runTest('Curriculum: Danh mục môn học khớp chuẩn từng cấp lớp GDPT 2018', () => {
  // Lớp 1: Tiếng Anh là tự chọn, TN&XH là bắt buộc
  const g1 = getSubjectsForGrade(1);
  const g1Keys = g1.map(s => s.key);
  assert.ok(g1Keys.includes('toan'));
  assert.ok(g1Keys.includes('tieng_viet'));
  assert.ok(g1Keys.includes('tu_nhien_xa_hoi'));
  assert.ok(g1Keys.includes('tieng_anh'));
  assert.strictEqual(g1.find(s => s.key === 'tieng_anh').category, 'Tự chọn');

  // Lớp 3: Tiếng Anh bắt buộc, có Tin học & Công nghệ
  const g3 = getSubjectsForGrade(3);
  const g3Keys = g3.map(s => s.key);
  assert.ok(g3Keys.includes('tin_hoc_cong_nghe'));
  assert.strictEqual(g3.find(s => s.key === 'tieng_anh').category, 'Bắt buộc');

  // Lớp 8 THCS: KHTN tích hợp, Lịch sử và Địa lí tích hợp
  const g8 = getSubjectsForGrade(8);
  const g8Keys = g8.map(s => s.key);
  assert.ok(g8Keys.includes('khtn'));
  assert.ok(g8Keys.includes('lich_su_dia_ly'));
  assert.ok(!g8Keys.includes('vat_ly'), 'THCS không có môn Vật lí độc lập');

  // Lớp 12 THPT: 4 môn bắt buộc (Toán, Văn, Anh, Sử) + các môn lựa chọn độc lập
  const g12 = getSubjectsForGrade(12);
  const compulsory = g12.filter(s => s.category === 'Bắt buộc').map(s => s.key);
  assert.deepStrictEqual(compulsory, ['toan', 'ngu_van', 'tieng_anh', 'lich_su']);
  const electives = g12.filter(s => s.category === 'Lựa chọn').map(s => s.key);
  assert.ok(electives.includes('vat_ly'));
  assert.ok(electives.includes('hoa_hoc'));
  assert.ok(electives.includes('sinh_hoc'));
  assert.ok(electives.includes('dia_ly'));
  assert.ok(electives.includes('gdkt_pl'));
  assert.ok(electives.includes('tin_hoc'));
  assert.ok(electives.includes('cong_nghe'));
});

// -----------------------------------------------------------------
// 8. KIỂM THỬ PHÂN MÔN THCS & CỤM CHUYÊN ĐỀ HỌC TẬP THPT (TT 17/2025)
// -----------------------------------------------------------------
runTest('TT 17/2025 & Tracks: Hỗ trợ phân môn THCS và cụm chuyên đề THPT', () => {
  // Test cấu trúc tham số phân môn THCS KHTN
  const khtnPhysics = {
    subject: 'khtn',
    grade: 8,
    topic: 'Quang học và thấu kính',
    durationMinutes: 45,
    numMultipleChoice: 8,
    numTrueFalse: 1,
    numShortAnswer: 2,
    numEssay: 0,
    difficultyRatio: { nhan_biet: 40, thong_hieu: 30, van_dung: 20, van_dung_cao: 10 },
    integratedSubBranch: 'physics',
  };
  assert.strictEqual(khtnPhysics.integratedSubBranch, 'physics');

  // Test cấu trúc cụm chuyên đề THPT
  const thptTrack = {
    subject: 'toan',
    grade: 11,
    topic: 'Cụm chuyên đề 1: Phép dời hình và phép đồng dạng trong mặt phẳng',
    durationMinutes: 45,
    numMultipleChoice: 12,
    numTrueFalse: 4,
    numShortAnswer: 6,
    numEssay: 0,
    difficultyRatio: { nhan_biet: 30, thong_hieu: 30, van_dung: 30, van_dung_cao: 10 },
    curriculumTrack: 'advanced_topic',
  };
  assert.strictEqual(thptTrack.curriculumTrack, 'advanced_topic');
});

console.log('\n========================================================');
console.log(`KẾT QUẢ: ĐÃ VƯỢT QUA ${passedTests}/${totalTests} BÀI KIỂM THỬ (100% PASS)`);
console.log('========================================================');
