// Writes docs/chuong-trinh-2018/DANH_MUC_GOI_THEO_MON.md from the catalog the app actually uses.
// Run again whenever src/config/education/coverage.json, fixtures or knowledge packages change.
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const coverage = JSON.parse(fs.readFileSync(path.join(root, 'src/config/education/coverage.json'), 'utf8'));
const fixtureDir = path.join(root, 'qa/ai-review/fixtures/da-mon');
const fixtures = fs.readdirSync(fixtureDir).filter(name => name.endsWith('.json')).map(name => {
  const exam = JSON.parse(fs.readFileSync(path.join(fixtureDir, name), 'utf8'));
  const meta = exam.metadata ?? exam;
  return { name, subject: meta.subject, grade: Number(meta.grade) };
});
const packages = [path.join(root, 'tests/fixtures/knowledge-package.json')].filter(fs.existsSync).map(file => {
  const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
  return { file: path.relative(root, file).replace(/\\/g, '/'), id: pkg.id, subject: pkg.subject, grade: Number(pkg.grade), status: pkg.status };
});
const commentSubjects = new Set(['dao_duc', 'tu_nhien_xa_hoi', 'am_nhac', 'mi_thuat', 'giao_duc_the_chat', 'hoat_dong_trai_nghiem', 'hoat_dong_trai_nghiem_huong_nghiep', 'giao_duc_dia_phuong']);
const electiveHigh = new Set(['vat_ly', 'hoa_hoc', 'sinh_hoc', 'dia_ly', 'gdkt_pl', 'tin_hoc', 'cong_nghe', 'am_nhac', 'mi_thuat']);
const category = (subject, grade) => subject === 'tieng_anh' && grade <= 2 ? 'Tự chọn' : grade >= 10 && electiveHigh.has(subject) ? 'Lựa chọn' : 'Bắt buộc';

const levels = [['Tiểu học', [1, 2, 3, 4, 5]], ['THCS', [6, 7, 8, 9]], ['THPT', [10, 11, 12]]];
const lines = [
  '# Danh mục môn–lớp và gói nội dung',
  '',
  `Bảng **sinh tự động** bằng \`node scripts/catalog-table.cjs\` từ \`src/config/education/coverage.json\` (danh mục ứng dụng dùng, ngày dữ liệu ${coverage.date}), gói kiến thức và đề mẫu trong repo. Không sửa tay; sửa nguồn rồi chạy lại. Phục vụ CV004, CV016, CV022, CV070.`,
  '',
  '**Người duyệt: chưa có** cho mọi ô (chủ dự án tự duyệt khi dùng). Không ô nào "đã duyệt".',
  '',
  'Ký hiệu trong ô:',
  '- `chờ duyệt` — có đầu mối tài liệu chương trình/sách trong danh mục nguồn (`readiness: needs_review`), chưa có gói nội dung.',
  '- `gói: <mã>` — có gói kiến thức nạp được (chỉ là gói kỹ thuật, trạng thái ghi kèm).',
  '- `đề mẫu` — có đề mẫu nạp được trong `qa/ai-review/fixtures/da-mon/` (dùng để kiểm nhập/xuất, **không** phải gói nội dung).',
  '- `—` — môn không có ở lớp này theo danh mục.',
  '- Môn nhận xét (`nx`) là môn đánh giá bằng nhận xét, không ép điểm số.',
  '',
];
for (const [level, grades] of levels) {
  const subjects = new Map();
  for (const row of coverage.rows) if (grades.includes(row.grade) && !subjects.has(row.subject)) subjects.set(row.subject, row.label);
  lines.push(`## ${level}`, '', `| Môn | Loại | ${grades.map(g => 'Lớp ' + g).join(' | ')} | Nguồn trong danh mục |`, `|---|---|${grades.map(() => '---').join('|')}|---|`);
  for (const [subject, label] of subjects) {
    const sources = new Set();
    const cells = grades.map(grade => {
      const row = coverage.rows.find(r => r.subject === subject && r.grade === grade);
      if (!row) return '—';
      row.programSourceIds.forEach(id => sources.add(id));
      const parts = [row.readiness === 'needs_review' ? 'chờ duyệt' : row.readiness];
      for (const pkg of packages) if (pkg.subject === subject && pkg.grade === grade) parts.push(`gói: ${pkg.id} (${pkg.status})`);
      for (const fx of fixtures) if (fx.subject === subject && fx.grade === grade) parts.push(`đề mẫu: ${fx.name}`);
      return parts.join('; ');
    });
    const kinds = [...new Set(grades.filter(g => coverage.rows.some(r => r.subject === subject && r.grade === g)).map(g => category(subject, g)))].join('/');
    lines.push(`| ${label}${commentSubjects.has(subject) ? ' (nx)' : ''} | ${kinds} | ${cells.join(' | ')} | ${[...sources].join(', ') || 'chưa có'} |`);
  }
  lines.push('');
}
const listed = new Set(coverage.rows.map(r => `${r.subject}:${r.grade}`));
const stray = fixtures.filter(fx => !listed.has(`${fx.subject}:${fx.grade}`));
lines.push(
  '## Nhánh ngoài bảng lớp',
  '',
  '- **Ngoại ngữ khác** (NN1/NN2: Anh, Nga, Nhật, Pháp, Trung Quốc, Hàn Quốc, Đức) và **Tiếng dân tộc** (Bahnar, Chăm, Êđê, Jrai, Khmer, Mông, Mnông, Thái, Raglai): chọn ngôn ngữ và chương trình/trình độ, không gán cứng theo lớp (`src/lib/education-catalog.ts`, `LANGUAGE_PACKAGES`). Trạng thái: chờ duyệt; người duyệt: chưa có.',
  '',
  '## Tổng hợp',
  '',
  `- Ô môn–lớp: ${coverage.rows.length}; gói kiến thức: ${packages.length} (${packages.map(p => `${p.id}, ${p.status}`).join('; ')}); đề mẫu: ${fixtures.length}.`,
  `- Đề mẫu theo cấp: Tiểu học ${fixtures.filter(f => f.grade <= 5).length}, THCS ${fixtures.filter(f => f.grade >= 6 && f.grade <= 9).length}, THPT ${fixtures.filter(f => f.grade >= 10).length}.`,
  ...(stray.length ? [`- Đề mẫu có môn/lớp không khớp danh mục: ${stray.map(f => `${f.name} (${f.subject}, lớp ${f.grade})`).join('; ')}.`] : []),
  '- Việc còn thiếu ở mọi ô: yêu cầu cần đạt đã đối chiếu, mục lục đúng ấn bản, bộ đề–đáp án–rubric được giáo viên duyệt (đúng như `getEducationReadiness`).',
  '',
);
const out = path.join(root, 'docs/chuong-trinh-2018/DANH_MUC_GOI_THEO_MON.md');
fs.writeFileSync(out, lines.join('\n'));
console.log('wrote', path.relative(root, out), coverage.rows.length, 'rows,', fixtures.length, 'fixtures');
