import type { Exam, QuestionType } from '@/types/exam';
import { getCognitiveFramework } from './education-catalog';
import { compareExamPlan, formatHundredths } from './exam-plan';

const types: Record<QuestionType, string> = { multiple_choice: 'Lựa chọn', true_false_group: 'Đúng / sai', short_answer: 'Trả lời ngắn', essay: 'Tự luận', fill_blank: 'Điền khuyết', matching: 'Ghép nối', ordering: 'Sắp xếp' };
export interface ExamPlanOutput {
  title: string; disclaimer: string; status: string; summaries: string[]; headers: string[]; rows: string[][]; warnings: string[];
}

/** A shared plain-text projection for print/Word. Never reads answers, solutions or rubric. */
export function examPlanOutput(exam: Exam): ExamPlanOutput | null {
  if (exam.metadata.examPlan === undefined) return null;
  const base = {
    title: 'KẾ HOẠCH CÁ NHÂN — MỤC TIÊU VÀ THỰC TẾ',
    disclaimer: 'Đối chiếu nhãn do giáo viên gắn; không chứng nhận nội dung đạt yêu cầu hoặc mẫu chính thức. Đơn vị điểm 0,01; không tự chia điểm hay làm tròn điểm câu.',
  };
  try {
    const data = compareExamPlan(exam), framework = getCognitiveFramework(data.plan.frameworkId ?? undefined);
    const warnings = [...data.warnings];
    const numbers = (ids: string[]) => ids.map(id => { const index = exam.questions.findIndex(q => q.id === id); return index >= 0 ? `Câu ${index + 1}` : id; }).join(', ');
    const rows = data.rows.map((row, index) => {
      row.issues.forEach(issue => warnings.push(`Ô ${index + 1}: ${issue}`));
      const level = row.slot.cognitiveLevel === null ? 'Không gắn mức' : framework?.levels.find(item => item.id === row.slot.cognitiveLevel)?.label ?? `Mức cần rà soát: ${row.slot.cognitiveLevel}`;
      const points = !data.numeric ? 'Không tính điểm' : [
        row.slot.targetPointsHundredths === null ? 'Chưa đặt' : formatHundredths(row.slot.targetPointsHundredths),
        formatHundredths(row.knownPointsHundredths) + (row.unknownPointIds.length || row.precisionPointIds.length ? ' (chưa đủ)' : ''),
        row.pointsDeltaHundredths === null ? 'Chưa rõ' : formatHundredths(row.pointsDeltaHundredths),
      ].join(' / ');
      return [`Ô ${index + 1}: ${types[row.slot.type]} (${row.slot.type}) · ${level}`, row.outcomeText ?? (row.slot.outcomeId ? `Yêu cầu chưa có trong gói: ${row.slot.outcomeId}` : 'Không ràng buộc yêu cầu'), `${row.slot.count} / ${row.actualCount} / ${row.countDelta}`, points];
    });
    data.unmatched.forEach(item => warnings.push(`Chưa khớp ô: Câu ${item.number}. ${item.reason}`));
    data.ambiguous.forEach(item => warnings.push(`Khớp nhiều ô, chưa phân vào ô nào: Câu ${item.number} → ô ${item.slotIds.map(id => data.rows.findIndex(row => row.slot.id === id) + 1).join(', ')}.`));
    if (data.unknownPointIds.length) warnings.push(`Chưa cấu hình điểm: ${numbers(data.unknownPointIds)}. Điểm đã biết chưa phải tổng điểm đầy đủ.`);
    if (data.precisionPointIds.length) warnings.push(`Điểm vượt độ chính xác hai chữ số hoặc giới hạn: ${numbers(data.precisionPointIds)}. Chưa làm tròn hoặc đổi điểm.`);
    const summaries = [`Tổng câu mục tiêu: ${data.targetCount}; thực tế toàn đề: ${data.actualCount}; lệch: ${data.actualCount - data.targetCount}.`];
    if (data.numeric) {
      const totalDelta = data.targetPointsHundredths !== null && !data.unknownPointIds.length && !data.precisionPointIds.length ? formatHundredths(data.actualKnownPointsHundredths - data.targetPointsHundredths) : 'Chưa rõ';
      summaries.push(`Tổng điểm mục tiêu: ${data.targetPointsHundredths === null ? 'Chưa đủ' : formatHundredths(data.targetPointsHundredths)}; điểm thực tế đã biết: ${formatHundredths(data.actualKnownPointsHundredths)}; lệch tổng: ${totalDelta}.`);
      summaries.push('Tổng điểm đã biết gồm cả câu chưa khớp và khớp nhiều ô. Cột điểm từng ô chỉ đếm câu có đúng một ô ứng viên.');
    } else summaries.push('Bài không chấm điểm: chỉ đối chiếu số câu, không yêu cầu điểm hoặc đáp án.');
    return { ...base, status: data.matches ? `${data.numeric ? 'Số câu và điểm' : 'Số câu'} từng ô khớp các nhãn hiện tại; vẫn cần duyệt nội dung.` : 'Cần đối chiếu; chưa thể xác nhận kế hoạch khớp.', summaries,
      headers: ['Ô / dạng câu / mức nhận thức', 'Đặc tả theo yêu cầu cần đạt', 'Câu: mục tiêu / khớp ô / lệch', data.numeric ? 'Điểm: mục tiêu / đã biết / lệch' : 'Đánh giá'], rows, warnings };
  } catch {
    return { ...base, status: 'Kế hoạch chưa đúng định dạng; cần giáo viên rà soát trước khi đối chiếu.', summaries: [], headers: [], rows: [], warnings: ['Không tự sửa hoặc bỏ kế hoạch gốc khi xuất.'] };
  }
}
