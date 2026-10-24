import type { Exam } from '@/types/exam';
import { requiresNumericScore } from './education-catalog';

const object = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const points = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;

/** Freeze only a chosen section/grade-subject template; unresolved points must be handled explicitly by the caller. */
export function freezeExamScoring(exam: Exam, sectionInput?: unknown) {
  const provided = sectionInput ?? (exam as Exam & { sections?: unknown }).sections;
  const sections = Array.isArray(provided) ? provided.map(object) : [];
  const missing: string[] = [];
  const numeric = requiresNumericScore(exam.metadata.assessmentMode);
  const questions = exam.questions.map(q => {
    const matchingType = sections.filter(section => String(section.type).toLowerCase() === q.type);
    const section = q.sectionId ? sections.find(section => section.id === q.sectionId) : matchingType.length === 1 ? matchingType[0] : undefined;
    const progression = section?.progressiveScoring;
    const progressionPoints = Array.isArray(progression) && progression.length > 0 && progression.every(value => points(value) !== null && Number(value) <= Number(progression[progression.length - 1])) ? points(progression[progression.length - 1]) : null;
    const configured = !numeric ? 0 : points(q.points) ?? points(section?.pointsPerQuestion) ?? progressionPoints;
    if (configured === null) missing.push(q.id);
    return { ...q, points: configured ?? undefined, pointsConfigured: configured !== null, sectionId: q.sectionId ?? (typeof section?.id === 'string' ? section.id : undefined) };
  });
  return { questions, sections, missing };
}
