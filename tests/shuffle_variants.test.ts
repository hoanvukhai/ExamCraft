import test from 'node:test';
import assert from 'node:assert/strict';
import { generateShuffledExams } from '../src/lib/shuffler';
import type { Exam, Question } from '../src/types/exam';

const mc = (id: string, texts: string[], correct: string, solution = '', extra: Partial<Question> = {}): Question => ({
  id, type: 'multiple_choice', difficulty: 'thong_hieu', content: 'Câu ' + id, points: 1, step_by_step_solution: solution, correct_answer: correct,
  choices: texts.map((text, index) => ({ key: 'ABCD'[index], text })), ...extra,
} as Question);
const exam = (questions: Question[], extra: Partial<Exam> = {}): Exam => ({ id: 'e', createdAt: '2026', updatedAt: '2026', metadata: { title: 't', subject: 'toan', grade: 6, durationMinutes: 45, schoolName: '', departmentName: '' }, questions, ...extra } as Exam);
const textOf = (question: Question, key: string | undefined) => question.choices?.find(choice => choice.key === key)?.text;

test('the same seed always gives the same variants and different seeds give different ones', () => {
  const base = exam(Array.from({ length: 8 }, (_, i) => mc('q' + i, ['một', 'hai', 'ba', 'bốn'], 'A')));
  const first = generateShuffledExams(base, 4, 101, 777), second = generateShuffledExams(base, 4, 101, 777), other = generateShuffledExams(base, 4, 101, 778);
  assert.deepEqual(first.map(v => v.exam.questions), second.map(v => v.exam.questions), 'reproducible');
  assert.deepEqual(first.map(v => v.answerKey), second.map(v => v.answerKey));
  assert.notDeepEqual(first.map(v => v.exam.questions), other.map(v => v.exam.questions), 'another seed gives another sheet');
  assert.equal(new Set(first.map(v => JSON.stringify(v.exam.questions))).size, 4, 'the four codes of one seed differ from each other');
});

test('after shuffling, the correct letter always points at the same answer text', () => {
  const base = exam(Array.from({ length: 12 }, (_, i) => mc('q' + i, [`đúng ${i}`, `sai a ${i}`, `sai b ${i}`, `sai c ${i}`], 'ABCD'[i % 4] as string)));
  const originalText = new Map(base.questions.map(q => [q.id, textOf(q, q.correct_answer)]));
  for (let seed = 1; seed <= 40; seed++) {
    for (const variant of generateShuffledExams(base, 3, 101, seed)) {
      for (const q of variant.exam.questions) assert.equal(textOf(q, q.correct_answer), originalText.get(q.id), `seed ${seed}, code ${variant.examCode}, ${q.id}`);
    }
  }
});

test('letters named in the solution follow their answers, including wrong ones and the "Đáp án:" form', () => {
  const solution = 'Phương án A sai vì thiếu điều kiện. Chọn đáp án B. Phương án C và phương án D cũng sai. Đáp án: B.';
  const base = exam([mc('q', ['sai một', 'đúng', 'sai hai', 'sai ba'], 'B', solution)]);
  const source = JSON.stringify(base);
  for (let seed = 1; seed <= 30; seed++) {
    const q = generateShuffledExams(base, 1, 101, seed)[0].exam.questions[0];
    const key = (text: string) => q.choices!.find(choice => choice.text === text)!.key;
    const sentences = q.step_by_step_solution!;
    assert.ok(sentences.includes(`Phương án ${key('sai một')} sai vì`), `seed ${seed}: wrong choice A keeps pointing at its own text`);
    assert.ok(sentences.includes(`Chọn đáp án ${key('đúng')}.`), `seed ${seed}: the correct choice is named by its new letter`);
    assert.ok(sentences.includes(`Phương án ${key('sai hai')} và phương án ${key('sai ba')} cũng sai`), `seed ${seed}: C and D move together`);
    assert.ok(sentences.endsWith(`Đáp án: ${key('đúng')}.`), `seed ${seed}: the "Đáp án:" form is updated too`);
    assert.equal(q.correct_answer, key('đúng'));
  }
  assert.equal(JSON.stringify(base), source, 'the base exam is never changed');
});

test('words that only look like letters in the solution are left alone', () => {
  const base = exam([mc('q', ['một', 'hai', 'ba', 'bốn'], 'C', 'Điểm A nằm trên đoạn thẳng. Tam giác ABC có góc C. Chọn C vì hai cạnh bằng nhau.')]);
  for (let seed = 1; seed <= 20; seed++) {
    const q = generateShuffledExams(base, 1, 101, seed)[0].exam.questions[0];
    assert.ok(q.step_by_step_solution!.startsWith('Điểm A nằm trên đoạn thẳng. Tam giác ABC có góc C. Chọn '), 'geometry letters are not touched');
    assert.ok(q.step_by_step_solution!.endsWith(` vì hai cạnh bằng nhau.`));
  }
});

test('pinned, dependent and duplicate-text choices keep their order and key', () => {
  const pinned = mc('p', ['a', 'b', 'c', 'd'], 'B'); pinned.choices![3].pinned = true;
  const dependent = mc('d', ['một', 'hai', 'Cả A và B đều đúng', 'bốn'], 'C');
  const duplicate = mc('u', ['giống', 'giống', 'khác', 'khác nữa'], 'A');
  for (const variant of generateShuffledExams(exam([pinned, dependent, duplicate]), 4, 101, 5)) {
    for (const original of [pinned, dependent, duplicate]) {
      const q = variant.exam.questions.find(item => item.id === original.id)!;
      assert.deepEqual(q.choices, original.choices); assert.equal(q.correct_answer, original.correct_answer);
    }
  }
});

test('a question without a marked answer is never given one by shuffling', () => {
  const noKey = mc('n', ['a', 'b', 'c', 'd'], undefined as unknown as string);
  for (const variant of generateShuffledExams(exam([noKey]), 3, 101, 9)) assert.equal(variant.exam.questions[0].correct_answer, undefined);
});

test('questions in a section or sharing a passage keep their order and every question is kept once', () => {
  const questions = Array.from({ length: 6 }, (_, i) => mc('q' + i, ['a', 'b', 'c', 'd'], 'A', '', i < 3 ? { passageId: 'p1' } : { sectionId: 's2' }));
  const base = exam(questions, { passages: [{ id: 'p1', title: 'NL', content: 'Ngữ liệu' }] });
  for (const variant of generateShuffledExams(base, 4, 101, 3)) {
    assert.equal(variant.exam.questions.length, 6); assert.equal(new Set(variant.exam.questions.map(q => q.id)).size, 6);
    assert.deepEqual(variant.exam.questions.slice(0, 3).map(q => q.id), ['q0', 'q1', 'q2'], 'the passage group stays together and in order');
  }
});
