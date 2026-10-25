import test from 'node:test';
import assert from 'node:assert/strict';
import { parseExTestLatex } from '../src/lib/exam-parser';

// Cases EX-01 to EX-22 of qa/ai-review/GEMINI_EXTEST_CASES.md.
const raw = String.raw;
const one = (text: string) => { const questions = parseExTestLatex(text); assert.equal(questions.length, 1); return questions[0]; };
const choiceBlock = (tag: string, trueAt: number | null, body = 'Câu hỏi?') => raw`\begin{ex}%[${tag}]
${body}
\choice
${['A', 'B', 'C', 'D'].map((key, i) => `{Phương án ${key}${i === trueAt ? ' \\True' : ''}}`).join('\n')}
\loigiai{Lời giải.}
\end{ex}`;

test('EX-01 to EX-05: the correct choice is read from wherever \\True stands, and none means unknown', () => {
  ['A', 'B', 'C', 'D'].forEach((key, i) => {
    const q = one(choiceBlock('1D1B1-1', i)); assert.equal(q.correct_answer, key); assert.equal(q.choices![i].text, `Phương án ${key}`, '\\True is cut from the text'); assert.equal(q.step_by_step_solution, 'Lời giải.');
  });
  assert.equal(one(choiceBlock('1D1B1-1', null)).correct_answer, undefined);
});

test('EX-06 to EX-08: true-false groups with some, none or all statements true', () => {
  const group = (marks: boolean[]) => raw`\begin{ex}%[2D1B2-1]
Xét các mệnh đề:
\choiceTF
${marks.map((on, i) => `{Ý số ${i + 1}${on ? ' \\True' : ''}}`).join('\n')}
\loigiai{Giải.}
\end{ex}`;
  for (const marks of [[true, false, true, false], [false, false, false, false], [true, true, true, true]]) {
    const q = one(group(marks)); assert.equal(q.type, 'true_false_group'); assert.deepEqual(q.sub_questions!.map(s => s.isCorrect), marks); assert.deepEqual(q.sub_questions!.map(s => s.content), [1, 2, 3, 4].map(n => `Ý số ${n}`));
  }
});

test('EX-09 and EX-10: nested braces in the solution and escaped braces in the choices', () => {
  const nested = one(raw`\begin{ex}%[2D1K1-3]
Tính $I = \int_0^1 \dfrac{x}{\sqrt{x^2 + 1}} \mathrm{d}x$.
\choice
{$\sqrt{2} - 1$ \True}
{$\sqrt{2}$}
{$1$}
{$\dfrac{\sqrt{2}}{2}$}
\loigiai{Đặt $t = \sqrt{x^2 + 1}$.
Đổi cận: $x = 0 \Rightarrow t = 1$.
Khi đó: $I = \int_1^{\sqrt{2}} \dfrac{t\mathrm{d}t}{t} = \sqrt{2} - 1$.}
\end{ex}`);
  assert.equal(nested.correct_answer, 'A'); assert.ok(nested.step_by_step_solution.includes('Đổi cận') && nested.step_by_step_solution.endsWith('= \\sqrt{2} - 1$.'), 'the solution is not cut short');
  assert.equal(nested.choices![3].text, '$\\dfrac{\\sqrt{2}}{2}$');
  const escaped = one(raw`\begin{ex}%[1D1B1-3]
Tập nghiệm của $x^2 - 4 = 0$ là
\choice
{$S = \{ -2; 2 \}$ \True}
{$S = \{ 2 \}$}
{$S = \{ -2 \}$}
{$S = \{-4; 4\}$}
\loigiai{Do đó $S = \{-2; 2\}$.}
\end{ex}`);
  assert.equal(escaped.choices!.length, 4); assert.equal(escaped.choices![0].text, '$S = \\{ -2; 2 \\}$'); assert.equal(escaped.correct_answer, 'A'); assert.equal(escaped.step_by_step_solution, 'Do đó $S = \\{-2; 2\\}$.');
});

test('EX-11: the \\heva shorthand becomes a cases environment that KaTeX can read', () => {
  const q = one(raw`\begin{ex}%[1D2B1-1]
Hệ phương trình $\heva{2x + y &= 5 \\ x - y &= 1}$ có nghiệm. Giá trị $x_0 + y_0$ là
\choice
{$3$ \True}
{$1$}
{$2$}
{$4$}
\loigiai{Cộng hai vế ta được $3x = 6$. Hệ $\hoac{x = 1 \\ x = 2}$ không phải.}
\end{ex}`);
  assert.ok(q.content.includes('\\begin{cases}2x + y &= 5 \\\\ x - y &= 1\\end{cases}')); assert.ok(!q.content.includes('\\heva'));
  assert.ok(q.step_by_step_solution.includes('\\begin{cases}x = 1 \\\\ x = 2\\end{cases}'), 'the solution is converted too'); assert.equal(q.correct_answer, 'A');
});

test('EX-12: \\immini keeps the text and the choices, drops the wrapper, and says that a figure is missing', () => {
  const q = one(raw`\begin{ex}%[2D1B1-5]
\immini{
Cho hàm số $y=f(x)$ có bảng biến thiên như hình bên. Điểm cực đại của đồ thị hàm số đã cho là
\choice
{$(1; -2)$}
{$( -1; 2 )$ \True}
{$x = -1$}
{$y = 2$}
}{
\begin{tikzpicture}[scale=0.6]
\draw[->] (-2,0) -- (2,0) node[right]{$x$};
\end{tikzpicture}
}
\loigiai{Điểm cực đại của đồ thị là $(-1; 2)$.}
\end{ex}`);
  assert.ok(q.content.startsWith('Cho hàm số $y=f(x)$')); assert.ok(!q.content.includes('\\immini') && !q.content.includes('tikzpicture'));
  assert.ok(q.content.includes('cần chèn lại hình ảnh')); assert.ok(q.tags!.includes('Can_chen_hinh') && q.tags!.includes('2D1B1-5'));
  assert.equal(q.choices!.length, 4); assert.equal(q.correct_answer, 'B'); assert.equal(q.step_by_step_solution, 'Điểm cực đại của đồ thị là $(-1; 2)$.');
  const noChoice = one(raw`\begin{ex}
\immini[thm]{Tính $1+1$.}{\begin{tikzpicture}\end{tikzpicture}}
\end{ex}`); assert.ok(noChoice.content.startsWith('Tính $1+1$.') && noChoice.content.includes('cần chèn lại hình ảnh'));
});

test('EX-13: \\shortans becomes the answer of a short-answer question', () => {
  const q = one(raw`\begin{ex}%[2D1B1-4]
Tìm giá trị nhỏ nhất của $f(x) = x^2 - 4x + 7$ trên $[0; 3]$.
\shortans{3}
\loigiai{Ta có $f(x) = (x - 2)^2 + 3 \ge 3$.}
\end{ex}`);
  assert.equal(q.type, 'short_answer'); assert.equal(q.correct_answer, '3'); assert.deepEqual(q.accepted_answers, ['3']);
  assert.equal(q.content, 'Tìm giá trị nhỏ nhất của $f(x) = x^2 - 4x + 7$ trên $[0; 3]$.'); assert.equal(q.step_by_step_solution, 'Ta có $f(x) = (x - 2)^2 + 3 \\ge 3$.');
});

test('EX-14 to EX-20: the level comes from the letters of the VTeX code, and no code gives the default', () => {
  const level = (tag: string) => one(choiceBlock(tag, 0)).difficulty;
  assert.equal(level('1D1N1-1'), 'nhan_biet'); assert.equal(level('1D1Y1-1'), 'nhan_biet'); assert.equal(level('1D1B1-1'), 'thong_hieu');
  assert.equal(level('2D1V1-1'), 'van_dung'); assert.equal(level('2D1K1-1'), 'van_dung'); assert.equal(level('2D1G1-1'), 'van_dung_cao'); assert.equal(level('2D1C1-1'), 'van_dung_cao');
  const bare = one(raw`\begin{ex}
Không có mã.
\choice
{a \True}
{b}
{c}
{d}
\end{ex}`); assert.equal(bare.difficulty, 'thong_hieu'); assert.deepEqual(bare.tags, ['EX_Test']); assert.equal(bare.step_by_step_solution, 'Xem lời giải trong tài liệu gốc.');
});

test('EX-22: several blocks with comment lines and blank lines between them', () => {
  const questions = parseExTestLatex(raw`% ===================================
% ĐỀ KIỂM TRA THỬ TOÁN 12
% ===================================

\begin{ex}%[2D1B1-1]
Câu hỏi số 1: Đạo hàm của $y=e^x$ là
\choice
{$y'=e^x$ \True}
{$y'=xe^{x-1}$}
{$y'=\ln x$}
{$y'=1$}
\loigiai{Ta có $(e^x)' = e^x$.}
\end{ex}

% Chú thích giữa hai câu hỏi
% Biên soạn: Nhóm VTeX

\begin{ex}%[2D1B1-2]
Câu hỏi số 2: Nguyên hàm của $f(x)=1$ là
\choice
{$F(x)=x+C$ \True}
{$F(x)=1+C$}
{$F(x)=0$}
{$F(x)=x^2+C$}
\loigiai{$\int 1\mathrm{d}x = x + C$.}
\end{ex}`);
  assert.equal(questions.length, 2); assert.equal(new Set(questions.map(q => q.id)).size, 2); assert.deepEqual(questions.map(q => q.correct_answer), ['A', 'A']);
  assert.ok(questions.every(q => !q.content.includes('%') && !q.content.includes('VTeX')), 'comment lines stay out of the questions');
});
