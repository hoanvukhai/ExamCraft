import test from 'node:test';
import assert from 'node:assert/strict';
import { extractBracedContent, parseExTestLatex } from '../src/lib/exam-parser';

const ex = (body: string, tag = '') => `\\begin{ex}${tag ? `%[${tag}]` : ''}\n${body}\n\\end{ex}`;

test('a four-choice question reads the choices and the one marked \\True', () => {
  const [q] = parseExTestLatex(ex('Giá trị của $\\dfrac{1}{2}+\\dfrac{1}{3}$ là\n\\choice{$\\dfrac{2}{5}$}{$\\dfrac{5}{6}$ \\True}{$\\dfrac{1}{6}$}{$1$}\n\\loigiai{Quy đồng: $\\dfrac{3}{6}+\\dfrac{2}{6}=\\dfrac{5}{6}$.}', '1D1B1-1'));
  assert.equal(q.type, 'multiple_choice'); assert.equal(q.content, 'Giá trị của $\\dfrac{1}{2}+\\dfrac{1}{3}$ là');
  assert.deepEqual(q.choices!.map(c => c.key), ['A', 'B', 'C', 'D']); assert.equal(q.choices![1].text, '$\\dfrac{5}{6}$'); assert.equal(q.correct_answer, 'B');
  assert.equal(q.step_by_step_solution, 'Quy đồng: $\\dfrac{3}{6}+\\dfrac{2}{6}=\\dfrac{5}{6}$.', 'nested braces inside the solution are kept whole');
  assert.deepEqual(q.tags, ['1D1B1-1']);
});

test('no \\True means the answer is unknown, never silently A', () => {
  const [q] = parseExTestLatex(ex('Câu hỏi không đánh dấu đáp án\n\\choice{một}{hai}{ba}{bốn}'));
  assert.equal(q.type, 'multiple_choice'); assert.equal(q.correct_answer, undefined, 'a missing key stays missing');
});

test('a true-false group marks only the items with \\True and keeps the four statements in order', () => {
  const [q] = parseExTestLatex(ex('Cho hàm số $y=x^2$. Xét các mệnh đề:\n\\choiceTF{Hàm số đồng biến trên $\\mathbb{R}$}{Hàm số có tập xác định $\\mathbb{R}$ \\True}{Đồ thị đi qua gốc tọa độ \\True}{Giá trị nhỏ nhất bằng 1}'));
  assert.equal(q.type, 'true_false_group'); assert.deepEqual(q.sub_questions!.map(s => s.key), ['a', 'b', 'c', 'd']);
  assert.deepEqual(q.sub_questions!.map(s => s.isCorrect), [false, true, true, false]);
  assert.equal(q.sub_questions![1].content, 'Hàm số có tập xác định $\\mathbb{R}$'); assert.equal(q.content, 'Cho hàm số $y=x^2$. Xét các mệnh đề:');
});

test('fewer than four choices keep what is there instead of dropping every choice', () => {
  const [three, one] = parseExTestLatex(ex('Chọn:\n\\choice{một}{hai \\True}{ba}') + '\n' + ex('Chỉ một:\n\\choice{một}'));
  assert.equal(three.type, 'multiple_choice'); assert.deepEqual(three.choices!.map(c => c.text), ['một', 'hai', 'ba']); assert.equal(three.correct_answer, 'B');
  assert.equal(one.type, 'short_answer', 'a single choice is not a multiple choice question'); assert.equal(one.choices, undefined);
});

test('a block with no choice command is a short answer, and several blocks give distinct ids', () => {
  const questions = parseExTestLatex(ex('Tính $2+3$.\n\\loigiai{5}') + '\n% bình luận\n' + ex('Tính $3+4$.', '1D1N1-2') + ex('Tính $4+5$.'));
  assert.equal(questions.length, 3); assert.ok(questions.every(q => q.type === 'short_answer'));
  assert.equal(questions[0].content, 'Tính $2+3$.'); assert.equal(questions[0].step_by_step_solution, '5');
  assert.equal(new Set(questions.map(q => q.id)).size, 3); assert.equal(questions[1].difficulty, 'nhan_biet');
});

test('braces are matched by depth and escaped braces are ignored', () => {
  assert.deepEqual(extractBracedContent('\\choice{a{b}c}{d}', 0), { content: 'a{b}c', nextIdx: 14 });
  assert.equal(extractBracedContent('{a \\} b}', 0)?.content, 'a \\} b');
  assert.equal(extractBracedContent('no braces', 0), null); assert.equal(extractBracedContent('{unclosed', 0), null);
});
