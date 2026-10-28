import { shuffleOutline } from './outline-operations';
import { Exam, Question, ShuffledExamVariant, ChoiceItem } from '@/types/exam';
import { matchingDefinition, orderingDefinition } from './structured-question';
import { shuffleQuestionUnits } from './question-order';

/**
 * Thuật toán sinh số ngẫu nhiên có Seed (Mulberry32)
 * Giúp tái tạo chính xác cùng 1 kết quả hoán vị cho cùng một mã đề thi.
 */
export function createPRNG(seed: number) {
  let s = seed >>> 0;
  return function() {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Thuật toán Fisher-Yates xáo trộn mảng dựa trên hàm ngẫu nhiên tuỳ biến
 */
function shuffleArray<T>(array: T[], randomFn: () => number = Math.random): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(randomFn() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Kiểm tra xem các phương án có phụ thuộc vị trí tương đối không (ví dụ: "Cả A và B đều đúng")
 */
function hasDependentChoices(choices: ChoiceItem[]): boolean {
  const text = choices.map(c => c.text).join(' ');
  return /cả\s+[A-D]\s+và\s+[A-D]|tất cả.*(đúng|sai)/i.test(text);
}

/** "chọn đáp án B", "Phương án A", "Đáp án: B", "đáp án đúng là C", "chọn D". Letters inside words ("tam giác ABC") never match. */
const SOLUTION_LETTER = /((?<![\p{L}\d])(?:chọn\s+(?:đáp án|phương án)(?:\s+đúng)?(?:\s+là)?(?:\s*:\s*|\s+)|(?:đáp án|phương án)(?:\s+đúng)?(?:\s+là)?(?:\s*:\s*|\s+)|chọn\s+))([A-D])(?![\p{L}\d])/giu;

/**
 * Trộn một câu hỏi trắc nghiệm: hoán vị A, B, C, D, cập nhật correct_answer và đồng bộ lời giải
 */
function shuffleMultipleChoiceQuestion(question: Question, randomFn: () => number): Question {
  if (!question.choices || question.choices.length === 0) return question;

  // Nếu có phương án phụ thuộc ("Cả A và B"), giữ nguyên thứ tự các phương án để không sai logic
  if (hasDependentChoices(question.choices) || question.choices.some(choice => choice.pinned)) {
    return question;
  }

  const oldCorrectKey = question.correct_answer;
  if (!oldCorrectKey || !question.choices.some(c => c.key === oldCorrectKey)) return question;
  if (new Set(question.choices.map(c => c.text)).size !== question.choices.length) return question;
  const originalCorrectChoice = question.choices.find(c => c.key === oldCorrectKey);
  const correctText = originalCorrectChoice ? originalCorrectChoice.text : '';

  // Hoán vị danh sách nội dung đáp án
  const shuffledTexts = shuffleArray(question.choices.map(c => c.text), randomFn);

  // Gán lại các nhãn A, B, C, D
  const standardKeys = ['A', 'B', 'C', 'D'];
  const newChoices: ChoiceItem[] = shuffledTexts.map((text, idx) => ({
    key: standardKeys[idx] || String.fromCharCode(65 + idx),
    text,
  }));

  // Tìm lại xem đáp án đúng đang ở nhãn nào mới
  const newCorrectChoice = newChoices.find(c => c.text === correctText);
  const newCorrectKey = newCorrectChoice ? newCorrectChoice.key : oldCorrectKey;

  // Every letter the solution names ("Phương án A sai", "Chọn đáp án B", "Đáp án: B") must follow its own answer text.
  // All letters move in one pass, so a letter that was just rewritten is never rewritten again.
  const keyByOldText = new Map(question.choices.map(c => [c.text, c.key]));
  const moved = new Map<string, string>();
  for (const choice of newChoices) { const oldKey = keyByOldText.get(choice.text); if (oldKey) moved.set(oldKey.toUpperCase(), choice.key); }
  const updatedSolution = question.step_by_step_solution?.replace(SOLUTION_LETTER, (whole, lead: string, letter: string) => `${lead}${moved.get(letter.toUpperCase()) ?? letter}`);

  return {
    ...question,
    choices: newChoices,
    correct_answer: newCorrectKey,
    step_by_step_solution: updatedSolution,
  };
}

/**
 * Tạo danh sách mã đề và hoán vị đề gốc có Seed tái tạo
 */
export function generateShuffledExams(
  baseExam: Exam,
  count: number = 4,
  startCode: number = 101,
  baseSeed?: number,
  options: { shuffleGroups?: boolean } = {}
): ShuffledExamVariant[] {
  const variants: ShuffledExamVariant[] = [];

  // Tách câu hỏi theo từng phần để bảo toàn cấu trúc đề chuẩn GDPT 2018
  const part1 = baseExam.questions.filter(q => q.type === 'multiple_choice');
  const part2 = baseExam.questions.filter(q => q.type === 'true_false_group');
  const part3 = baseExam.questions.filter(q => q.type === 'short_answer');
  const part4 = baseExam.questions.filter(q => !['multiple_choice', 'true_false_group', 'short_answer'].includes(q.type));

  const rootSeed = baseSeed !== undefined ? baseSeed : 123456789;

  for (let i = 0; i < count; i++) {
    const code = (startCode + i).toString();
    const variantSeed = (rootSeed + (startCode + i) * 10007) >>> 0;
    const randomFn = createPRNG(variantSeed);

    // Hoán vị câu hỏi trong từng phần
    const shuffledPart1 = shuffleArray(part1, randomFn).map(q => shuffleMultipleChoiceQuestion(q, randomFn));
    const shuffledPart2 = shuffleArray(part2, randomFn);
    const shuffledPart3 = shuffleArray(part3, randomFn);
    const shuffledPart4 = part4; // Tự luận giữ nguyên cấu trúc

    const reorderedQuestions = [
      ...shuffledPart1,
      ...shuffledPart2,
      ...shuffledPart3,
      ...shuffledPart4,
    ];

    // Exams with sections or shared passages keep their sections in order; inside a section the questions are shuffled,
    // and the questions of one passage move together as a block.
    const structured = baseExam.outline ? shuffleOutline(baseExam, randomFn, options.shuffleGroups !== false) : undefined;
    const allShuffledQuestions = structured
      ? structured.questions.map(q => q.type === 'multiple_choice' ? shuffleMultipleChoiceQuestion(q, randomFn) : q)
      : baseExam.passages?.length || baseExam.questions.some(q => q.passageId || q.sectionId)
      ? shuffleQuestionUnits(baseExam.questions, randomFn).map(q => q.type === 'multiple_choice' ? shuffleMultipleChoiceQuestion(q, randomFn) : q)
      : reorderedQuestions;

    // Tạo bảng đáp án chi tiết cho mã đề này
    const answerKey: Record<number, string> = {};
    allShuffledQuestions.forEach((q, index) => {
      const qNum = index + 1;
      if (q.type === 'multiple_choice') {
        answerKey[qNum] = q.correct_answer || '-';
      } else if (q.type === 'true_false_group') {
        const tf = q.sub_questions?.map(sq => `${sq.key}:${sq.isCorrect === undefined ? '?' : sq.isCorrect ? 'Đ' : 'S'}`).join(' ') || '-';
        answerKey[qNum] = tf;
      } else if (q.type === 'short_answer' || q.type === 'fill_blank') {
        answerKey[qNum] = q.correct_answer || q.accepted_answers?.filter(Boolean).join(' / ') || '-';
      } else if (q.type === 'matching') {
        const matching = matchingDefinition(q);
        answerKey[qNum] = matching ? matching.display.left.map((left, i) => `${i + 1}–${matching.display.right.findIndex(right => right.key === matching.answerKey[left.key]) + 1}`).join('; ') : '-';
      } else if (q.type === 'ordering') {
        const ordering = orderingDefinition(q);
        const used = new Set<string>();
        answerKey[qNum] = ordering ? ordering.expected.map(text => { const index = ordering.display.items.findIndex(item => item.text === text && !used.has(item.key)); used.add(ordering.display.items[index].key); return index + 1; }).join(' → ') : '-';
      } else {
        answerKey[qNum] = 'Tự luận';
      }
    });

    const variantExam: Exam = {
      ...baseExam,
      id: `${baseExam.id}-v${code}`,
      serverId: undefined,
      version: undefined,
      metadata: {
        ...baseExam.metadata,
        examCode: code,
      },
      questions: allShuffledQuestions,
      ...(structured ? { outline: structured.outline, sections: structured.sections } : {}),
    };

    variants.push({
      examCode: code,
      exam: variantExam,
      answerKey,
      seed: variantSeed,
    });
  }

  return variants;
}

/**
 * Tạo ma trận đáp án tổng hợp (cho phép in nhanh bảng chấm thi)
 */
export function buildAnswerMatrix(variants: ShuffledExamVariant[]): {
  questionNumber: number;
  codes: Record<string, string>; // { "101": "A", "102": "B", ... }
}[] {
  if (variants.length === 0) return [];
  const totalQuestions = variants[0].exam.questions.length;
  const rows = [];

  for (let q = 1; q <= totalQuestions; q++) {
    const rowCodes: Record<string, string> = {};
    for (const v of variants) {
      rowCodes[v.examCode] = v.answerKey[q] || '-';
    }
    rows.push({
      questionNumber: q,
      codes: rowCodes,
    });
  }

  return rows;
}
