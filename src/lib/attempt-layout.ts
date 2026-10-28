import type { Exam } from '@/types/exam';
import { shuffleOutline } from './outline-operations';
import { legacyOutline, validateOutline } from './exam-outline';
import { asObject, sanitizeSnapshotForStudent } from './public-exam';

function shuffled<T>(values: T[], random: () => number) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Choice keys stay stable: only presentation order changes, so grading cannot use a different key. */
export function createAttemptLayout(snapshot: unknown, seed: number, shuffleQuestions: boolean, shuffleChoices: boolean) {
  let state = seed >>> 0;
  const random = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
  const exam = sanitizeSnapshotForStudent(snapshot);
  // Sections keep their order and the questions of one passage stay together; only the blocks inside a section move.
  const structured = shuffleQuestions ? shuffleOutline(exam as unknown as Exam, random) : undefined;
  const questions = structured ? structured.questions as unknown as typeof exam.questions : exam.questions;
  return {
    outline: structured?.outline ?? exam.outline,
    questionOrder: questions.map(q => String(q.id)),
    choiceOrder: Object.fromEntries(questions.map(q => [String(q.id),
      (shuffleChoices ? shuffled(q.choices, random) : q.choices).map(c => String(c.key)),
    ])),
  };
}

export function examForAttempt(snapshot: unknown, layoutValue: unknown) {
  const exam = sanitizeSnapshotForStudent(snapshot);
  const layout = asObject(layoutValue);
  const order = Array.isArray(layout.questionOrder) ? layout.questionOrder : [];
  const choicesByQuestion = asObject(layout.choiceOrder);
  const questions = [...exam.questions].sort((a, b) => {
    const ai = order.indexOf(a.id), bi = order.indexOf(b.id);
    return (ai < 0 ? order.length : ai) - (bi < 0 ? order.length : bi);
  }).map(q => {
    const choiceOrder = choicesByQuestion[String(q.id)];
    const ids = Array.isArray(choiceOrder) ? choiceOrder : [];
    const choices = [...q.choices].sort((a, b) => ids.indexOf(a.key) - ids.indexOf(b.key));
    return { ...q, choices, payload: { ...q.payload, choices } };
  });
  const outline = layout.outline !== undefined
    ? validateOutline(layout.outline, questions as unknown as Exam['questions'])
    : legacyOutline({ ...exam, questions } as unknown as Exam);
  return { ...exam, questions, outline };
}
