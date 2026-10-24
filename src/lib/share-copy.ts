import { normalizeExamDocument } from './exam-document';
import type { Exam, Question } from '@/types/exam';

/** Legacy callers keep their copy; current callers get one private copy per source version. */
export const shareCopyClientId = (linkId: string, sourceVersion?: number) => sourceVersion === undefined ? `share-copy:${linkId}` : `share-copy:${linkId}:v${sourceVersion}`;

const PRIVATE_METADATA = ['knowledgePackage', 'knowledgeScope', 'templateApplication', 'examPlan', 'workspaceDocument', 'access', 'permissions'];
const PRIVATE_QUESTION = ['knowledgeIds', 'outcomeIds', 'knowledgeReference', 'learningOutcome'];

function hideAnswers(question: Question): Question {
  const next: Question = { ...question, step_by_step_solution: '', rubric: undefined, accepted_answers: undefined, correct_answer: undefined, correctOrder: undefined };
  if (question.sub_questions) next.sub_questions = question.sub_questions.map(sub => ({ key: sub.key, content: sub.content }));
  if (question.matchingPairs) next.matchingPairs = question.matchingPairs.map(pair => ({ id: pair.id, left: pair.left, right: '' }));
  return next;
}

/**
 * Build the document a signed-in teacher receives from a public link that allows copying.
 * Answers and solutions are included only when the owner also let the link show answers;
 * private knowledge sources and plans never travel with a share. The copy is always a draft.
 */
export function buildShareCopy(source: Exam, link: { id: string; showAnswers: boolean; sourceVersion?: number }, now = new Date()): Exam {
  const metadata = { ...source.metadata } as unknown as Record<string, unknown>;
  for (const key of PRIVATE_METADATA) delete metadata[key];
  const title = String(metadata.title ?? '');
  metadata.title = title.startsWith('[Bản sao]') ? title : `[Bản sao] ${title}`;
  const questions = source.questions.map(original => {
    const question = (link.showAnswers ? { ...original } : hideAnswers(original)) as unknown as Record<string, unknown>;
    for (const key of PRIVATE_QUESTION) delete question[key];
    return { ...question, status: 'draft', verifiedBy: 'none', version: 1 } as unknown as Question;
  });
  const stamp = now.toISOString();
  return normalizeExamDocument({ ...source, id: shareCopyClientId(link.id, link.sourceVersion), serverId: undefined, version: undefined, access: undefined,
    metadata, questions, createdAt: stamp, updatedAt: stamp });
}
