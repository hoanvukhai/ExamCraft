import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { exportExamToDocx } from '../src/lib/docx-export';
import { parseMemoryArchive, memoryImportId } from '../src/lib/memory-document';
import { prepareLegacyExam, conflictingLegacyIds, legacySourceFingerprint } from '../src/lib/legacy-import';
import { normalizeQuestion } from '../src/lib/exam-document';
import type { Exam, QuestionType } from '../src/types/exam';
import { insertLegacyIfMissing, legacyRecords, collectLegacyBrowserExams } from '../src/lib/legacy-local';
import { portableExamBackup } from '../src/lib/portable-backup';
import { parseBackupText, splitBackupFiles } from '../src/lib/backup-files';

test('legacy source fingerprint ignores wire key order and root timestamps but keeps answer, zero points and array order', () => {
  const source = { id: 'old', createdAt: 'old', metadata: { title: 'Đề', grade: 6 }, questions: [{ content: 'A', points: 0, solution: 'B' }, { content: 'C' }] };
  const same = { questions: source.questions, metadata: { grade: 6, title: 'Đề' }, id: 'old', createdAt: 'new' };
  const before = JSON.stringify(source);
  assert.equal(legacySourceFingerprint(source), legacySourceFingerprint(same));
  for (const questions of [[{ ...source.questions[0], solution: 'Other' }, source.questions[1]], [...source.questions].reverse(), [{ ...source.questions[0], points: 1 }, source.questions[1]]]) assert.notEqual(legacySourceFingerprint(source), legacySourceFingerprint({ ...source, questions }));
  assert.equal(JSON.stringify(source), before);
});

test('legacy variants are detected by source ID and content before import, ignoring object key order', () => {
  const original = { id: 'same', metadata: { title: 'A', grade: 6 }, questions: [{ id: 'q', points: 0 }] };
  const reordered = { questions: [{ points: 0, id: 'q' }], metadata: { grade: 6, title: 'A' }, id: 'same' };
  const variant = { ...original, metadata: { ...original.metadata, title: 'B' } };
  const source = [original, reordered, variant, { ...variant, id: 'different' }, null, { content: 'No ID' }];
  const before = JSON.stringify(source);
  assert.equal(conflictingLegacyIds([original, reordered]).size, 0);
  assert.deepEqual([...conflictingLegacyIds(source)], ['same']);
  assert.equal(JSON.stringify(source), before);
});

test('backup parser accepts old archives, single exams and BOM, rejecting corrupt shapes and future versions', () => {
  const single = { metadata: { title: 'Đề cũ' }, questions: [] };
  assert.deepEqual(parseBackupText(JSON.stringify(single)), { exams: [single], questions: [] });
  for (const formatVersion of [undefined, 1, 2]) assert.deepEqual(parseBackupText('\uFEFF' + JSON.stringify({ app: 'ExamCraft', formatVersion, exams: [single], questions: [] })), { exams: [single], questions: [] });
  assert.deepEqual(parseBackupText('{"questions":[]}'), { exams: [], questions: [] });
  for (const text of ['null', '[]', '{}', '{"exams":null}', '{"exams":{}}', '{"questions":null}', '{"app":"ExamCraft","formatVersion":3,"exams":[]}']) assert.throws(() => parseBackupText(text));
  assert.throws(() => parseBackupText('{broken'), /Không đọc được JSON/);
  assert.throws(() => parseBackupText(JSON.stringify({ exams: Array(101).fill(single) })), /100 đề/);
  assert.throws(() => parseBackupText(JSON.stringify({ questions: Array(1001).fill({}) })), /1.000 câu/);
});

test('backup parser measures UTF-8 bytes at the exact boundary', () => {
  const text = JSON.stringify({ exams: [], questions: [], note: 'Đề tiếng Việt 🧮' });
  const size = new TextEncoder().encode(text).length;
  assert.ok(size > text.length); assert.doesNotThrow(() => parseBackupText(text, size));
  assert.throws(() => parseBackupText(text, size - 1), /quá lớn/);
});

test('portable archives split at 100 whole exams, preserving order, image counts and original documents', async () => {
  const source = Array.from({ length: 101 }, (_, i) => ({ ...fixture, id: `split-${i}` }));
  const before = JSON.stringify(source), archive = await portableExamBackup(source);
  const parts = splitBackupFiles(archive);
  assert.deepEqual(parts.map(p => p.examCount), [100, 1]);
  assert.deepEqual(parts.map(p => p.name), ['ExamCraft-kho-de-001-of-002.json', 'ExamCraft-kho-de-002-of-002.json']);
  assert.deepEqual(parts.flatMap(p => parseBackupText(p.text).exams), JSON.parse(JSON.stringify(archive.exams)));
  for (const part of parts) { assert.equal(part.bytes, new TextEncoder().encode(part.text).length); assert.equal(JSON.parse(part.text).embeddedImages, 0); }
  assert.equal(JSON.stringify(source), before);
});

test('portable archives split by actual bytes and refuse an oversized whole exam without changing the source', async () => {
  const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6gS8AAAAASUVORK5CYII=';
  const document = { ...fixture, questions: [{ ...fixture.questions[0], figures: [{ id: 'f', kind: 'image' as const, data: `data:image/png;base64,${png}` }] }] };
  const archive = await portableExamBackup([document, { ...document, id: 'second' }]), before = JSON.stringify(archive);
  const [whole] = splitBackupFiles(archive);
  assert.equal(splitBackupFiles(archive, { maxBytes: whole.bytes }).length, 1);
  const parts = splitBackupFiles(archive, { maxBytes: whole.bytes - 1 });
  assert.equal(parts.length, 2);
  for (const part of parts) { assert.ok(part.bytes <= whole.bytes - 1); assert.equal(JSON.parse(part.text).embeddedImages, 1); }
  assert.deepEqual(parts.flatMap(p => parseBackupText(p.text).exams), JSON.parse(JSON.stringify(archive.exams)));
  assert.throws(() => splitBackupFiles(archive, { maxBytes: parts[0].bytes - 1 }), /Một đề vượt/);
  assert.equal(JSON.stringify(archive), before);
  assert.throws(() => splitBackupFiles(archive, { maxExams: 0 }), /không hợp lệ/);
  const empty = splitBackupFiles(await portableExamBackup([]));
  assert.equal(empty.length, 1); assert.equal(empty[0].name, 'ExamCraft-kho-de.json'); assert.deepEqual(parseBackupText(empty[0].text), { exams: [], questions: [] });
});

test('portable backup embeds original image bytes once per source and restores without the old file', async () => {
  const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6gS8AAAAASUVORK5CYII=';
  const image = { id: 'img', kind: 'image' as const, data: { url: '/old-file.png' }, caption: 'Ảnh nguồn' };
  const exam: Exam = { id: 'image-backup', createdAt: 'now', updatedAt: 'now', metadata: { title: 'Ảnh', subject: 'toan', grade: 6, schoolName: '', departmentName: '', durationMinutes: 15 }, questions: [{ id: 'q', type: 'essay', difficulty: 'thong_hieu', content: 'Câu có ảnh', step_by_step_solution: 'Lời giải', figures: [image] }], passages: [{ id: 'p', content: 'Ngữ liệu', figures: [{ ...image, id: 'passage-image' }] }] };
  const before = JSON.stringify(exam); let fetches = 0;
  const archive = await portableExamBackup([exam], async () => { fetches++; return new Response(Uint8Array.from(Buffer.from(png, 'base64')), { headers: { 'Content-Type': 'image/png' } }); });
  assert.equal(fetches, 1); assert.equal(archive.embeddedImages, 2); assert.equal(JSON.stringify(exam), before);
  const restored = prepareLegacyExam(JSON.parse(JSON.stringify(archive)).exams[0]);
  const expected = `data:image/png;base64,${png}`;
  assert.equal((restored.questions[0].figures![0].data as { url: string }).url, expected);
  assert.equal(restored.passages![0].figures![0].renderedBase64, expected); assert.equal(restored.questions[0].step_by_step_solution, 'Lời giải');
  const rebuilt = await portableExamBackup([restored]); assert.equal(rebuilt.embeddedImages, 2);
});

test('portable backup refuses missing, transient, oversized and non-image assets without mutating documents', async () => {
  const exam: Exam = { id: 'bad-image', createdAt: 'now', updatedAt: 'now', metadata: { title: 'Ảnh lỗi', subject: 'toan', grade: 6, schoolName: '', departmentName: '', durationMinutes: 15 }, questions: [{ id: 'q', type: 'essay', difficulty: 'thong_hieu', content: 'Câu', step_by_step_solution: '', figures: [{ id: 'f', kind: 'image', data: '/missing.png' }] }] };
  const before = JSON.stringify(exam);
  for (const response of [new Response('Not found', { status: 404 }), new Response('<html/>', { headers: { 'Content-Type': 'text/html' } }), new Response(new Uint8Array(2 * 1024 * 1024 + 1), { headers: { 'Content-Type': 'image/png' } })]) await assert.rejects(portableExamBackup([exam], async () => response));
  await assert.rejects(portableExamBackup([exam], async () => { throw Error('Network'); }));
  await assert.rejects(portableExamBackup([{ ...exam, questions: [{ ...exam.questions[0], figures: [{ id: 'f', kind: 'image', data: 'blob:gone' }] }] }]));
  assert.equal(JSON.stringify(exam), before);
});

test('legacy local copy never overwrites an existing record and reads all libraries without changing source bytes', async () => {
  const original = { id: 'same', content: 'Newer IndexedDB content' }, rows = new Map([[original.id, original]]);
  const table = { get: async (id: string) => rows.get(id), add: async (row: typeof original) => { assert.equal(rows.has(row.id), false); rows.set(row.id, row); } };
  assert.equal(await insertLegacyIfMissing(table, { id: 'same', content: 'Older backup' }), false); assert.deepEqual(rows.get('same'), original);
  assert.equal(await insertLegacyIfMissing(table, { id: 'new', content: 'New import' }), true);
  assert.equal(await insertLegacyIfMissing(table, { id: 'new', content: 'Changed retry' }), false);
  const source = new Map([['examcraft_library', JSON.stringify([original])], ['saved_exams', JSON.stringify([{ id: 'same', content: 'Different unsaved source' }])], ['examcraft_current_exam', JSON.stringify({ id: 'current', content: 'Open draft' })]]);
  const before = JSON.stringify([...source]);
  const collected = collectLegacyBrowserExams({ getItem: key => source.get(key) ?? null }, [original]);
  assert.equal(collected.length, 3); assert.equal(collected.filter(row => row.id === 'same').length, 2); assert.equal(JSON.stringify([...source]), before);
  assert.throws(() => legacyRecords({ exams: [] })); assert.throws(() => legacyRecords([{ content: 'No ID' }]));
  assert.throws(() => collectLegacyBrowserExams({ getItem: () => '{broken' }, [original]));
});

test('linked legacy exam preserves position, zero override, passage, figures and review status without mutating source', () => {
  const source = { id: 'linked', title: 'Đề liên kết cũ', subject: 'ngu_van', grade: 6, version: 3, metadata: {}, sections: [{ id: 's', name: 'Phần riêng' }], items: [
    { position: 1, sectionId: 's', question: { id: 'b', type: 'ESSAY', difficulty: 'THONG_HIEU', content: 'Câu sau', solution: 'Lời giải sau', points: 2 } },
    { position: 0, sectionId: 's', pointsOverride: 0, question: { id: 'a', type: 'ESSAY', difficulty: 'THONG_HIEU', content: 'Câu đầu', solution: 'Lời giải đầu', points: 2, status: 'VERIFIED', verifiedBy: 'HUMAN', passageId: 'p', passage: { id: 'p', content: 'Ngữ liệu', source: 'Nguồn cũ' }, figures: [{ id: 'f', kind: 'image', data: '/fixture.png' }] } },
  ] };
  const before = JSON.stringify(source), result = prepareLegacyExam(source);
  assert.deepEqual(result.questions.map(q => q.id), ['a', 'b']); assert.equal(result.questions[0].points, 0); assert.equal(result.questions[0].sectionId, 's');
  assert.equal(result.questions[0].step_by_step_solution, 'Lời giải đầu'); assert.equal(result.passages?.[0].content, 'Ngữ liệu'); assert.equal(result.questions[0].figures?.[0].data, '/fixture.png');
  assert.equal(result.questions[0].status, 'draft'); assert.equal(result.questions[0].verifiedBy, 'none'); assert.equal(JSON.stringify(source), before);
  assert.throws(() => prepareLegacyExam({ ...source, questions: {} }), /Danh sách câu/);
  assert.throws(() => prepareLegacyExam({ ...source, items: source.items.map(i => ({ ...i, position: 0 })) }), /Vị trí câu/);
});

const types: QuestionType[] = ['matching', 'essay', 'ordering', 'multiple_choice', 'fill_blank', 'true_false_group', 'short_answer'];
const fixture: Exam = {
  id: 'export-fixture', createdAt: '2026-10-22', updatedAt: '2026-10-22',
  metadata: { title: 'Đề thử đủ dạng', subject: 'toan', grade: 6, durationMinutes: 45, schoolName: '', departmentName: '', academicYear: '' },
  passages: [{ id: 'passage', title: 'NGULIEU_TITLE', content: 'NGULIEU_CONTENT' }],
  questions: types.map((type, i) => ({ id: type, type, difficulty: 'thong_hieu', content: `SENTINEL_${type}`, points: i === 0 ? 0 : 1, step_by_step_solution: 'SOLUTION_PRIVATE',
    choices: type === 'multiple_choice' ? [{ key: 'A', text: 'OPTION_ONE' }, { key: 'B', text: 'OPTION_TWO' }] : undefined,
    sub_questions: type === 'true_false_group' ? [{ key: 'a', content: 'TF_TEXT' }] : undefined,
    matchingPairs: type === 'matching' ? [{ id: 'pair', left: 'LEFT_TEXT', right: 'RIGHT_TEXT' }] : undefined,
    correctOrder: type === 'ordering' ? ['ORDER_TWO', 'ORDER_ONE'] : undefined,
    passageId: i === 0 ? 'passage' : undefined,
  })),
};
async function xml(exam: Exam, solutions: boolean) {
  const blob = await exportExamToDocx(exam, solutions, false);
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  return zip.file('word/document.xml')!.async('string');
}

test('Word export preserves editor order, all seven types, shared passage and hides solutions on question-only export', async () => {
  const document = await xml(fixture, false);
  let previous = -1;
  for (const type of types) { const next = document.indexOf(`SENTINEL_${type}`); assert.ok(next > previous, type); previous = next; }
  for (const text of ['LEFT_TEXT', 'RIGHT_TEXT', 'ORDER_ONE', 'ORDER_TWO', 'OPTION_ONE', 'TF_TEXT', 'NGULIEU_CONTENT']) assert.ok(document.includes(text), text);
  assert.ok(!document.includes('SOLUTION_PRIVATE'));
  for (const fake of ['TRƯỜNG THPT', 'SỞ GIÁO DỤC', '0,1 điểm', 'ĐỀ THI TIÊU CHUẨN']) assert.ok(!document.includes(fake), fake);
});

test('Word solution export labels missing answers explicitly instead of inventing A or false', async () => {
  const document = await xml(fixture, true);
  assert.ok(document.includes('Đáp án đúng: Chưa đặt đáp án'));
  assert.ok(document.includes('a) Chưa có đáp án'));
  assert.ok(document.includes('SOLUTION_PRIVATE'));
  assert.ok(document.includes('Thứ tự đúng: ORDER_TWO'));
});

test('parallel Word pairs each question with its answer and keeps shared passage once', async () => {
  const before = JSON.stringify(fixture);
  const blob = await exportExamToDocx(fixture, true, false, 'parallel');
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  const document = await zip.file('word/document.xml')!.async('string');
  assert.equal(document.split('NGULIEU_CONTENT').length - 1, 1);
  assert.ok(document.includes('ĐỀ VÀ ĐÁP ÁN SONG SONG'));
  assert.ok(document.includes('<w:tblHeader'));
  for (let i = 0; i < types.length; i++) {
    const start = document.indexOf(`SENTINEL_${types[i]}`);
    const next = i + 1 < types.length ? document.indexOf(`SENTINEL_${types[i + 1]}`) : document.length;
    const answer = document.indexOf('SOLUTION_PRIVATE', start);
    assert.ok(start >= 0 && answer > start && answer < next, types[i]);
  }
  assert.ok(document.includes('LEFT_TEXT') && document.includes('ORDER_TWO'));
  assert.equal(JSON.stringify(fixture), before);
  const hidden = await exportExamToDocx(fixture, false, false, 'parallel');
  const hiddenZip = await JSZip.loadAsync(await hidden.arrayBuffer());
  assert.ok(!(await hiddenZip.file('word/document.xml')!.async('string')).includes('SOLUTION_PRIVATE'));
});

test('parallel Word limits image width while keeping aspect ratio and passage math', async () => {
  const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
  const exam = structuredClone(fixture);
  exam.passages![0].content = 'FORMULA $\\frac{1}{2}$';
  exam.questions[0].figures = [{ id: 'f', kind: 'image', data: {}, renderedBase64: `data:image/png;base64,${png}` }];
  const blob = await exportExamToDocx(exam, true, false, 'parallel');
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  const document = await zip.file('word/document.xml')!.async('string');
  const dimensions = document.match(/<wp:extent cx="(\d+)" cy="(\d+)"/);
  assert.ok(dimensions);
  assert.ok(Number(dimensions[1]) <= 230 * 9525);
  assert.ok(Math.abs(Number(dimensions[1]) / Number(dimensions[2]) - 380 / 240) < 0.01);
  assert.ok(document.includes('<m:f>'));
  assert.ok(Object.keys(zip.files).some(name => name.startsWith('word/media/')));
});

test('legacy import keeps content and zero points but cannot inherit a historical verified badge', () => {
  const result = prepareLegacyExam({ ...fixture, questions: fixture.questions.map(q => ({ ...q, status: 'verified', verifiedBy: 'human' })) });
  assert.equal(result.questions[0].points, 0);
  assert.equal(result.questions[0].status, 'draft');
  assert.equal(result.questions[0].verifiedBy, 'none');
  assert.equal(result.passages?.[0].content, 'NGULIEU_CONTENT');
});

test('portable private-memory archive validates data and derives owner-isolated idempotent identities', () => {
  const archive = parseMemoryArchive({ format: 'examcraft-private-memory', version: 1, memories: [{ category: 'STYLE', title: 'Tên', insight: 'Ghi chú', confidence: 0, isActive: true }] });
  const entry = archive.memories[0];
  assert.equal(entry.confidence, 0);
  assert.equal(memoryImportId('owner-a', entry), memoryImportId('owner-a', { ...entry, isActive: false }));
  assert.notEqual(memoryImportId('owner-a', entry), memoryImportId('owner-b', entry));
  assert.throws(() => parseMemoryArchive({ format: 'examcraft-private-memory', version: 1, memories: [{ category: 'STYLE', title: 'T', insight: '' }] }));
});

test('question validator rejects malformed collections and duplicate labels without accepting misleading answer values', () => {
  const base = fixture.questions[3];
  assert.throws(() => normalizeQuestion({ ...base, choices: { A: 'broken' } }));
  assert.throws(() => normalizeQuestion({ ...base, choices: [{ key: 'A', text: '1' }, { key: 'A', text: '2' }] }));
  assert.throws(() => normalizeQuestion({ ...base, type: 'true_false_group', sub_questions: [{ key: 'a', content: 'Text', isCorrect: 'false' }] }));
  assert.throws(() => normalizeQuestion({ ...base, rubric: [{ criterion: 'Tiêu chí', maxPoints: -1 }] }));
});

test('Word keeps custom section names and passage source, and refuses an empty variation table', async () => {
 const exam = structuredClone(fixture);
 exam.sections = [{ id: 'part-one', name: 'PHAN_TU_DAT' }];
 exam.questions[0].sectionId = 'part-one';
 exam.passages![0].source = 'NGUON_NGULIEU';
 const document = await xml(exam, false);
 assert.ok(document.includes('PHAN_TU_DAT'));
 assert.ok(document.includes('NGUON_NGULIEU'));
 exam.questions[0].figures = [{ id: 'empty-variation', kind: 'variation_table', data: { xValues: [], yPrimeSigns: [], yValues: [] } }];
 await assert.rejects(xml(exam, false), /chưa đủ dữ liệu/);
});
