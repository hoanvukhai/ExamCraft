import test from 'node:test';
import assert from 'node:assert/strict';
import { memoriesToMarkdown, parseMemoryArchive } from '../src/lib/memory-document';

const note = { title: 'Ưu tiên bối cảnh thực tế', insight: 'Dùng tình huống đời sống.', subject: 'toan', category: 'REAL_WORLD_CONTEXT', confidence: 0.9, sourceAction: 'AI_ANALYSIS_PENDING', isActive: false,
  evidence: 'Một cửa hàng giảm giá 20%', uncertainty: 'Chỉ có một câu mẫu.', sourceRef: { kind: 'exam', examId: 'e1', examTitle: 'Đề 15 phút', examVersion: 3, questionIds: ['q1', 'q2'], analyzedAt: '2026-10-26T01:00:00.000Z' } };

test('the readable copy keeps source, evidence, doubts and the AI confidence label next to each note', () => {
  const md = memoriesToMarkdown([note]);
  assert.match(md, /^## Ưu tiên bối cảnh thực tế$/m);
  assert.match(md, /Nguồn: một đề; đề "Đề 15 phút" phiên bản 3 \(mã e1\); câu: q1, q2; phân tích lúc 2026-10-26/);
  assert.match(md, /Bằng chứng: Một cửa hàng giảm giá 20%/);
  assert.match(md, /Điều chưa chắc: Chỉ có một câu mẫu\./);
  assert.match(md, /độ tin cậy AI tự báo: 0\.9 \(không phải xác nhận\)/);
  assert.match(md, /đang tắt/);
});

test('missing source, evidence or doubts are said to be missing, never filled in', () => {
  const md = memoriesToMarkdown([{ ...note, sourceAction: 'MANUAL_NOTE', evidence: null, uncertainty: '  ', sourceRef: null, isActive: true }]);
  assert.match(md, /Nguồn: không ghi/); assert.match(md, /Bằng chứng: chưa ghi/); assert.match(md, /Điều chưa chắc: chưa ghi/);
  assert.ok(!md.includes('độ tin cậy AI'), 'a hand-written note has no AI confidence');
  assert.match(memoriesToMarkdown([]), /Chưa có ghi chú/);
});

test('an exported archive with the new fields is read back with them intact', () => {
  const archive = parseMemoryArchive({ format: 'examcraft-private-memory', version: 1, memories: [note] });
  assert.equal(archive.memories[0].evidence, note.evidence); assert.deepEqual(archive.memories[0].sourceRef, note.sourceRef);
  const old = parseMemoryArchive({ format: 'examcraft-private-memory', version: 1, memories: [{ category: 'X', title: 'Cũ', insight: 'Bản xuất cũ' }] });
  assert.equal(old.memories[0].evidence, undefined, 'older exports without the new fields still import');
});
