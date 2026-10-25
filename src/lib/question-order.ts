function shuffled<T>(values: T[], random: () => number) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Shuffles the order of questions the way a teacher expects for a mã đề:
 * sections stay in their order and no question leaves its section; inside a section every question that shares a
 * reading passage moves together as one block, in its own order, and the blocks and single questions are shuffled.
 * Questions with no section form one section. The input is never changed.
 */
export function shuffleQuestionUnits<T extends object>(questions: T[], random: () => number): T[] {
  const field = (question: T, name: 'id' | 'sectionId' | 'passageId') => (question as Record<string, unknown>)[name];
  const sections = new Map<string, T[]>();
  for (const question of questions) {
    const key = field(question, 'sectionId') == null ? '' : String(field(question, 'sectionId'));
    (sections.get(key) ?? sections.set(key, []).get(key)!).push(question);
  }
  const out: T[] = [];
  for (const members of sections.values()) {
    const units = new Map<string, T[]>();
    for (const question of members) {
      const passage = field(question, 'passageId');
      const key = passage == null || passage === '' ? `q:${String(field(question, 'id'))}` : `p:${String(passage)}`;
      (units.get(key) ?? units.set(key, []).get(key)!).push(question);
    }
    for (const unit of shuffled([...units.values()], random)) out.push(...unit);
  }
  return out;
}
