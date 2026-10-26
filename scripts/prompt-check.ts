// Offline check of the exam-generation prompt. No server, no database, no provider key.
//   node --import tsx scripts/prompt-check.ts export <dir>   writes cases.json and one <id>.prompt.json per case
//   node --import tsx scripts/prompt-check.ts check <dir>    reads <id>.output.json (the model's raw reply) and runs the app's own validator
// A person or another model answers each prompt; this only tells whether the reply would be accepted by the app, not whether the content is right.
import fs from 'node:fs';
import path from 'node:path';
import { generationPlanSchema, validateGeneratedExam, type GenerationPlan } from '../src/lib/generation-plan';
import { buildGenerationPrompt } from '../src/lib/generation-prompt';
import { readProviderJson } from '../src/lib/gemini-keys';

type Case = { id: string; examType: string; plan: Record<string, unknown> };
const kind = (mc: number, tf: number, sa: number, essay: number) => ({ numMultipleChoice: mc, numTrueFalse: tf, numShortAnswer: sa, numEssay: essay });

// One case per grade, then the exam types a teacher names in the request. The app has no exam-type field: the type is written in the topic and instructions.
const grade = (g: number, subject: string, topic: string, mix = kind(3, 0, 1, 0)): Case => ({ id: `lop${g}-${subject}`, examType: 'Kiểm tra thường kỳ', plan: { subject, grade: g, topic, durationMinutes: 20, ...mix } });
const special = (id: string, examType: string, g: number, subject: string, topic: string, instructions: string, mix: ReturnType<typeof kind>, minutes = 45): Case => ({ id, examType, plan: { subject, grade: g, topic, durationMinutes: minutes, customInstructions: instructions, ...mix } });
const cases: Case[] = [
  grade(1, 'toan', 'Phép cộng, phép trừ trong phạm vi 10'), grade(2, 'tieng_viet', 'Từ chỉ sự vật và câu giới thiệu'), grade(3, 'toan', 'Bảng nhân, bảng chia 6, 7'),
  grade(4, 'tieng_viet', 'Danh từ, động từ và đọc hiểu đoạn văn ngắn', kind(3, 0, 1, 1)), grade(5, 'toan', 'Phân số và số thập phân'), grade(6, 'toan', 'Phân số và các phép tính'),
  grade(7, 'khtn', 'Nguyên tử, phân tử và tốc độ chuyển động'), grade(8, 'ngu_van', 'Đọc hiểu đoạn văn tả cảnh và biện pháp tu từ', kind(3, 0, 0, 1)),
  grade(9, 'toan', 'Căn bậc hai và hàm số bậc nhất', kind(3, 1, 1, 0)), grade(10, 'hoa_hoc', 'Cấu tạo nguyên tử và bảng tuần hoàn', kind(3, 1, 1, 0)),
  grade(11, 'vat_ly', 'Dao động điều hòa', kind(3, 1, 1, 0)), grade(12, 'toan', 'Nguyên hàm và tích phân', kind(3, 1, 2, 0)),
  special('chuyencap-vao6-toan', 'Khảo sát chuyển cấp vào lớp 6', 5, 'toan', 'Số thập phân, phân số, hình học và bài toán có lời văn', 'Đề khảo sát đầu vào lớp 6, phù hợp học sinh cuối tiểu học, có phân hóa nhẹ.', kind(4, 0, 2, 1), 40),
  special('chuyencap-vao6-tiengviet', 'Khảo sát chuyển cấp vào lớp 6', 5, 'tieng_viet', 'Đọc hiểu, từ loại, câu và viết đoạn văn ngắn', 'Đề khảo sát đầu vào lớp 6, có một bài đọc hiểu.', kind(4, 0, 1, 1), 40),
  special('vao10-toan', 'Tuyển sinh vào lớp 10', 9, 'toan', 'Đại số và hình học lớp 9: phương trình, hệ phương trình, hàm số, đường tròn', 'Đề tuyển sinh vào lớp 10 có phân hóa, câu cuối khó nhất.', kind(4, 0, 3, 2), 90),
  special('vao10-nguvan', 'Tuyển sinh vào lớp 10', 9, 'ngu_van', 'Đọc hiểu văn bản và nghị luận xã hội', 'Đề tuyển sinh vào lớp 10: một phần đọc hiểu, một phần viết.', kind(4, 0, 0, 2), 120),
  special('vao10-tienganh', 'Tuyển sinh vào lớp 10', 9, 'tieng_anh', 'Ngữ pháp, từ vựng, đọc hiểu', 'Đề tuyển sinh vào lớp 10 môn Tiếng Anh.', kind(8, 0, 2, 0), 60),
  special('tnthpt-toan', 'Thi thử tốt nghiệp THPT', 12, 'toan', 'Ứng dụng đạo hàm, nguyên hàm - tích phân, hình học không gian Oxyz', 'Đề thi thử tốt nghiệp THPT: trắc nghiệm nhiều lựa chọn, đúng/sai và trả lời ngắn như cấu trúc đề từ 2025.', kind(6, 2, 3, 0), 90),
  special('tnthpt-vatly', 'Thi thử tốt nghiệp THPT', 12, 'vat_ly', 'Dao động, sóng, điện xoay chiều', 'Đề thi thử tốt nghiệp THPT: trắc nghiệm nhiều lựa chọn, đúng/sai và trả lời ngắn.', kind(6, 2, 3, 0), 50),
  special('tnthpt-tienganh', 'Thi thử tốt nghiệp THPT', 12, 'tieng_anh', 'Ngữ pháp, từ vựng, đọc hiểu, giao tiếp', 'Đề thi thử tốt nghiệp THPT môn Tiếng Anh, toàn trắc nghiệm.', kind(10, 0, 0, 0), 50),
  special('dai-hoc-nangluc-toan', 'Luyện thi đánh giá năng lực vào đại học', 12, 'toan', 'Giải tích, đại số và hình học tổng hợp', 'Đề luyện thi đánh giá năng lực vào đại học, câu hỏi tư duy, không lặp đề tốt nghiệp.', kind(8, 0, 2, 0), 60),
  special('hsg-toan9', 'Học sinh giỏi', 9, 'toan', 'Số học, bất đẳng thức, hình học nâng cao', 'Đề học sinh giỏi cấp huyện, câu khó và câu chứng minh.', kind(0, 0, 2, 3), 150),
  special('hsg-hoahoc12', 'Học sinh giỏi', 12, 'hoa_hoc', 'Cân bằng hóa học, điện phân, hóa hữu cơ', 'Đề học sinh giỏi cấp tỉnh, câu tính toán nhiều bước.', kind(0, 0, 3, 2), 180),
  special('giuaky1-khtn6', 'Giữa kì I', 6, 'khtn', 'Các phép đo, chất và sự biến đổi của chất', 'Đề giữa học kì I, theo ma trận nhận biết - thông hiểu - vận dụng.', kind(6, 0, 1, 1), 45),
  special('cuoiky2-tienviet4', 'Cuối kì II', 4, 'tieng_viet', 'Đọc hiểu, luyện từ và câu, tập làm văn', 'Đề cuối học kì II có bài đọc hiểu ngắn.', kind(5, 0, 2, 1), 40),
];

const [command, dir] = process.argv.slice(2);
if (!command || !dir) throw new Error('usage: prompt-check.ts export|check <dir>');
fs.mkdirSync(dir, { recursive: true });

if (command === 'export') {
  const planned = cases.map(item => ({ ...item, plan: generationPlanSchema.parse(item.plan) }));
  fs.writeFileSync(path.join(dir, 'cases.json'), JSON.stringify(planned, null, 2));
  for (const item of planned) fs.writeFileSync(path.join(dir, `${item.id}.prompt.json`), JSON.stringify({ id: item.id, examType: item.examType, ...buildGenerationPrompt({ plan: item.plan }), responseMimeType: 'application/json', temperature: 0.4 }, null, 2));
  console.log(`${planned.length} prompts written to ${dir}`);
} else if (command === 'check') {
  const planned = JSON.parse(fs.readFileSync(path.join(dir, 'cases.json'), 'utf8')) as { id: string; examType: string; plan: GenerationPlan }[];
  const rows: string[] = ['| Mã | Loại kỳ thi | Kết quả | Ghi chú |', '|---|---|---|---|'];
  let ok = 0, missing = 0;
  for (const item of planned) {
    const file = path.join(dir, `${item.id}.output.json`);
    if (!fs.existsSync(file)) { missing++; rows.push(`| ${item.id} | ${item.examType} | CHƯA CÓ | Chưa có tệp ${item.id}.output.json |`); continue; }
    try {
      // The app asks the provider for pure JSON; a chat model often adds a code fence, which is a difference of the test setup, not of the prompt.
      const raw = fs.readFileSync(file, 'utf8').trim(), fenced = /^```/.test(raw);
      const exam = validateGeneratedExam(readProviderJson(fenced ? raw.replace(/^```\w*\s*/, '').replace(/\s*```$/, '') : raw), item.plan);
      const thin = exam.questions.filter(q => !q.step_by_step_solution.trim()).length;
      ok++; rows.push(`| ${item.id} | ${item.examType} | ĐẠT | ${exam.questions.length} câu${thin ? `; ${thin} câu chưa có lời giải` : ''}${fenced ? '; có bọc ``` (bỏ qua)' : ''} |`);
    } catch (error) { rows.push(`| ${item.id} | ${item.examType} | KHÔNG ĐẠT | ${(error instanceof Error ? error.message : String(error)).replace(/\s+/g, ' ').replace(/\|/g, '/').slice(0, 300)} |`); }
  }
  const report = `# Kết quả kiểm lời nhắc sinh đề\n\nĐạt ${ok}/${planned.length}; chưa có ${missing}. Chỉ cho biết bộ kiểm tra của ứng dụng có nhận câu trả lời hay không; nội dung đúng sai và độ khó cần giáo viên xem.\n\n${rows.join('\n')}\n`;
  fs.writeFileSync(path.join(dir, 'KET_QUA.md'), report);
  console.log(report);
} else throw new Error('unknown command ' + command);
