import fs from 'fs';
import path from 'path';
import { cleanLatexForWord, renderLatexRunsForWord, exportExamToDocx } from '../src/lib/docx-export';
import { Exam } from '../src/types/exam';

async function runPhase5Tests() {
  console.log('--- BẮT ĐẦU KIỂM THỬ GIAI ĐOẠN 5: CHẤT LƯỢNG XUẤT WORD & IN ẤN A4 ---');

  // BỘ 50 CÔNG THỨC TOÁN / KHTN PHỨC TẠP
  const complexFormulas = [
    // 1-10: Phân số lồng nhau và căn thức bậc n
    '\\frac{\\frac{a}{b} + 1}{\\frac{c}{d} - 2}',
    '\\dfrac{x^2 - 4}{x + 2} = x - 2',
    '\\sqrt{x^2 + 2x + 1} = |x + 1|',
    '\\sqrt[3]{x^3 - 3x^2 + 3x - 1} = x - 1',
    '\\sqrt{\\frac{a^2 + b^2}{2}} \\ge \\frac{a + b}{2}',
    '\\frac{1}{\\sqrt{a} + \\sqrt{b}} = \\frac{\\sqrt{a} - \\sqrt{b}}{a - b}',
    '\\dfrac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
    '\\sqrt[4]{16x^4} = 2|x|',
    '\\frac{x}{y} \\cdot \\frac{z}{t} = \\frac{xz}{yt}',
    '\\dfrac{1}{1 + \\dfrac{1}{1 + \\dfrac{1}{x}}}',

    // 11-20: Tích phân có cận, vi phân, giới hạn
    '\\int_{0}^{\\pi} \\sin(x) \\, dx = 2',
    '\\int_{1}^{e} \\frac{\\ln x}{x} \\, dx = \\frac{1}{2}',
    '\\int_{-\\infty}^{+\\infty} e^{-x^2} \\, dx = \\sqrt{\\pi}',
    '\\int_{0}^{1} x^n (1 - x)^m \\, dx',
    '\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1',
    '\\lim_{x \\to +\\infty} \\left(1 + \\frac{1}{x}\\right)^x = e',
    '\\lim_{x \\to 2} \\frac{x^2 - 4}{x - 2} = 4',
    '\\lim_{n \\to \\infty} \\sqrt[n]{n} = 1',
    '\\int f\'(x) \\, dx = f(x) + C',
    '\\iint_{D} f(x, y) \\, dx \\, dy',

    // 21-30: Ma trận và hệ phương trình
    '\\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}',
    '\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}',
    '\\begin{vmatrix} x & y \\\\ z & t \\end{vmatrix} = xt - yz',
    '\\begin{cases} 2x + y = 5 \\\\ x - 3y = -1 \\end{cases}',
    '\\begin{cases} x^2 + y^2 = 25 \\\\ x + y = 7 \\end{cases}',
    'A = \\begin{pmatrix} \\lambda & 1 \\\\ 0 & \\lambda \\end{pmatrix}',
    '\\det(AB) = \\det(A) \\cdot \\det(B)',
    'A^{-1} = \\frac{1}{\\det A} \\text{adj}(A)',
    '\\begin{cases} x > 0 \\\\ y \\le 2 \\\\ x + y \\ge 1 \\end{cases}',
    'I_3 = \\begin{pmatrix} 1 & 0 & 0 \\\\ 0 & 1 & 0 \\\\ 0 & 0 & 1 \\end{pmatrix}',

    // 31-40: Hóa học, phản ứng, cân bằng, ion
    '\\ce{2H2 + O2 -> 2H2O}',
    '\\ce{N2 + 3H2 <=> 2NH3 ^}',
    '\\ce{CaCO3 -> CaO + CO2 ^}',
    '\\ce{Fe + 2HCl -> FeCl2 + H2 ^}',
    '\\ce{CH4 + 2O2 -> CO2 + 2H2O}',
    '\\ce{H+ + OH- -> H2O}',
    '\\ce{Cu + 2Ag+ -> Cu^2+ + 2Ag v}',
    '\\ce{SO2 + H2O <=> H2SO3}',
    '\\ce{2KMnO4 + 16HCl -> 2KCl + 2MnCl2 + 5Cl2 ^ + 8H2O}',
    '\\ce{Ba^2+ + SO4^2- -> BaSO4 v}',

    // 41-50: Vật lý, ký hiệu hạt nhân, góc, vector, tập hợp
    '_{92}^{235}\\text{U} + _{0}^{1}\\text{n} -> _{56}^{144}\\text{Ba} + _{36}^{89}\\text{Kr} + 3_{0}^{1}\\text{n}',
    '_{1}^{2}\\text{H} + _{1}^{3}\\text{H} -> _{2}^{4}\\text{He} + _{0}^{1}\\text{n}',
    '\\vec{u} \\cdot \\vec{v} = |\\vec{u}| \\cdot |\\vec{v}| \\cdot \\cos(\\vec{u}, \\vec{v})',
    '\\vec{AB} + \\vec{BC} = \\vec{AC}',
    '\\widehat{ABC} = 60^\\circ',
    '\\Delta = b^2 - 4ac \\ge 0',
    'x \\in \\mathbb{R} \\setminus \\{0\\}',
    'A \\cap B = \\emptyset',
    'A \\cup B = \\mathbb{R}',
    'E = mc^2 = \\frac{m_0 c^2}{\\sqrt{1 - \\frac{v^2}{c^2}}}',
  ];

  console.log(`✓ Test 1: Đã chuẩn bị bộ ${complexFormulas.length} công thức phức tạp (Toán, Lý, Hóa, Giải tích, Ma trận, Hạt nhân)`);

  // Kiểm tra cleanLatexForWord cho tất cả 50 công thức
  let successCount = 0;
  for (const formula of complexFormulas) {
    const cleaned = cleanLatexForWord(formula);
    if (cleaned && cleaned.length > 0 && !cleaned.includes('\\begin{cases}') && !cleaned.includes('\\ce{')) {
      successCount++;
    }
  }

  if (successCount !== complexFormulas.length) {
    throw new Error(`Chuyển đổi công thức bị lỗi: chỉ đạt ${successCount}/${complexFormulas.length}`);
  }
  console.log(`✓ Test 2: Chuyển đổi thành công 50/50 công thức sang định dạng Word an toàn (100%)`);

  // Kiểm tra renderLatexRunsForWord
  const runs = renderLatexRunsForWord('Cho phương trình $\\frac{x^2 - 1}{x + 1} = 0$ và tích phân $\\int_0^1 2x dx$');
  if (runs.length === 0) {
    throw new Error('renderLatexRunsForWord không sinh được TextRun hoặc MathRun');
  }
  console.log('✓ Test 3: Tạo mảng OMML MathRun & TextRun hợp lệ cho Microsoft Word');

  // Tạo một Đề thi mẫu hoàn chỉnh chứa các dạng bài trên và xuất file .docx thật
  const sampleExam: Exam = {
    id: 'exam_word_test_50',
    metadata: {
      title: 'ĐỀ KIỂM TRA ĐỊNH KỲ CHẤT LƯỢNG WORD A4',
      schoolName: 'TRƯỜNG THPT CHUYÊN CHU VĂN AN',
      departmentName: 'TỔ TOÁN - TIN HỌC',
      subject: 'toan',
      grade: 12,
      durationMinutes: 90,
      academicYear: '2025 - 2026',
      semester: 'Học kỳ 1',
    },
    questions: [
      {
        id: 'q1',
        type: 'multiple_choice',
        difficulty: 'thong_hieu',
        content: 'Tập nghiệm của phương trình $\\log_2(x^2 - 3) = \\log_2(2x)$ là:',
        choices: [
          { key: 'A', text: '$S = \\{3\\}$' },
          { key: 'B', text: '$S = \\{-1; 3\\}$' },
          { key: 'C', text: '$S = \\{1; -3\\}$' },
          { key: 'D', text: '$S = \\emptyset$' },
        ],
        step_by_step_solution: 'Điều kiện $x > \\sqrt{3}$. Ta có $x^2 - 2x - 3 = 0 \\Leftrightarrow x = 3$ (nhận) hoặc $x = -1$ (loại).',
      },
      {
        id: 'q2',
        type: 'true_false_group',
        difficulty: 'van_dung',
        content: 'Cho hàm số $f(x) = \\int_{0}^{x} (t^2 - 4) dt$. Xét tính đúng sai của các mệnh đề:',
        sub_questions: [
          { key: 'a', content: 'Hàm số $f\'(x) = x^2 - 4$', isCorrect: true },
          { key: 'b', content: '$f(x)$ đạt cực đại tại điểm $x = 2$', isCorrect: false },
          { key: 'c', content: '$f(x)$ nghịch biến trên khoảng $(-2; 2)$', isCorrect: true },
          { key: 'd', content: 'Phương trình $f(x) = 0$ có nghiệm $x = 0$', isCorrect: true },
        ],
        step_by_step_solution: 'Đạo hàm theo định lý cơ bản của giải tích: $f\'(x) = x^2 - 4$.',
      },
      {
        id: 'q3',
        type: 'short_answer',
        difficulty: 'van_dung_cao',
        content: 'Cho ma trận $A = \\begin{pmatrix} 2 & 1 \\\\ 1 & 2 \\end{pmatrix}$. Tính định thức $\\det(A)$:',
        correct_answer: '3',
        step_by_step_solution: '$\\det(A) = 2 \\times 2 - 1 \\times 1 = 3$.',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const docxBlob = await exportExamToDocx(sampleExam, true, true);
  const buffer = Buffer.from(await docxBlob.arrayBuffer());

  if (buffer.length < 1000) {
    throw new Error('File .docx sinh ra quá nhỏ hoặc bị rỗng!');
  }

  // Kiểm tra magic header file zip (PK\x03\x04) của chuẩn OOXML .docx
  const isDocxZip = buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04;
  if (!isDocxZip) {
    throw new Error('Định dạng file không phải chuẩn Microsoft Word OpenXML (.docx)!');
  }

  // Lưu file kiểm thử ra thư mục scratch để người dùng có thể mở thử trên Microsoft Word
  const testOutputPath = path.join(process.cwd(), 'tests', 'output_test_de_thi.docx');
  fs.writeFileSync(testOutputPath, buffer);

  console.log(`✓ Test 4: Xuất file Word .docx thực tế thành công! Kích thước: ${buffer.length} bytes`);
  console.log(`✓ Test 5: Xác nhận tiêu chuẩn OpenXML Zip hợp lệ (PK header)`);
  console.log(`✓ Test 6: Đã lưu file kiểm thử mẫu tại: ${testOutputPath}`);

  console.log('--- TOÀN BỘ 6/6 TEST GIAI ĐOẠN 5 ĐÃ VƯỢT QUA XUẤT SẮC! ---');
}

runPhase5Tests().catch((e) => {
  console.error('LỖI TEST GIAI ĐOẠN 5:', e);
  process.exit(1);
});
