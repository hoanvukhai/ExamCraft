import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRawVietnameseDocument, parseRawVietnameseText } from '../src/lib/exam-parser';

// The 28 cases of qa/ai-review/GEMINI_IMPORT_CASES.md. Each pasted text is exactly what a teacher would paste.
const one = (text: string) => { const questions = parseRawVietnameseText(text); assert.equal(questions.length, 1, 'exactly one question'); return questions[0]; };
const texts = (question: { choices?: { text: string }[] }) => (question.choices ?? []).map(choice => choice.text);
const keys = (question: { choices?: { key: string }[] }) => (question.choices ?? []).map(choice => choice.key).join('');

test('TC01-TC03 the basic headers and choice markers', () => {
  const a = one('Câu 1: Thủ đô của Việt Nam là gì?\nA. Hà Nội\nB. Huế\nC. Đà Nẵng\nD. Cần Thơ');
  assert.equal(a.type, 'multiple_choice'); assert.equal(a.content, 'Thủ đô của Việt Nam là gì?'); assert.equal(keys(a), 'ABCD'); assert.equal(a.correct_answer, undefined);
  const b = one('Câu 1. Số nào sau đây là số nguyên tố?\nA. 4\nB. 6\nC. 7\nD. 9'); assert.equal(b.content, 'Số nào sau đây là số nguyên tố?'); assert.equal(keys(b), 'ABCD');
  const c = one('Câu 1) Đơn vị đo lực trong hệ SI là:\nA) Jun (J)\nB) Niutơn (N)\nC) Oat (W)\nD) Pascan (Pa)'); assert.equal(c.content, 'Đơn vị đo lực trong hệ SI là:'); assert.deepEqual(texts(c), ['Jun (J)', 'Niutơn (N)', 'Oat (W)', 'Pascan (Pa)']);
});

test('TC04 a bare number "1)" starts a question when the text has no "Câu"', () => {
  const q = one('1) Kết quả của phép tính 5 + 7 là:\nA. 10\nB. 11\nC. 12\nD. 13');
  assert.equal(q.content, 'Kết quả của phép tính 5 + 7 là:'); assert.equal(keys(q), 'ABCD');
  assert.equal(parseRawVietnameseText('1. Một?\nA. a\nB. b\nC. c\nD. d\n2. Hai?\nA. a\nB. b\nC. c\nD. d').length, 2);
});

test('TC05-TC08 parenthesised letters, one line, two per line and continued choices', () => {
  const a = one('Câu 1: Từ nào viết đúng chính tả?\n(A) Xắp xếp\n(B) Sắp xếp\n(C) Sắp sếp\n(D) Xắp sếp'); assert.deepEqual(texts(a), ['Xắp xếp', 'Sắp xếp', 'Sắp sếp', 'Xắp sếp']);
  const b = one('Câu 1: Giá trị của x thỏa mãn x + 3 = 10 là: A. 5 B. 6 C. 7 D. 8'); assert.equal(b.content, 'Giá trị của x thỏa mãn x + 3 = 10 là:'); assert.deepEqual(texts(b), ['5', '6', '7', '8']);
  const c = one('Câu 1: Hình vuông có cạnh 4cm thì chu vi là:\nA. 8cm         B. 12cm\nC. 16cm        D. 20cm'); assert.deepEqual(texts(c), ['8cm', '12cm', '16cm', '20cm']);
  const d = one('Câu 1: Đặc điểm của đoạn văn quy nạp là gì?\nA. Câu chủ đề nằm ở cuối đoạn văn,\nlàm nhiệm vụ khái quát toàn bộ nội dung\nB. Câu chủ đề nằm ở đầu đoạn văn\nC. Không có câu chủ đề\nD. Có câu chủ đề ở cả đầu và cuối');
  assert.equal(d.choices![0].text, 'Câu chủ đề nằm ở cuối đoạn văn, làm nhiệm vụ khái quát toàn bộ nội dung'); assert.equal(d.choices![1].text, 'Câu chủ đề nằm ở đầu đoạn văn');
});

test('TC09-TC11 the right answer from a star, "(đúng)" or an "Đáp án:" line', () => {
  const a = one('Câu 1: Số nào sau đây chia hết cho cả 2 và 5?\nA. 12\nB. 25\nC. 30*\nD. 42'); assert.equal(a.correct_answer, 'C'); assert.equal(a.choices![2].text, '30');
  const b = one('Câu 1: Kim loại nào nhẹ nhất trong các kim loại sau?\nA. Nhôm\nB. Liti (đúng)\nC. Sắt\nD. Đồng'); assert.equal(b.correct_answer, 'B'); assert.equal(b.choices![1].text, 'Liti');
  const c = one('Câu 1: Khí nào chiếm thể tích lớn nhất trong không khí?\nA. Oxygen\nB. Nitrogen\nC. Carbon dioxide\nD. Hydrogen\nĐáp án: B'); assert.equal(c.correct_answer, 'B'); assert.equal(c.choices![3].text, 'Hydrogen');
});

test('TC12-TC14 a key list, a glued list and an answer table at the end', () => {
  const list = parseRawVietnameseText('Câu 1: Một cộng một bằng mấy?\nA. 1\nB. 2\nC. 3\nD. 4\n\nCâu 2: Hai nhân hai bằng mấy?\nA. 2\nB. 3\nC. 4\nD. 5\n\nĐÁP ÁN\n1. B  2. C');
  assert.deepEqual(list.map(q => q.correct_answer), ['B', 'C']); assert.equal(list.length, 2);
  const glued = parseRawVietnameseText('Câu 1: Câu hỏi một?\nA. a  B. b  C. c  D. d\nCâu 2: Câu hỏi hai?\nA. a  B. b  C. c  D. d\nĐáp án: 1A 2D');
  assert.deepEqual(glued.map(q => q.correct_answer), ['A', 'D']); assert.equal(glued[1].choices![3].text, 'd');
  const table = parseRawVietnameseText('Câu 1: Câu một?\nA. 1  B. 2  C. 3  D. 4\nCâu 2: Câu hai?\nA. 1  B. 2  C. 3  D. 4\n\nBẢNG ĐÁP ÁN:\nCâu:    1 | 2\nĐáp án: B | A');
  assert.equal(table.length, 2); assert.deepEqual(table.map(q => q.correct_answer), ['B', 'A']); assert.ok(!table[1].choices![3].text.includes('BẢNG'), 'the table is not left in the last choice');
});

test('TC15-TC16 capital letters and "câu 2" inside the question text', () => {
  const a = one('Câu 1: Cho tam giác ABC vuông tại A có AB = 3cm, AC = 4cm. Độ dài cạnh BC là:\nA. 5cm\nB. 6cm\nC. 7cm\nD. 8cm');
  assert.equal(a.content, 'Cho tam giác ABC vuông tại A có AB = 3cm, AC = 4cm. Độ dài cạnh BC là:'); assert.deepEqual(texts(a), ['5cm', '6cm', '7cm', '8cm']);
  const b = one('Câu 1: Căn cứ vào bài 3 và câu 2 của bài thơ, em hãy cho biết hoàn cảnh sáng tác là gì?\nA. Năm 1945\nB. Năm 1954\nC. Năm 1975\nD. Năm 1986');
  assert.ok(b.content.includes('bài 3 và câu 2'));
});

test('TC17-TC20 true-false groups with and without answers, and essay parts', () => {
  const a = one('Câu 1: Cho hàm số y = 2x - 3. Các mệnh đề sau đúng hay sai?\na) Hàm số đồng biến trên tập xác định.\nb) Đồ thị cắt trục tung tại điểm có tung độ bằng 3.\nc) Đồ thị đi qua điểm M(1; -1).\nd) Hệ số góc của đường thẳng bằng 2.');
  assert.equal(a.type, 'true_false_group'); assert.deepEqual(a.sub_questions!.map(s => s.key), ['a', 'b', 'c', 'd']); assert.ok(a.sub_questions!.every(s => s.isCorrect === undefined));
  const b = one('Câu 1: Xét tính đúng sai của các khẳng định sau:\na) Số 0 là số tự nhiên nhỏ nhất. (Đ)\nb) Số 1 là số nguyên tố. (S)\nc) Mọi số nguyên tố đều là số lẻ. (Sai)\nd) Số 2 là số nguyên tố chẵn duy nhất. (Đúng)');
  assert.deepEqual(b.sub_questions!.map(s => s.isCorrect), [true, false, false, true]); assert.equal(b.sub_questions![0].content, 'Số 0 là số tự nhiên nhỏ nhất.');
  const c = one('Câu 1: Xét các nhận định về lịch sử:\na) Khởi nghĩa Hai Bà Trưng bùng nổ năm 40.\nb) Chiến thắng Bạch Đằng diễn ra năm 938.\nc) Lý Công Uẩn dời đô về Thăng Long năm 1010.\nd) Triều đại nhà Trần kết thúc năm 1400.\nĐáp án: a) Đ, b) Đ, c) Đ, d) Đ');
  assert.deepEqual(c.sub_questions!.map(s => s.isCorrect), [true, true, true, true]); assert.ok(!c.sub_questions![3].content.includes('Đáp án'));
  const d = one('Câu 1: Thực hiện các phép tính sau:\na) 15 + 27 - 12\nb) 120 : 4 + 5 * 6'); assert.notEqual(d.type, 'true_false_group');
});

test('TC21-TC23 short answer, $...$ and \\(...\\) formulas', () => {
  const a = one('Câu 1: Hãy điền từ thích hợp vào chỗ trống:\nNước sôi ở nhiệt độ .......... độ C trong điều kiện áp suất tiêu chuẩn.'); assert.equal(a.type, 'short_answer'); assert.equal(a.choices, undefined);
  const b = one('Câu 1: Rút gọn biểu thức $P = \\frac{x^2 - 4}{x - 2}$ với $x \\ne 2$:\nA. $P = x + 2$\nB. $P = x - 2$\nC. $P = 2x$\nD. $P = x$');
  assert.equal(b.content, 'Rút gọn biểu thức $P = \\frac{x^2 - 4}{x - 2}$ với $x \\ne 2$:'); assert.deepEqual(texts(b), ['$P = x + 2$', '$P = x - 2$', '$P = 2x$', '$P = x$']);
  const c = one('Câu 1: Tìm nghiệm của phương trình \\(2x - 6 = 0\\):\nA. \\(x = 1\\)\nB. \\(x = 2\\)\nC. \\(x = 3\\)\nD. \\(x = 4\\)');
  assert.equal(c.content, 'Tìm nghiệm của phương trình \\(2x - 6 = 0\\):'); assert.deepEqual(texts(c), ['\\(x = 1\\)', '\\(x = 2\\)', '\\(x = 3\\)', '\\(x = 4\\)']);
});

test('TC24 a shared passage before a group of questions is kept and linked, not thrown away', () => {
  const { questions, passages } = parseRawVietnameseDocument('Đọc đoạn văn sau và trả lời các câu hỏi từ 1 đến 2:\n"Tre xanh, xanh tự bao giờ?\nChuyện ngày xưa đã có bờ tre xanh..."\n\nCâu 1: Thể thơ của đoạn trích trên là gì?\nA. Thơ bốn chữ\nB. Thơ năm chữ\nC. Thơ lục bát\nD. Thơ tự do\n\nCâu 2: Hình ảnh cây tre tượng trưng cho điều gì?\nA. Phẩm chất kiên cường của con người Việt Nam\nB. Vẻ đẹp hiện đại\nC. Sự giàu có\nD. Tình yêu đôi lứa');
  assert.equal(questions.length, 2); assert.equal(passages.length, 1); assert.ok(passages[0].content.includes('Tre xanh, xanh tự bao giờ?'));
  assert.deepEqual(questions.map(q => q.passageId), [passages[0].id, passages[0].id]);
});

test('TC25 the title block of an exam is not a question', () => {
  const q = one('UBND HUYỆN ĐAN PHƯỢNG\nTRƯỜNG THCS TÂN LẬP\nĐỀ THI KIỂM TRA ĐỊNH KỲ NĂM HỌC 2025-2026\nMôn: Toán - Lớp 6\nThời gian: 45 phút\n\nCâu 1: Tính 10 + 20:\nA. 30\nB. 40\nC. 50\nD. 60');
  assert.equal(q.content, 'Tính 10 + 20:');
  assert.equal(parseRawVietnameseDocument('ĐỀ KIỂM TRA\nThời gian: 45 phút\nCâu 1: Một?\nA. a\nB. b\nC. c\nD. d').passages.length, 0, 'a title is not turned into a passage');
});

test('TC26-TC28 stray blanks and tabs, two or three choices, and score or level tags', () => {
  const a = one('\n\n\t\tCâu 1:   Biểu thức nào sau đây là đơn thức?   \n\n\tA. 2x + y   \n\tB. 3xy^2   \n\tC. x - 1   \n\tD. 1/x   \n\n\n'); assert.equal(a.content, 'Biểu thức nào sau đây là đơn thức?'); assert.deepEqual(texts(a), ['2x + y', '3xy^2', 'x - 1', '1/x']);
  const [two, three] = parseRawVietnameseText('Câu 1: Số 15 có phải là số lẻ không?\nA. Có\nB. Không\n\nCâu 2: Đèn tín hiệu giao thông gồm mấy màu?\nA. 2 màu\nB. 3 màu\nC. 4 màu');
  assert.equal(keys(two), 'AB'); assert.equal(keys(three), 'ABC'); assert.equal(two.type, 'multiple_choice');
  const tagged = one('Câu 1: [1,0 điểm] [TH] Phát biểu nào sau đây về lực ma sát là đúng?\nA. Lực ma sát luôn có hại\nB. Lực ma sát luôn có lợi\nC. Lực ma sát trượt cản trở chuyển động trượt của vật\nD. Lực ma sát không phụ thuộc vào áp lực');
  assert.equal(tagged.content, 'Phát biểu nào sau đây về lực ma sát là đúng?'); assert.equal(tagged.points, 1); assert.equal(tagged.difficulty, 'thong_hieu'); assert.equal(keys(tagged), 'ABCD');
  assert.equal(one('Câu 2: [0,25 điểm] [VDC] Khó?\nA. a\nB. b\nC. c\nD. d').difficulty, 'van_dung_cao');
  assert.equal(one('Câu 3: [Ghi chú riêng] Giữ nguyên?\nA. a\nB. b\nC. c\nD. d').content, '[Ghi chú riêng] Giữ nguyên?', 'an unknown bracket is not removed');
});
