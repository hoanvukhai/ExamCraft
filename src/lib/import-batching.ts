import type { Passage, Question } from '@/types/exam';
import { DocumentValidationError } from './exam-document';
import { suggestImportedParts, type ImportedPart } from './import-outline';

/**
 * A long imported document is read in ordered batches cut at question numbers, and the result is checked against the
 * number of "Câu N" markers in the source, so a model that stops early is reported instead of silently returning a few questions.
 */
export type ParsedImport = {
  questions: Question[];
  passages: Passage[];
  warnings: string[];
  suggestedParts?: ImportedPart[];
};
export type ImportBatchPlan = {
  batches: { text: string; expected: number; first: number; last: number }[];
  expected: number;
};

const MARKER = /^[\t ]*(?:Câu|Bài)\s*\d{1,3}\s*[.:)]/gim;
const MAX_BATCHES = 10;

export const markerPositions = (text: string) => [...text.matchAll(MARKER)].map((match) => match.index ?? 0);

export function planImportBatches(
  text: string,
  options: { maxChars?: number; maxQuestions?: number } = {},
): ImportBatchPlan {
  const maxChars = options.maxChars ?? 9000,
    maxQuestions = options.maxQuestions ?? 15;
  const starts = markerPositions(text);
  if (starts.length < 2 || (starts.length <= maxQuestions && text.length <= maxChars))
    return {
      batches: [{ text, expected: starts.length, first: starts.length ? 1 : 0, last: starts.length }],
      expected: starts.length,
    };
  const preamble = text.slice(0, starts[0]).trim();
  const shared = preamble && preamble.length <= 5000 ? preamble + '\n\n' : '';
  const blocks = starts.map((start, i) => text.slice(start, starts[i + 1] ?? text.length));
  const batches: ImportBatchPlan['batches'] = [];
  let current: string[] = [],
    size = 0,
    first = 1;
  const flush = (last: number) => {
    if (current.length)
      batches.push({
        text:
          (batches.length === 0 && !shared ? (preamble ? preamble + '\n\n' : '') : shared) + current.join(''),
        expected: current.length,
        first,
        last,
      });
    current = [];
    size = 0;
  };
  blocks.forEach((block, i) => {
    if (current.length && (current.length >= maxQuestions || size + block.length > maxChars)) {
      flush(i);
      first = i + 1;
    }
    current.push(block);
    size += block.length;
  });
  flush(blocks.length);
  return { batches, expected: starts.length };
}

/** What the source says it holds, so the model can be told how many questions to return. Empty when the numbering cannot be read. */
export const countHint = (info: { expected: number; first: number; last: number }) =>
  info.expected > 0
    ? `Tài liệu này có đúng ${info.expected} câu đánh số (từ Câu ${info.first} đến Câu ${info.last}). Mảng questions phải có đủ ${info.expected} phần tử, mỗi câu đánh số một phần tử, không bỏ sót, không gộp, không dừng sớm.

`
    : '';

export async function importInBatches(
  rawText: string,
  run: (text: string, info: { expected: number; first: number; last: number }) => Promise<ParsedImport>,
  label = 'tài liệu',
): Promise<ParsedImport> {
  const plan = planImportBatches(rawText);
  if (plan.batches.length > MAX_BATCHES)
    throw new Error(`Nguồn có quá nhiều phần (${plan.batches.length}); hãy chia nhỏ ${label}.`);
  const questions: Question[] = [],
    passages: Passage[] = [],
    warnings: string[] = [],
    passageByContent = new Map<string, string>();
  const short: string[] = [],
    failures: string[] = [];
  for (const [index, batch] of plan.batches.entries()) {
    // A part the model returned in an unusable shape is asked once more, then reported while the other parts are kept.
    const attempt = async () => {
      try {
        return await run(batch.text, batch);
      } catch (error) {
        if (plan.batches.length > 1 && error instanceof DocumentValidationError) {
          failures.push(error.message);
          return null;
        }
        throw error;
      }
    };
    let result = (await attempt()) ?? { questions: [], passages: [], warnings: [] };
    for (
      let again = 0;
      again < 2 && batch.expected > 1 && result.questions.length < batch.expected;
      again++
    ) {
      const retry = await attempt();
      if (retry && retry.questions.length > result.questions.length) result = retry;
    }
    if (batch.expected > 0 && result.questions.length < batch.expected)
      short.push(
        `phần ${index + 1} (câu ${batch.first}–${batch.last}) chỉ nhận ${result.questions.length}/${batch.expected}`,
      );
    const remap = new Map<string, string>();
    for (const passage of result.passages) {
      const key = passage.content.trim();
      const known = passageByContent.get(key);
      if (known) remap.set(passage.id, known);
      else {
        passageByContent.set(key, passage.id);
        remap.set(passage.id, passage.id);
        passages.push(passage);
      }
    }
    for (const question of result.questions)
      questions.push(
        question.passageId && remap.has(question.passageId)
          ? { ...question, passageId: remap.get(question.passageId) }
          : question,
      );
    for (const warning of result.warnings) if (!warnings.includes(warning)) warnings.push(warning);
  }
  if (!questions.length && failures.length) throw new DocumentValidationError(failures[0]);
  if (failures.length)
    warnings.unshift(`Có phần AI trả về chưa dùng được (${failures[0]}); các phần khác vẫn được giữ.`);
  if (plan.batches.length > 1)
    warnings.unshift(
      `${label[0].toUpperCase()}${label.slice(1)} dài nên được đọc thành ${plan.batches.length} phần theo thứ tự câu.`,
    );
  if (plan.expected > 0 && questions.length < plan.expected)
    warnings.unshift(
      `Chỉ nhận được ${questions.length}/${plan.expected} câu theo số "Câu N" trong nguồn${short.length ? ': ' + short.join('; ') : ''}. Hãy chia nhỏ tài liệu hoặc nhập lại phần thiếu; chưa có câu nào bị bịa thêm.`,
    );
  const seen = new Set<string>();
  let repeated = 0;
  for (const question of questions) {
    const key = question.content.replace(/\s+/g, ' ').trim();
    if (seen.has(key)) repeated++;
    else seen.add(key);
  }
  if (repeated)
    warnings.push(
      `Có ${repeated} câu trùng nguyên văn nội dung; kiểm tra xem nguồn có lặp câu hay không (không câu nào bị xóa).`,
    );
  return { questions, passages, warnings, suggestedParts: suggestImportedParts(rawText, questions) };
}
