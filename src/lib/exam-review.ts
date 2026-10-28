import { outlineNodes, syncOutline } from './exam-outline';
import type { Exam, Figure } from '@/types/exam';
import { requiresNumericScore } from './education-catalog';
import { freezeExamScoring } from './snapshot-scoring';
import { compareExamPlan, pointsToHundredths } from './exam-plan';

export interface ExamReviewIssue {
  code: string;
  location: string;
  message: string;
  severity: 'error' | 'review';
}

/** Local structural review only: never writes, fetches images, or certifies subject accuracy. */
export function reviewExam(exam: Exam) {
  const issues: ExamReviewIssue[] = [];
  const add = (
    code: string,
    location: string,
    message: string,
    severity: ExamReviewIssue['severity'] = 'error',
  ) => issues.push({ code, location, message, severity });
  const unique = (values: string[], location: string, label: string) => {
    if (values.some((value) => !value.trim()) || new Set(values).size !== values.length)
      add('duplicate-key', location, `${label} đang trống hoặc trùng. Hãy đặt mã riêng cho từng mục.`);
  };
  const figures = (items: Figure[] | undefined, location: string) => {
    unique(
      (items ?? []).map((item) => item.id),
      location,
      'Mã hình',
    );
    for (const figure of items ?? []) {
      if (figure.kind === 'image' || figure.kind === 'geometry') {
        const data =
          figure.data && typeof figure.data === 'object' ? (figure.data as Record<string, unknown>) : {};
        const source =
          typeof data.url === 'string'
            ? data.url
            : (figure.renderedBase64 ?? (typeof figure.data === 'string' ? figure.data : ''));
        if (!/^(data:image\/|https?:\/\/|\/)/i.test(source))
          add('image-source', location, 'Hình chưa có nguồn ảnh hiển thị được. Hãy bổ sung ảnh.');
        else if (/^https?:\/\//i.test(source))
          add(
            'external-image',
            location,
            'Ảnh dùng đường dẫn bên ngoài; cần xem thử ảnh trước khi giao hoặc in.',
            'review',
          );
      }
    }
  };
  if (!exam.metadata.title.trim()) add('title', 'Đề', 'Chưa đặt tên đề.', 'review');
  if (!exam.questions.length) add('empty', 'Đề', 'Chưa có câu hỏi; chưa thể kết luận đề đã đủ.');
  unique(
    exam.questions.map((q) => q.id),
    'Đề',
    'Mã câu',
  );
  unique(
    (exam.passages ?? []).map((p) => p.id),
    'Đề',
    'Mã ngữ liệu',
  );
  unique(
    (exam.sections ?? []).map((s) => s.id),
    'Đề',
    'Mã phần',
  );
  for (const passage of exam.passages ?? []) {
    figures(passage.figures, passage.title || 'Ngữ liệu');
    if (!passage.content.trim() && !passage.figures?.length)
      add('empty-passage', passage.title || 'Ngữ liệu', 'Ngữ liệu chưa có nội dung hoặc hình.');
    if (passage.figureIds?.some((id) => !passage.figures?.some((f) => f.id === id)))
      add('figure-link', passage.title || 'Ngữ liệu', 'Có mã hình chưa có dữ liệu hình đi kèm.');
  }
  if (exam.outline) {
    try {
      exam = syncOutline(exam);
      for (const node of outlineNodes(exam.outline!)) {
        if (
          node.kind === 'part' &&
          !outlineNodes(node.children ?? []).some((child) => child.kind === 'question')
        ) {
          add('empty-part', node.title || 'Phần', 'Phần này chưa có câu hỏi.', 'review');
        }
        if (node.kind === 'group' && !node.children?.length) {
          add('empty-group', node.title || 'Nhóm câu', 'Nhóm này chưa có câu hỏi.', 'review');
        }
      }
    } catch {
      add('outline', 'Đề', 'Dàn ý chưa hợp lệ; cần kiểm lại vị trí các câu.');
      exam = { ...exam, outline: undefined };
    }
  }
  const numeric = requiresNumericScore(exam.metadata.assessmentMode);
  const scoring = freezeExamScoring(exam);
  let knownPointsHundredths = 0,
    pointsComplete = Boolean(exam.questions.length);
  exam.questions.forEach((q, index) => {
    const location = `Câu ${index + 1}`;
    if (!q.content.trim()) add('content', location, 'Chưa có nội dung câu hỏi.');
    if (q.passageId && !exam.passages?.some((p) => p.id === q.passageId))
      add('passage-link', location, 'Không tìm thấy ngữ liệu được liên kết.');
    if (q.sectionId && !exam.sections?.some((s) => s.id === q.sectionId))
      add('section-link', location, 'Không tìm thấy phần chứa câu này.');
    figures(q.figures, location);
    if (q.parts?.length) {
      unique(
        q.parts.map((part) => part.id),
        location,
        'Mã ý',
      );
      q.parts.forEach((part, i) => {
        const where = location + ' · ý ' + (part.label || i + 1);
        if (!part.content.trim()) add('part-content', where, 'Ý này chưa có nội dung.');
        if (numeric && part.points === undefined) add('part-points', where, 'Ý này chưa có điểm.', 'review');
        if (!part.answer?.trim() && !part.solution?.trim() && !part.rubric?.length) {
          add('part-answer', where, 'Ý này chưa có đáp án hoặc hướng dẫn chấm.', 'review');
        }
      });
      if (numeric && q.points !== undefined && q.parts.every((part) => part.points !== undefined)) {
        const total = q.parts.reduce((sum, part) => sum + (part.points ?? 0), 0);
        if (Math.abs(total - q.points) > 0.000001)
          add('part-total', location, 'Tổng điểm các ý khác điểm của câu.', 'review');
      }
    }
    if (numeric) {
      const points = scoring.questions[index].points;
      try {
        if (q.points !== undefined && (!Number.isFinite(q.points) || q.points < 0)) throw new Error();
        if (points === undefined) throw new Error();
        knownPointsHundredths += pointsToHundredths(points);
      } catch {
        pointsComplete = false;
        add(
          'points',
          location,
          'Điểm chưa được đặt hoặc chưa hợp lệ (không âm, tối đa hai chữ số thập phân).',
        );
      }
    }
    if (q.type === 'multiple_choice') {
      const choices = q.choices ?? [];
      unique(
        choices.map((c) => c.key),
        location,
        'Nhãn lựa chọn',
      );
      if (choices.length < 2 || choices.some((c) => !c.text.trim()))
        add('choices', location, 'Cần ít nhất hai lựa chọn có nội dung.');
      if (numeric && !choices.some((c) => c.key === q.correct_answer))
        add('answer', location, 'Chưa chọn đáp án nằm trong các lựa chọn.');
    } else if (q.type === 'true_false_group') {
      const parts = q.sub_questions ?? [];
      unique(
        parts.map((p) => p.key),
        location,
        'Nhãn ý đúng/sai',
      );
      if (!parts.length || parts.some((p) => !p.content.trim()))
        add('subquestions', location, 'Các ý đúng/sai cần có nội dung.');
      if (numeric && parts.some((p) => typeof p.isCorrect !== 'boolean'))
        add('answer', location, 'Có ý chưa chọn Đúng hoặc Sai.');
    } else if (q.type === 'short_answer' || q.type === 'fill_blank') {
      if (
        numeric &&
        !q.parts?.length &&
        !q.correct_answer?.trim() &&
        !q.accepted_answers?.some((a) => a.trim())
      )
        add('answer', location, 'Chưa có đáp án chấp nhận; hãy bổ sung hoặc chuẩn bị chấm tay.', 'review');
    } else if (q.type === 'matching') {
      const pairs = q.matchingPairs ?? [];
      unique(
        pairs.map((p) => p.id),
        location,
        'Mã cặp ghép',
      );
      if (pairs.length < 2 || pairs.some((p) => !p.left.trim() || !p.right.trim()))
        add('matching', location, 'Cần ít nhất hai cặp ghép đủ nội dung hai phía.');
    } else if (q.type === 'ordering') {
      if ((q.correctOrder?.length ?? 0) < 2 || q.correctOrder?.some((item) => !item.trim()))
        add('ordering', location, 'Cần ít nhất hai mục có nội dung theo thứ tự đúng.');
    } else if (q.type === 'essay') {
      if (
        (numeric || exam.metadata.assessmentMode === 'rubric') &&
        !q.parts?.length &&
        !q.rubric?.length &&
        !q.step_by_step_solution?.trim()
      )
        add('manual-guide', location, 'Chưa có hướng dẫn chấm hoặc tiêu chí chấm.', 'review');
    } else add('type', location, 'Dạng câu chưa được hỗ trợ.');
    if (q.rubric?.some((r) => !r.criterion.trim() || !Number.isFinite(r.maxPoints) || r.maxPoints < 0))
      add('rubric', location, 'Tiêu chí chấm cần nội dung và điểm không âm.');
  });
  if (exam.metadata.examPlan !== undefined) {
    try {
      if (!compareExamPlan(exam).matches)
        add(
          'plan',
          'Kế hoạch',
          'Số câu, điểm hoặc nhãn kiến thức chưa khớp kế hoạch. Mở Kế hoạch để đối chiếu.',
          'review',
        );
    } catch {
      add('plan-format', 'Kế hoạch', 'Chưa đọc được kế hoạch; dữ liệu gốc được giữ để sửa.');
    }
  }
  return {
    issues,
    numeric,
    knownPointsHundredths,
    pointsComplete: numeric && pointsComplete,
    questionCount: exam.questions.length,
  };
}
