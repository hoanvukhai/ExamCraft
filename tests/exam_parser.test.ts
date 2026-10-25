import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRawVietnameseText } from '../src/lib/exam-parser';

const parse = (text: string) => parseRawVietnameseText(text);
const keys = (question: { choices?: { key: string }[] }) => (question.choices ?? []).map(choice => choice.key).join('');

test('the plain format "Câu n:" with four lines of choices becomes multiple choice questions', () => {
  const [first, second] = parse('Câu 1: Thủ đô của Việt Nam là gì?\nA. Hà Nội\nB. Huế\nC. Đà Nẵng\nD. Cần Thơ\nCâu 2: 2 + 3 bằng bao nhiêu?\nA. 4\nB. 5\nC. 6\nD. 7');
  assert.equal(parse('Câu 1: x\nA. a\nB. b\nC. c\nD. d').length, 1);
  assert.equal(first.type, 'multiple_choice'); assert.equal(first.content, 'Thủ đô của Việt Nam là gì?'); assert.equal(keys(first), 'ABCD'); assert.equal(first.choices![0].text, 'Hà Nội');
  assert.equal(second.content, '2 + 3 bằng bao nhiêu?'); assert.equal(second.choices![3].text, '7');
});

test('choices written on one line, with ")" or "." markers, are all found', () => {
  const [q] = parse('Câu 3. Kết quả của 2 × 3 là: A. 5 B. 6 C. 7 D. 8');
  assert.equal(q.content, 'Kết quả của 2 × 3 là:'); assert.deepEqual(q.choices!.map(c => c.text), ['5', '6', '7', '8']);
  const [r] = parse('Câu 4) Chọn đúng:\nA) một\nB) hai\nC) ba\nD) bốn');
  assert.equal(keys(r), 'ABCD'); assert.equal(r.choices![1].text, 'hai');
});

test('capital letters inside the question text are not mistaken for choices', () => {
  const [q] = parse('Câu 5: Cho tam giác ABC. Gọi D là trung điểm của BC. Khẳng định nào đúng?\nA. AD là trung tuyến\nB. AD là đường cao\nC. AD là phân giác\nD. AD là trung trực');
  assert.equal(q.content, 'Cho tam giác ABC. Gọi D là trung điểm của BC. Khẳng định nào đúng?');
  assert.deepEqual(q.choices!.map(c => c.text), ['AD là trung tuyến', 'AD là đường cao', 'AD là phân giác', 'AD là trung trực']);
});

test('the words "câu 2" or "bài 3" inside a sentence do not start a new question', () => {
  const questions = parse('Câu 1: Theo bài 3 và câu 2 của đoạn trích, tác giả muốn nói gì?\nA. một\nB. hai\nC. ba\nD. bốn\nCâu 2: Tiếp theo?\nA. a\nB. b\nC. c\nD. d');
  assert.equal(questions.length, 2); assert.ok(questions[0].content.includes('bài 3 và câu 2'));
});

test('the correct answer is read from "(đúng)", a trailing star, or an "Đáp án:" line, and never left in the text', () => {
  const [a, b, c] = parse('Câu 1: Một?\nA. x\nB. y (đúng)\nC. z\nD. w\nCâu 2: Hai?\nA. x\nB. y\nC. z*\nD. w\nCâu 3: Ba?\nA. x\nB. y\nC. z\nD. w\nĐáp án: D');
  assert.equal(a.correct_answer, 'B'); assert.equal(a.choices![1].text, 'y');
  assert.equal(b.correct_answer, 'C'); assert.equal(b.choices![2].text, 'z');
  assert.equal(c.correct_answer, 'D'); assert.ok(!c.choices![3].text.includes('Đáp án'), 'the answer line is not part of choice D');
});

test('a key list at the end ("1. A  2. C  3. B") sets the answers by question number', () => {
  const questions = parse('Câu 1: Một?\nA. x\nB. y\nC. z\nD. w\nCâu 2: Hai?\nA. x\nB. y\nC. z\nD. w\nCâu 3: Ba?\nA. x\nB. y\nC. z\nD. w\nĐÁP ÁN\n1. A  2. C  3. B');
  assert.equal(questions.length, 3, 'the key list is not a question');
  assert.deepEqual(questions.map(q => q.correct_answer), ['A', 'C', 'B']);
  assert.ok(!questions[2].choices![3].text.includes('ĐÁP ÁN'));
});

test('a choice that continues on the next line stays one choice', () => {
  const [q] = parse('Câu 1: Chọn câu đúng.\nA. Đây là một phương án rất dài\nvà tiếp tục ở dòng sau\nB. Phương án ngắn\nC. Phương án ba\nD. Phương án bốn');
  assert.equal(q.choices![0].text, 'Đây là một phương án rất dài và tiếp tục ở dòng sau'); assert.equal(q.choices![1].text, 'Phương án ngắn');
});

test('a question with no choices stays a short answer, and two or three choices are still multiple choice', () => {
  const [short, two, three] = parse('Câu 1: Tính 2 + 2.\nCâu 2: Đúng hay sai? A. Đúng B. Sai\nCâu 3: Chọn: A. một B. hai C. ba');
  assert.equal(short.type, 'short_answer'); assert.equal(short.choices, undefined);
  assert.equal(two.type, 'multiple_choice'); assert.equal(keys(two), 'AB');
  assert.equal(three.type, 'multiple_choice'); assert.equal(keys(three), 'ABC');
});

test('formulas, accents and blank lines survive, and text without any question gives nothing', () => {
  const [q] = parse('\n\n  Câu 1:   Giá trị của $\\frac{1}{2} + x^2$ khi $x=2$ là:\n\n  A. $4{,}5$\n  B. $5$\n  C. $\\sqrt{2}$\n  D. $0$\n\n');
  assert.equal(q.content, 'Giá trị của $\\frac{1}{2} + x^2$ khi $x=2$ là:'); assert.equal(q.choices![0].text, '$4{,}5$'); assert.equal(q.choices![2].text, '$\\sqrt{2}$');
  assert.deepEqual(parse('   \n\n'), []);
  assert.deepEqual(parse('Chỉ là một đoạn văn không có câu hỏi.').map(item => item.content), ['Chỉ là một đoạn văn không có câu hỏi.'], 'unnumbered text is kept as one question for the teacher to fix');
});

test('question numbers are not lost: every parsed question gets a distinct id', () => {
  const questions = parse('Câu 1: a\nA. 1\nB. 2\nC. 3\nD. 4\nCâu 2: b\nA. 1\nB. 2\nC. 3\nD. 4\nCâu 3: c');
  assert.equal(new Set(questions.map(q => q.id)).size, 3);
});

test('a title line before the first question is not turned into a question', () => {
  const questions = parse('ĐỀ KIỂM TRA GIỮA KỲ I - TOÁN 6\nThời gian làm bài: 45 phút\n\nCâu 1: Tính 1 + 1.\nA. 1\nB. 2\nC. 3\nD. 4\nCâu 2: Tính 2 + 2.\nA. 1\nB. 2\nC. 3\nD. 4');
  assert.equal(questions.length, 2); assert.equal(questions[0].content, 'Tính 1 + 1.');
});

test('four statements a) b) c) d) make a true-false group and the answer is read when it is given', () => {
  const [plain, marked, listed, mixed] = parse('Câu 1: Cho hàm số $y=x^2$. Xét các mệnh đề sau:\na) Hàm số có tập xác định $\mathbb{R}$.\nb) Hàm số đồng biến trên $\mathbb{R}$.\nc) Đồ thị đi qua gốc tọa độ.\nd) Giá trị nhỏ nhất bằng 1.\n'
    + 'Câu 2: Xét:\na) Một (Đ)\nb) Hai (S)\nc) Ba (Đúng)\nd) Bốn (Sai)\n'
    + 'Câu 3: Xét:\na) Một\nb) Hai\nc) Ba\nd) Bốn\nĐáp án: a) Đ, b) S, c) Đ, d) S\n'
    + 'Câu 4: Chọn đúng: A. x B. y C. z D. w');
  assert.equal(plain.type, 'true_false_group'); assert.equal(plain.content, 'Cho hàm số $y=x^2$. Xét các mệnh đề sau:');
  assert.deepEqual(plain.sub_questions!.map(sub => sub.key), ['a', 'b', 'c', 'd']); assert.equal(plain.sub_questions![0].content, 'Hàm số có tập xác định $\mathbb{R}$.');
  assert.ok(plain.sub_questions!.every(sub => sub.isCorrect === undefined), 'no marks, no answers: nothing is invented');
  assert.equal(plain.correct_answer, undefined);
  assert.deepEqual(marked.sub_questions!.map(sub => sub.isCorrect), [true, false, true, false]); assert.equal(marked.sub_questions![0].content, 'Một');
  assert.deepEqual(listed.sub_questions!.map(sub => sub.isCorrect), [true, false, true, false]); assert.ok(!listed.sub_questions![3].content.includes('Đáp án'));
  assert.equal(mixed.type, 'multiple_choice', 'uppercase choices keep their own meaning');
});

test('lettered parts of an essay question are not forced into a true-false group', () => {
  const [q] = parse('Câu 1: Giải các phương trình:\na) $x+1=2$\nb) $2x=4$');
  assert.notEqual(q.type, 'true_false_group');
});
