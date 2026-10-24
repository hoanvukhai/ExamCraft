import type { Question } from '@/types/exam';
import { resolveKnowledgeScope, type KnowledgePackage, type KnowledgeScope } from './knowledge-package';

/** These are editorial checks of declared tags, not proof that the content meets an outcome. */
export function reviewQuestionKnowledge(question: Pick<Question, 'knowledgeIds' | 'outcomeIds' | 'knowledgeReference'>, pkg?: KnowledgePackage, scope?: KnowledgeScope) {
  const knowledge = question.knowledgeIds ?? [], outcomes = question.outcomeIds ?? [];
  if (!knowledge.length && !outcomes.length) return { state: 'unmapped' as const, message: 'Chưa gắn kiến thức' };
  if (!pkg || question.knowledgeReference?.packageId !== pkg.id || question.knowledgeReference.packageRevision !== pkg.revision) return { state: 'stale' as const, message: 'Liên kết thuộc gói khác hoặc chưa rõ phiên bản; cần chọn lại' };
  if (knowledge.some(id => !pkg.knowledge.some(item => item.id === id)) || outcomes.some(id => !pkg.outcomes.some(item => item.id === id))) return { state: 'unknown' as const, message: 'Có mã kiến thức không còn trong gói' };
  if (scope) {
    let selected;
    try { selected = resolveKnowledgeScope(pkg, scope); }
    catch { return { state: 'stale' as const, message: 'Phạm vi đang khác phiên bản gói; cần chọn lại' }; }
    if (knowledge.some(id => !selected.knowledge.some(item => item.id === id)) || outcomes.some(id => !selected.outcomes.some(item => item.id === id))) return { state: 'outside' as const, message: 'Có liên kết ngoài phạm vi đang chọn' };
  }
  return { state: 'linked' as const, message: 'Đã gắn mã; giáo viên cần kiểm nội dung' };
}

export function bindQuestionKnowledge(question: Question, pkg: KnowledgePackage, knowledgeIds: string[], outcomeIds: string[]): Question {
  if (knowledgeIds.some(id => !pkg.knowledge.some(item => item.id === id)) || outcomeIds.some(id => !pkg.outcomes.some(item => item.id === id))) throw Error('Không thể gắn mã chưa có trong gói kiến thức.');
  return { ...question, knowledgeIds: [...new Set(knowledgeIds)], outcomeIds: [...new Set(outcomeIds)], knowledgeReference: { packageId: pkg.id, packageRevision: pkg.revision } };
}
