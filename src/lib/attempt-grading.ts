import { asObject, snapshotQuestions } from './public-exam';
import { requiresNumericScore, type AssessmentMode } from './education-catalog';
import { matchingDefinition, orderingDefinition } from './structured-question';

const normalize = (v: unknown) => String(v).trim().replace(/\s+/g, '').replace(/,/g, '.').toLowerCase();
const finitePoints = (value: unknown, fallback: number) => value !== null && value !== undefined && Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : fallback;

export function gradeSnapshot(snapshotValue: unknown, responses: Record<string, unknown>) {
  const snapshot = asObject(snapshotValue);
  const mode = asObject(snapshot.metadata).assessmentMode as AssessmentMode | undefined;
  if (!requiresNumericScore(mode)) {
    return { score: 0, maxScore: 0, needsGrading: mode !== 'survey', gradedAnswers: snapshotQuestions(snapshot).map(q => ({
      questionKey: String(q.id), response: responses[String(q.id)] ?? null, isCorrect: null, earned: 0, maxPoints: 0,
    })) };
  }
  const sections = Array.isArray(snapshot.sections) ? snapshot.sections.map(asObject) : [];
  const gradedAnswers = snapshotQuestions(snapshot).map(q => {
    const section = sections.find(s => s.id === q.sectionId);
    const payload = asObject(q.payload);
    const response = responses[String(q.id)] ?? null;
    const type = String(q.type).toUpperCase();
    const configuredPoints = finitePoints(q.pointsOverride ?? q.points, finitePoints(section?.pointsPerQuestion, Number.NaN));
    let pointsConfigured = q.pointsConfigured !== false && Number.isFinite(configuredPoints);
    let maxPoints = Number.isFinite(configuredPoints) ? configuredPoints : 0;
    let isCorrect: boolean | null = null;
    let earned = 0;
    if (type === 'MULTIPLE_CHOICE') {
      const correct = payload.correct ?? payload.correct_answer ?? q.correct_answer;
      if (typeof correct === 'string' && correct.trim()) {
        isCorrect = typeof response === 'string' && response.trim().toUpperCase() === correct.trim().toUpperCase();
        earned = isCorrect ? maxPoints : 0;
      }
    } else if (type === 'TRUE_FALSE_GROUP') {
      const subs = Array.isArray(payload.sub_questions ?? q.sub_questions) ? (payload.sub_questions ?? q.sub_questions) as unknown[] : [];
      if (subs.length && subs.every(sub => typeof asObject(sub).isCorrect === 'boolean')) {
        const correctCount = subs.filter(sub => asObject(response)[String(asObject(sub).key)] === asObject(sub).isCorrect).length;
        const scoring = section?.progressiveScoring;
        const validProgression = Array.isArray(scoring) && scoring.length === subs.length + 1 && scoring.every(v => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= Number(scoring[scoring.length - 1]));
        if (validProgression) {
          const progressionMax = Number(scoring[scoring.length - 1]);
          if (!pointsConfigured) maxPoints = progressionMax;
          pointsConfigured = true;
          earned = progressionMax > 0 ? Number(scoring[correctCount]) / progressionMax * maxPoints : 0;
        } else if (scoring === undefined) {
          earned = maxPoints * correctCount / subs.length;
        } else {
          pointsConfigured = false;
        }
        isCorrect = scoring !== undefined && !validProgression ? null : correctCount === subs.length;
      }
    } else if (type === 'SHORT_ANSWER' || type === 'FILL_BLANK') {
      const correct = payload.correct ?? payload.correct_answer ?? q.correct_answer;
      const accepted = payload.accepted_answers ?? q.accepted_answers ?? (correct !== undefined ? [correct] : []);
      const answers = Array.isArray(accepted) ? accepted.filter(a => (typeof a === 'string' || typeof a === 'number') && normalize(a) !== '') : [];
      if (answers.length) {
        isCorrect = (typeof response === 'string' || typeof response === 'number') && normalize(response) !== '' && answers.some(a => normalize(a) === normalize(response));
        earned = isCorrect ? maxPoints : 0;
      }
    } else if (type === 'MATCHING') {
      const definition = matchingDefinition(q);
      if (definition) {
        const actual = asObject(response);
        isCorrect = Object.entries(definition.answerKey).every(([left, right]) => actual[left] === right);
        earned = isCorrect ? maxPoints : 0;
      }
    } else if (type === 'ORDERING') {
      const definition = orderingDefinition(q);
      if (definition) {
        const keys = Array.isArray(response) ? response : [];
        isCorrect = keys.length === definition.expected.length && new Set(keys).size === keys.length &&
          keys.every((key, i) => definition.display.items.find(item => item.key === key)?.text === definition.expected[i]);
        earned = isCorrect ? maxPoints : 0;
      }
    }
    return { questionKey: String(q.id), response, isCorrect, earned: Math.round(earned * 100) / 100, maxPoints, pointsConfigured };
  });
  return {
    score: Math.round(gradedAnswers.reduce((sum, a) => sum + a.earned, 0) * 100) / 100,
    maxScore: Math.round(gradedAnswers.reduce((sum, a) => sum + a.maxPoints, 0) * 100) / 100,
    needsGrading: gradedAnswers.some(a => a.isCorrect === null || !a.pointsConfigured),
    gradedAnswers,
  };
}
