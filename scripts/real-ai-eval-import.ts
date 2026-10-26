// Manual evaluation of Word and image import against the REAL provider with temporary keys. Never part of CI.
// Usage: EVAL_KEYS_FILE=<file> [EVAL_IMAGE=<png>] node --import tsx scripts/real-ai-eval-import.ts   (isolated test server started with EXAMCRAFT_REAL_AI=1)
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { requireTestDatabase } from '../tests/helpers/test-database';
import { normalizeExamDocument } from '../src/lib/exam-document';
import { exportExamToDocx } from '../src/lib/docx-export';

const origin = process.env.EVAL_ORIGIN ?? 'http://127.0.0.1:3117';
const keys = fs.readFileSync(process.env.EVAL_KEYS_FILE ?? '', 'utf8').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
if (!keys.length) throw new Error('EVAL_KEYS_FILE is required');
const db = new PrismaClient({ datasources: { db: { url: requireTestDatabase() } }, log: [] });
type Json = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any -- loose provider JSON in an evaluation script
let cookie = '', keyIndex = 0, calls = 0, refusals = 0;

async function post(path: string, body: unknown) {
  const response = await fetch(origin + path, { method: 'POST', headers: { Origin: origin, Cookie: cookie, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return { status: response.status, data: await response.json().catch(() => ({})) as Json };
}
async function ai(path: string, body: Json) {
  let last = { status: 0, data: {} as Json };
  for (let attempt = 0; attempt < keys.length * 2; attempt++) {
    calls++; last = await post(path, { ...body, customApiKey: keys[keyIndex++ % keys.length] });
    if (last.status === 200) return last;
    refusals++; if (![429, 500, 502, 503, 504].includes(last.status)) return last;
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  return last;
}
const toBase64 = async (blob: Blob) => Buffer.from(await blob.arrayBuffer()).toString('base64');
const mcq = (n: number, extra = '') => ({ id: randomUUID(), type: 'multiple_choice', difficulty: 'thong_hieu', content: `Câu mẫu số ${n}: Tính $${n}+${n * 2}$.${extra}`, choices: [n * 3, n * 3 + 1, n * 3 + 2, n * 3 - 1].map((value, i) => ({ key: 'ABCD'[i], text: String(value) })), correct_answer: 'A', points: 0.25, step_by_step_solution: '' });

(async () => {
  const health = await fetch(origin + '/api/health').then(r => r.json()); if (health.isolatedTest !== true) throw new Error('Refusing to run without proof of the isolated test server.');
  const uid = 'realimp_' + randomUUID(), password = 'fixture-' + randomUUID();
  await db.user.create({ data: { id: uid, email: uid + '@example.invalid', name: 'Real AI import', passwordHash: await bcrypt.hash(password, 10), mustChangePassword: false, aiDailyLimit: 500 } });
  const report: Json = { startedAt: new Date().toISOString(), environment: 'isolated test server, test database, real provider with temporary keys', cases: [] };
  try {
    const login = await fetch(origin + '/api/auth/login', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: uid + '@example.invalid', password }) });
    cookie = login.headers.getSetCookie().map(value => value.split(';')[0]).join('; ');
    const now = new Date().toISOString();
    const word = async (label: string, questions: Json[], passages: Json[] = []) => {
      const exam = normalizeExamDocument({ id: randomUUID(), metadata: { title: 'Nhập thử ' + label, subject: 'toan', grade: 6, durationMinutes: 45, schoolName: 'Trường thử', departmentName: '' }, passages, questions, createdAt: now, updatedAt: now });
      const docx = await toBase64(await exportExamToDocx(exam, false, false));
      const r = await ai('/api/parse-docx', { docxBase64: docx });
      const got: Json[] = r.data.questions ?? [];
      report.cases.push({ label, sent: questions.length, status: r.status, error: r.data.error, received: got.length, passagesReceived: (r.data.passages ?? []).length, warnings: r.data.warnings, anyHuman: got.some(q => q.verifiedBy === 'human'), allDraft: got.every(q => q.status === 'draft'),
        allImported: got.every(q => q.importedFromFile === true), withSource: got.filter(q => q.source).length, formulasKept: got.filter(q => /\$/.test(q.content)).length, contentSample: got.slice(0, 2).map(q => String(q.content).slice(0, 80)), duplicateContents: got.length - new Set(got.map(q => q.content)).size,
        missingNumbers: Array.from({ length: questions.length }, (_, i) => i + 1).filter(n => !got.some(q => String(q.content).includes(`số ${n}:`))) });
    };
    await word('20 câu', Array.from({ length: 20 }, (_, i) => mcq(i + 1)));
    await word('60 câu có ngữ liệu', Array.from({ length: 60 }, (_, i) => mcq(i + 1)), [{ id: 'p1', title: 'Đoạn dùng chung', content: 'Một cửa hàng bán 12 cái bút giá 5 000 đồng mỗi cái.' }]);
    const image = process.env.EVAL_IMAGE ? fs.readFileSync(process.env.EVAL_IMAGE).toString('base64') : '';
    if (image) {
      const r = await ai('/api/ocr-exam-image', { imageBase64: image, mimeType: 'image/png' });
      const got: Json[] = r.data.questions ?? [];
      report.cases.push({ label: 'ảnh đề in 3 câu', status: r.status, error: r.data.error, received: got.length, types: got.map(q => q.type), answers: got.map(q => q.correct_answer ?? null), anyHuman: got.some(q => q.verifiedBy === 'human'), allDraft: got.every(q => q.status === 'draft'), contents: got.map(q => String(q.content).slice(0, 90)), choicesCounts: got.map(q => q.choices?.length ?? 0), warnings: r.data.warnings });
    }
  } finally {
    report.finishedAt = new Date().toISOString(); report.providerCalls = calls; report.providerRefusals = refusals;
    const raw = JSON.stringify(report, null, 2);
    if (keys.some(key => raw.includes(key))) throw new Error('A key appeared in the report; refusing to write it.');
    fs.writeFileSync('qa/rebuild-2026-10-25/real_ai_eval_import_' + new Date().toISOString().replace(/[-:]/g, '').slice(0, 13) + '.json', raw); // one file per run, so a blocked run never overwrites a good report
    await db.aiUsageLog.deleteMany({ where: { userId: uid } }); await db.auditLog.deleteMany({ where: { actorId: uid } }); await db.user.deleteMany({ where: { id: uid } }); await db.$disconnect();
    console.log(`done: ${calls} provider calls, ${refusals} refusals; report written`);
  }
})().catch(error => { console.error('eval failed:', String(error?.message ?? error).slice(0, 300)); process.exitCode = 1; });
