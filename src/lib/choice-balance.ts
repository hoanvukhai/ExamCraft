interface BalanceQuestion {
  type: string;
  choices?: { key: string; text: string }[];
  correct_answer?: string;
  step_by_step_solution?: string;
}

/** Models put the right answer first far too often (99 of 101 in a sample were "A"). Choices that point at each other ("Cả A và B") or a solution that names a letter cannot be reordered without breaking them. */
const pointsAtOtherChoices = (question: BalanceQuestion) =>
  question.choices!.some(choice => /(\bcả\b|tất cả|các đáp án|phương án|đáp án|\bboth\b|all of|none of|\b[A-F]\s*(?:và|,|and)\s*[A-F]\b)/i.test(choice.text))
  || /(đáp án|phương án|chọn|answer|option)\s*\(?[A-F]\b/i.test(question.step_by_step_solution ?? '');

/** Moves each right answer to a spread-out position and keeps the key list in order, so the key follows the answer. Questions that cannot be reordered are returned unchanged. */
export function balanceChoiceOrder<T extends BalanceQuestion>(questions: T[], random: () => number = Math.random): T[] {
  let deck: number[] = [];
  const draw = (size: number) => {
    if (!deck.length) { deck = [0, 1, 2, 3, 4, 5].sort(() => random() - 0.5); }
    return deck.pop()! % size;
  };
  return questions.map(question => {
    const choices = question.choices;
    if (question.type !== 'multiple_choice' || !choices || choices.length < 2 || !question.correct_answer) return question;
    const right = choices.findIndex(choice => choice.key === question.correct_answer);
    if (right < 0 || pointsAtOtherChoices(question)) return question;
    const keys = choices.map(choice => choice.key);
    const others = choices.filter((_, index) => index !== right);
    const target = draw(choices.length);
    const ordered = [...others.slice(0, target), choices[right], ...others.slice(target)];
    return { ...question, choices: ordered.map((choice, index) => ({ ...choice, key: keys[index] })), correct_answer: keys[target] };
  });
}
