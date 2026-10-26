import test from 'node:test';
import assert from 'node:assert/strict';
import mammoth from 'mammoth';
import { exportExamToDocx } from '../src/lib/docx-export';
import { attachWordImages, docxWithImagesAsMarkers } from '../src/lib/docx-images';
import { normalizeExamDocument } from '../src/lib/exam-document';
import type { Passage, Question } from '../src/types/exam';

const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
const question = (n: number, withImage: boolean) => ({ id: 'q' + n, type: 'short_answer', difficulty: 'thong_hieu', content: `Câu hình số ${n}`, correct_answer: '1', accepted_answers: ['1'], points: 1, step_by_step_solution: '',
  ...(withImage ? { figures: [{ id: 'f' + n, kind: 'image', data: { url: png }, renderedBase64: png, caption: '' }] } : {}) });
const wordFile = async (questions: unknown[]) => Buffer.from(await (await exportExamToDocx(normalizeExamDocument({ id: 'x', metadata: { title: 't', subject: 'toan', grade: 6, durationMinutes: 1, schoolName: '', departmentName: '' }, createdAt: '2026', updatedAt: '2026', questions }), false, false)).arrayBuffer());

test('each picture in a Word file becomes a numbered marker in the text and its bytes are kept', async () => {
  const { buffer, images, skipped } = await docxWithImagesAsMarkers(await wordFile([question(1, true), question(2, false), question(3, true)]));
  assert.equal(images.length, 2); assert.equal(skipped, 0); assert.ok(images.every(image => image.dataUrl.startsWith('data:image/png;base64,')));
  const text = (await mammoth.extractRawText({ buffer })).value;
  assert.ok(text.includes('[HÌNH 1]') && text.includes('[HÌNH 2]') && !text.includes('[HÌNH 3]'));
  assert.ok(text.indexOf('Câu hình số 1') < text.indexOf('[HÌNH 1]') && text.indexOf('[HÌNH 1]') < text.indexOf('Câu hình số 2'), 'the marker sits where the picture was');
});

test('a Word file without pictures is returned untouched', async () => {
  const file = await wordFile([question(1, false)]);
  const result = await docxWithImagesAsMarkers(file);
  assert.equal(result.images.length, 0); assert.equal(result.buffer, file);
});

const base = (content: string, extra: Partial<Question> = {}) => ({ id: 'a', type: 'essay', difficulty: 'thong_hieu', content, step_by_step_solution: '', ...extra }) as unknown as Question;
const image = (n: number) => ({ n, dataUrl: png, bytes: 70 });

test('markers kept by the AI are replaced by figures on the right question, passage or choice, and the marker text disappears', () => {
  const result = attachWordImages({ questions: [base('Quan sát [HÌNH 1] và trả lời.'), base('Không có hình'), base('Chọn', { choices: [{ key: 'A', text: '[HÌNH 2]' }, { key: 'B', text: 'chữ' }] })], passages: [{ id: 'p', content: 'Đoạn có [Hình 3] ở đây' } as Passage], warnings: [] }, [image(1), image(2), image(3)]);
  assert.equal(result.questions[0].content, 'Quan sát và trả lời.'); assert.equal(result.questions[0].figures?.length, 1); assert.equal(result.questions[0].figures?.[0].kind, 'image');
  assert.equal(result.questions[1].figures, undefined);
  assert.equal(result.questions[2].figures?.length, 1); assert.equal(result.questions[2].choices?.[0].text, '');
  assert.equal(result.passages[0].figures?.length, 1); assert.equal(result.passages[0].content, 'Đoạn có ở đây');
  assert.match(result.warnings[0], /Đã gắn 3 hình/);
});

test('a picture whose marker the AI dropped, and pictures that could not be read, are reported instead of lost silently', () => {
  const result = attachWordImages({ questions: [base('Chỉ có hình [HÌNH 1]')], passages: [], warnings: [] }, [image(1), image(2)], 1);
  assert.equal(result.questions[0].figures?.length, 1);
  assert.ok(result.warnings.some(w => /hình 2\) chưa gắn được vào câu nào/.test(w)));
  assert.ok(result.warnings.some(w => /1 hình không đọc được, quá lớn hoặc quá nhiều/.test(w)));
});

test('nothing changes when the file had no pictures', () => {
  const input = { questions: [base('Giữ [HÌNH 9] nguyên văn')], passages: [], warnings: ['x'] };
  assert.equal(attachWordImages(input, []), input);
});
