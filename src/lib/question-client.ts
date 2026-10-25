import type { Question, Passage, Figure } from '@/types/exam';
import { normalizeQuestion } from './exam-document';
import { accountFetch } from './account-fetch';
import { createRequestIdentity } from './template-request-context';

const bankRequestIds = new Map<string, ReturnType<typeof createRequestIdentity>>();

export type BankPassage = Passage & { figures?: Figure[] };
export type BankQuestion = Question & { passage?: BankPassage; passageUnavailable?: boolean; shareable?: boolean };
export function bankPassage(value: unknown): BankPassage | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const passage = value as Record<string, unknown>;
  if (typeof passage.id !== 'string' || typeof passage.content !== 'string') return undefined;
  return { id: passage.id, content: passage.content, ...(typeof passage.title === 'string' ? { title: passage.title } : {}), ...(typeof passage.source === 'string' ? { source: passage.source } : {}), ...(Array.isArray(passage.figures) ? { figures: passage.figures as Figure[] } : {}) };
}
export async function listBankQuestions(ownerId: string): Promise<BankQuestion[]> {
  const questions: BankQuestion[] = [];
  for (let page = 1; ; page++) {
    const response = await accountFetch(ownerId, `/api/questions?limit=50&page=${page}`, { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? 'Không tải được ngân hàng câu hỏi');
    questions.push(...data.questions.map((q: Record<string, unknown>) => ({ ...normalizeQuestion(q), id: String(q.id), passage: bankPassage(q.passage), passageUnavailable: q.passageUnavailable === true })));
    if (page >= data.pagination.totalPages) return questions;
  }
}

export async function saveBankQuestion(input: Question, ownerId: string, passage?: BankPassage) {
  const q = normalizeQuestion(input);
  if (!q.subject || !q.grade) throw new Error('Cần chọn môn và lớp cho câu hỏi trước khi lưu vào ngân hàng');
  const body = {
    subject: q.subject, grade: q.grade, type: q.type.toUpperCase(), difficulty: q.difficulty.toUpperCase(), content: q.content, figures: q.figures,
    ...(q.importedFromFile ? { sourceKind: 'IMPORTED_FILE', shareable: false } : {}),
    ...(passage ? { passage: { title: passage.title, content: passage.content, source: passage.source, figures: passage.figures } } : q.passageId ? { passageId: q.passageId } : {}),
    payload: { choices: q.choices, sub_questions: q.sub_questions, correct: q.correct_answer, accepted_answers: q.accepted_answers, rubric: q.rubric, editorData: { ...q, status: 'draft', verifiedBy: 'none' } },
    solution: q.step_by_step_solution, points: q.points, topics: q.topics ?? [], tags: (q.tags ?? []).filter(t => t !== '__workspace_only'), source: q.source, aiGenerated: q.aiGenerated ?? false,
  };
  const key = `${ownerId}:${input.id}`;
  if (!bankRequestIds.has(key)) bankRequestIds.set(key, createRequestIdentity(() => crypto.randomUUID()));
  const requestId = bankRequestIds.get(key)!(JSON.stringify(body));
  const response = await accountFetch(ownerId, '/api/questions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, requestId }) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? 'Chưa lưu được câu hỏi vào ngân hàng');
  return { ...normalizeQuestion(result.question), id: String(result.question.id), passage: bankPassage(result.question.passage) };
}

export async function deleteBankQuestion(id: string, ownerId: string) {
  const response = await accountFetch(ownerId, `/api/questions/${encodeURIComponent(id)}`, { method: 'DELETE' });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? 'Chưa xóa được câu hỏi');
}
