import type { Exam, OutlineNode, Question } from '@/types/exam';
import { legacyOutline, outlineNodes, validateOutline } from './exam-outline';
import { publicOutline } from './outline-view';
import { compileMathExpression, safePlotRange } from './math-expression';
import {
  matchingDefinition,
  orderingDefinition,
  matchingDisplay,
  orderingDisplay,
} from './structured-question';

type Data = Record<string, unknown>;
export const asObject = (value: unknown): Data =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Data) : {};
const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const text = (...values: unknown[]) => values.find((value) => typeof value === 'string') ?? '';

function pick(value: unknown, keys: string[]): Data {
  const source = asObject(value);
  return Object.fromEntries(
    keys
      .filter(
        (key) =>
          typeof source[key] === 'string' ||
          typeof source[key] === 'number' ||
          typeof source[key] === 'boolean',
      )
      .map((key) => [key, source[key]]),
  );
}

export function publicFigure(value: unknown) {
  const figure = asObject(value);
  const data = asObject(figure.data);
  let displayData: unknown;
  if (figure.kind === 'variation_table') {
    displayData = {
      xValues: list(data.xValues).filter((v) => typeof v === 'string'),
      yPrimeSigns: list(data.yPrimeSigns).filter((v) => ['+', '-', '0', '||'].includes(String(v))),
      yValues: list(data.yValues).map((v) => pick(v, ['type', 'val'])),
    };
  } else if (figure.kind === 'function_plot') {
    const expression = compileMathExpression(data.expression) ? data.expression : '';
    displayData = {
      ...pick(data, ['title']),
      expression,
      xRange: safePlotRange(data.xRange),
      yRange: safePlotRange(data.yRange),
    };
  } else if (figure.kind === 'image' || figure.kind === 'geometry') {
    displayData = typeof figure.data === 'string' ? figure.data : pick(data, ['url']);
  }
  return { ...pick(figure, ['id', 'kind', 'url', 'caption', 'renderedBase64']), data: displayData };
}

export function publicQuestion(value: unknown): Data & {
  choices: Data[];
  sub_questions: Data[];
  payload: { choices: Data[]; sub_questions: Data[] };
  figures: ReturnType<typeof publicFigure>[];
} {
  const q = asObject(value);
  const payload = asObject(q.payload);
  const choices = list(q.choices ?? payload.choices).map((c) => ({ ...pick(c, ['key', 'text']), ...(Array.isArray(asObject(c).figures) ? { figures: list(asObject(c).figures).map(publicFigure) } : {}) }));
  const subQuestions = list(q.sub_questions ?? payload.sub_questions).map((s) => pick(s, ['key', 'content']));
  return {
    ...pick(q, ['id', 'sectionId', 'position', 'type', 'difficulty', 'content', 'points', 'passageId']),
    type: typeof q.type === 'string' ? q.type.toUpperCase() : '',
    parts: list(q.parts).map((part) => pick(part, ['id', 'label', 'content', 'points'])),
    ...pick(q, ['partsNumbering']),
    choices,
    sub_questions: subQuestions,
    matching: matchingDisplay(q),
    ordering: orderingDisplay(q),
    payload: { choices, sub_questions: subQuestions },
    // Figures are rendered from their explicit display fields; arbitrary embedded payloads are never forwarded.
    figures: list(q.figures).map(publicFigure),
  };
}

export function snapshotQuestions(value: unknown): Data[] {
  const snapshot = asObject(value);
  const direct = list(snapshot.questions);
  const nested = list(snapshot.sections).flatMap((section) =>
    list(asObject(section).questions).map((q) => ({
      ...asObject(q),
      sectionId: asObject(q).sectionId ?? asObject(section).id,
    })),
  );
  const unique = new Map<string, Data>();
  for (const raw of [...direct, ...nested]) {
    const q = asObject(raw);
    if (typeof q.id === 'string' && !unique.has(q.id)) unique.set(q.id, q);
  }
  const questions = [...unique.values()];
  if (snapshot.outline !== undefined) {
    const outline = validateOutline(snapshot.outline, questions as unknown as Question[]);
    return outlineNodes(outline)
      .filter((node) => node.kind === 'question')
      .map((node) => unique.get(node.questionId!)!);
  }
  return questions;
}

export function sanitizeSnapshotForStudent(value: unknown) {
  const snapshot = asObject(value);
  const questions = snapshotQuestions(snapshot);
  const outline: OutlineNode[] =
    snapshot.outline !== undefined
      ? validateOutline(snapshot.outline, questions as unknown as Question[])
      : legacyOutline({ ...snapshot, questions, sections: list(snapshot.sections) } as unknown as Exam);
  return {
    outline: publicOutline(outline),
    ...pick(snapshot, ['id', 'title', 'subject', 'grade', 'durationMinutes', 'createdAt', 'updatedAt']),
    metadata: pick(snapshot.metadata, [
      'title',
      'subject',
      'grade',
      'durationMinutes',
      'schoolName',
      'departmentName',
      'examCode',
      'academicYear',
      'semester',
      'notes',
      'assessmentMode',
      'cognitiveFrameworkId',
      'sourcePackageId',
      'language',
      'languageRole',
      'locality',
      'curriculumVersion',
    ]),
    sections: list(snapshot.sections).map((section) => ({
      ...pick(section, ['id', 'title', 'name', 'type', 'description', 'pointsPerQuestion', 'questionCount']),
      title: text(asObject(section).title, asObject(section).name),
      description: text(asObject(section).description, asObject(section).instruction),
      questions: list(asObject(section).questions).map(publicQuestion),
    })),
    passages: list(snapshot.passages).map((p) => ({
      ...pick(p, ['id', 'title', 'content']),
      figures: list(asObject(p).figures).map(publicFigure),
    })),
    questions: snapshotQuestions(snapshot).map(publicQuestion),
  };
}

export function solutionForQuestion(value: unknown) {
  const q = asObject(value);
  const payload = asObject(q.payload);
  return {
    id: q.id,
    correct: payload.correct ?? payload.correct_answer ?? q.correct_answer,
    sub_questions: list(payload.sub_questions ?? q.sub_questions).map((sub) =>
      pick(sub, ['key', 'content', 'isCorrect', 'explanation']),
    ),
    parts: list(q.parts).map((part) => ({
      ...pick(part, ['id', 'label', 'answer', 'solution']),
      rubric: list(asObject(part).rubric).map((row) => pick(row, ['criterion', 'maxPoints'])),
    })),
    solution: q.solution ?? q.step_by_step_solution ?? '',
    matchingPairs: list(q.matchingPairs ?? payload.matchingPairs).map((pair) =>
      pick(pair, ['id', 'left', 'right']),
    ),
    correctOrder: list(q.correctOrder ?? payload.correctOrder).filter((value) => typeof value === 'string'),
  };
}

export function validateResponses(value: unknown, snapshot: unknown): value is Data {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  if (JSON.stringify(value).length > 200000) return false;
  const questions = new Map(snapshotQuestions(snapshot).map((q) => [q.id, q]));
  return Object.entries(value).every(([key, response]) => {
    const question = questions.get(key);
    if (!question) return false;
    if (response === null) return true;
    if (Array.isArray(question.parts) && question.parts.length) {
      const ids = new Set(question.parts.map((part) => asObject(part).id));
      return (
        !!response &&
        typeof response === 'object' &&
        !Array.isArray(response) &&
        Object.entries(response).every(([id, answer]) => ids.has(id) && typeof answer === 'string')
      );
    }
    const type = String(question.type).toUpperCase();
    const ordering = orderingDefinition(question);
    if (type === 'ORDERING' && ordering)
      return (
        Array.isArray(response) &&
        response.length <= ordering.display.items.length &&
        response.every(
          (key) => typeof key === 'string' && ordering.display.items.some((item) => item.key === key),
        ) &&
        new Set(response).size === response.length
      );
    const matching = matchingDefinition(question);
    if (type === 'MATCHING' && matching)
      return Boolean(
        response &&
        typeof response === 'object' &&
        !Array.isArray(response) &&
        Object.entries(response).every(
          ([left, right]) =>
            matching.display.left.some((item) => item.key === left) &&
            (right === '' || matching.display.right.some((item) => item.key === right)),
        ),
      );
    return (
      response === null ||
      typeof response === 'boolean' ||
      typeof response === 'number' ||
      typeof response === 'string' ||
      (typeof response === 'object' &&
        !Array.isArray(response) &&
        Object.entries(response).every(
          ([subKey, v]) =>
            subKey.length < 100 && (typeof v === 'boolean' || typeof v === 'string' || typeof v === 'number'),
        ))
    );
  });
}
