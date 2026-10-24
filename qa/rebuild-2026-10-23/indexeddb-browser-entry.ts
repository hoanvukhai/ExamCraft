import { db, dbImportDatabaseFromJson, dbExportDatabaseToJson } from '../../src/lib/db';
import type { Exam, Question } from '../../src/types/exam';

const button = document.querySelector<HTMLButtonElement>('#run')!;
const output = document.querySelector<HTMLElement>('#result')!;
const assert = (condition: unknown, message: string) => { if (!condition) throw Error(message); };
button.onclick = async () => {
  button.disabled = true;
  const results: { name: string; status: string }[] = [];
  const marker = 'qa-indexeddb-20261023';
  try {
    if (location.origin !== 'http://127.0.0.1:3121') throw Error('QA origin mismatch');
    const ownership = await db.configs.get(marker);
    if (!ownership && (await db.exams.count() || await db.questions.count() || localStorage.length)) throw Error('Refusing unknown browser data');
    await db.configs.put({ key: marker, value: true, updatedAt: new Date().toISOString() });
    const prefix = crypto.randomUUID();
    const exam: Exam = { id: prefix, createdAt: '2026-10-23', updatedAt: '2026-10-23', metadata: { title: 'QA bản local mới hơn', subject: 'toan', grade: 6, durationMinutes: 15, schoolName: '', departmentName: '' }, questions: [] };
    const question: Question = { id: `${prefix}-q`, type: 'essay', difficulty: 'thong_hieu', content: 'QA câu gốc', step_by_step_solution: 'QA lời giải', points: 0 };
    await db.exams.add(exam); await db.questions.add(question);
    const archive = JSON.stringify({ exams: [{ ...exam, metadata: { ...exam.metadata, title: 'Bản cũ phải không ghi đè' } }, { ...exam, id: `${prefix}-new` }], questions: [{ ...question, content: 'Bản cũ phải không ghi đè' }, { ...question, id: `${prefix}-q-new` }] });
    const counts = await dbImportDatabaseFromJson(archive);
    assert(counts.examsCount === 1 && counts.questionsCount === 1, 'Wrong added counts');
    assert(JSON.stringify(await db.exams.get(exam.id)) === JSON.stringify(exam), 'Existing exam overwritten');
    assert(JSON.stringify(await db.questions.get(question.id)) === JSON.stringify(question), 'Existing question overwritten');
    const repeated = await dbImportDatabaseFromJson(archive);
    assert(repeated.examsCount === 0 && repeated.questionsCount === 0, 'Retry duplicated records');
    results.push({ name: 'Actual IndexedDB preserves old IDs and retries across both stores', status: 'PASS' });

    const faultId = `${prefix}-q-fault`;
    const rejectQuestion = (_key: unknown, value: Question) => { if (value.id === faultId) throw Error('Intentional QA transaction failure'); };
    db.questions.hook('creating', rejectQuestion);
    let rejected = false;
    try { await dbImportDatabaseFromJson(JSON.stringify({ exams: [{ ...exam, id: `${prefix}-rollback` }], questions: [{ ...question, id: faultId }] })); }
    catch { rejected = true; }
    finally { db.questions.hook('creating').unsubscribe(rejectQuestion); }
    assert(rejected, 'Fault was not surfaced');
    assert(!await db.exams.get(`${prefix}-rollback`) && !await db.questions.get(faultId), 'Partial transaction survived failure');
    assert(JSON.stringify(await db.exams.get(exam.id)) === JSON.stringify(exam), 'Failure changed existing record');
    results.push({ name: 'Actual IndexedDB rolls back exam insert when question-store write fails', status: 'PASS' });

    localStorage.setItem('examcraft_library', JSON.stringify([exam]));
    const variant = { ...exam, metadata: { ...exam.metadata, title: 'QA cùng ID khác nội dung' } };
    localStorage.setItem('saved_exams', JSON.stringify([variant]));
    localStorage.setItem('examcraft_current_exam', JSON.stringify({ ...exam, id: `${prefix}-current` }));
    const before = ['examcraft_library', 'saved_exams', 'examcraft_current_exam'].map(key => localStorage.getItem(key));
    const exported = JSON.parse(await dbExportDatabaseToJson());
    assert(exported.exams.filter((e: Exam) => e.id === prefix).length === 2, 'Variant was silently dropped');
    assert(exported.exams.some((e: Exam) => e.id === `${prefix}-current`), 'Current draft missing');
    assert(JSON.stringify(before) === JSON.stringify(['examcraft_library', 'saved_exams', 'examcraft_current_exam'].map(key => localStorage.getItem(key))), 'Export mutated sources');
    results.push({ name: 'Actual IndexedDB export reads all historical sources and keeps differing same-ID variants', status: 'PASS' });

    const beforeInvalid = await db.exams.count();
    try { await dbImportDatabaseFromJson(JSON.stringify({ exams: [{ ...exam, id: `${prefix}-invalid` }], questions: null })); throw Error('Invalid collection accepted'); }
    catch (error) { assert(error instanceof Error && error.message !== 'Invalid collection accepted', 'Invalid collection accepted'); }
    assert(await db.exams.count() === beforeInvalid, 'Invalid input partially imported');
    results.push({ name: 'Malformed collection rejected before any IndexedDB write', status: 'PASS' });
    output.textContent = JSON.stringify({ status: 'PASS', origin: location.origin, engine: 'real browser IndexedDB + Dexie', results, scope: 'QA origin only; no PostgreSQL or AI', productionImportConflictResolution: 'Not verified: source variants kept by export, server handling remains separate' }, null, 2);
  } catch (error) { output.textContent = JSON.stringify({ status: 'FAIL', results, error: error instanceof Error ? error.message : String(error) }, null, 2); }
  finally { button.disabled = false; }
};
