// Manual sweep across catalog subjects against the REAL provider with temporary keys. Never part of CI.
// Usage: EVAL_KEYS_FILE=<file> [EVAL_ONLY=subject1,subject2] node --import tsx scripts/real-ai-eval-subjects.ts
// Needs the isolated test server started with EXAMCRAFT_REAL_AI=1. One report file is written per run and never holds a key.
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { requireTestDatabase } from '../tests/helpers/test-database';

const origin = process.env.EVAL_ORIGIN ?? 'http://127.0.0.1:3117';
const keys = fs.readFileSync(process.env.EVAL_KEYS_FILE ?? '', 'utf8').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
if (!keys.length) throw new Error('EVAL_KEYS_FILE is required');
const db = new PrismaClient({ datasources: { db: { url: requireTestDatabase() } }, log: [] });
type Json = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any -- loose provider JSON in an evaluation script
let cookie = '', keyIndex = 0, calls = 0, refusals = 0, streak429 = 0, quotaStop = false;
const refusalStatuses: Record<string, number> = {};

async function post(path: string, body: unknown) {
  const response = await fetch(origin + path, { method: 'POST', headers: { Origin: origin, Cookie: cookie, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return { status: response.status, data: await response.json().catch(() => ({})) as Json };
}
async function ai(path: string, body: Json) {
  let last = { status: 0, data: {} as Json };
  for (let attempt = 0; attempt < keys.length * 2; attempt++) {
    calls++; last = await post(path, { ...body, customApiKey: keys[keyIndex++ % keys.length] });
    if (last.status === 200) return last;
    refusals++; refusalStatuses[String(last.status)] = (refusalStatuses[String(last.status)] ?? 0) + 1;
    streak429 = last.status === 429 ? streak429 + 1 : 0;
    if (streak429 >= keys.length) { quotaStop = true; return last; } // every key refused in a row: stop spending calls
    if (![429, 500, 502, 503, 504].includes(last.status)) return last;
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  return last;
}

type Case = { subject: string; grade: number; topic: string; extra?: Json; mc?: number; sa?: number; essay?: number; tf?: number };
const cases: Case[] = [
  { subject: 'tieng_viet', grade: 3, topic: 'Từ chỉ sự vật, dấu chấm và dấu phẩy', mc: 2, sa: 1 },
  { subject: 'toan', grade: 9, topic: 'Căn bậc hai và hàm số bậc nhất', mc: 2, sa: 1, tf: 1 },
  { subject: 'tieng_anh', grade: 8, topic: 'Past simple and present perfect', mc: 3, sa: 1 },
  { subject: 'tin_hoc', grade: 8, topic: 'Thuật toán, biến và câu lệnh điều kiện trong Python', mc: 2, sa: 1, tf: 1 },
  { subject: 'cong_nghe', grade: 7, topic: 'Trồng trọt: giống cây và kĩ thuật gieo hạt', mc: 3 },
  { subject: 'khoa_hoc', grade: 5, topic: 'Sự biến đổi của chất', mc: 3, sa: 1 },
  { subject: 'khtn', grade: 7, topic: 'Nguyên tử, phân tử và tốc độ chuyển động', mc: 3, sa: 1 },
  { subject: 'lich_su_dia_ly', grade: 7, topic: 'Việt Nam thời Trần và khí hậu châu Á', mc: 3, tf: 1 },
  { subject: 'ngu_van', grade: 8, topic: 'Đọc hiểu một đoạn văn tả cảnh và biện pháp tu từ', mc: 2, essay: 1 },
  { subject: 'giao_duc_cong_dan', grade: 7, topic: 'Tôn trọng sự thật và bảo vệ di sản văn hóa', mc: 3, tf: 1 },
  { subject: 'lich_su', grade: 11, topic: 'Chiến tranh thế giới thứ nhất', mc: 3, tf: 1 },
  { subject: 'dia_ly', grade: 10, topic: 'Khí quyển và các đới khí hậu trên Trái Đất', mc: 3, sa: 1 },
  { subject: 'sinh_hoc', grade: 11, topic: 'Trao đổi chất và chuyển hóa năng lượng ở thực vật', mc: 3, tf: 1 },
  { subject: 'gdkt_pl', grade: 10, topic: 'Cung cầu và thị trường', mc: 3 },
  { subject: 'giao_duc_quoc_phong_an_ninh', grade: 10, topic: 'Truyền thống chống ngoại xâm của dân tộc', mc: 3 },
  { subject: 'am_nhac', grade: 6, topic: 'Nhạc cụ và nhịp điệu cơ bản', extra: { assessmentMode: 'comment_only' }, mc: 1, essay: 1 },
  { subject: 'mi_thuat', grade: 6, topic: 'Màu sắc và bố cục tranh', extra: { assessmentMode: 'comment_only' }, mc: 1, essay: 1 },
  { subject: 'giao_duc_the_chat', grade: 7, topic: 'Khởi động và kĩ thuật chạy cự li ngắn', extra: { assessmentMode: 'comment_only' }, mc: 1, essay: 1 },
  { subject: 'hoat_dong_trai_nghiem', grade: 4, topic: 'Giữ gìn vệ sinh lớp học', extra: { assessmentMode: 'comment_only' }, mc: 1, essay: 1 },
  { subject: 'ngoai_ngu_khac', grade: 10, topic: 'Giới thiệu bản thân và gia đình', extra: { language: 'Pháp', languageRole: 'NN2' }, mc: 3 },
  { subject: 'tieng_dan_toc', grade: 3, topic: 'Chào hỏi và giới thiệu bản thân', extra: { language: 'Raglai', languageRole: 'ETHNIC' }, mc: 2 },
];
const only = process.env.EVAL_ONLY?.split(',').filter(Boolean);

(async () => {
  const health = await fetch(origin + '/api/health').then(r => r.json()); if (health.isolatedTest !== true) throw new Error('Refusing to run without proof of the isolated test server.');
  const uid = 'realsub_' + randomUUID(), password = 'fixture-' + randomUUID();
  await db.user.create({ data: { id: uid, email: uid + '@example.invalid', name: 'Real AI subjects', passwordHash: await bcrypt.hash(password, 10), mustChangePassword: false, aiDailyLimit: 800 } });
  const report: Json = { startedAt: new Date().toISOString(), environment: 'isolated test server, test database, real provider with temporary keys', subjects: [] };
  try {
    const login = await fetch(origin + '/api/auth/login', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: uid + '@example.invalid', password }) });
    cookie = login.headers.getSetCookie().map(value => value.split(';')[0]).join('; ');
    for (const item of cases.filter(c => !only || only.includes(c.subject))) {
      if (quotaStop) { console.log('stopped: every key reports its quota is used up'); break; }
      const plan = { subject: item.subject, grade: item.grade, topic: item.topic, durationMinutes: 20, numMultipleChoice: item.mc ?? 0, numTrueFalse: item.tf ?? 0, numShortAnswer: item.sa ?? 0, numEssay: item.essay ?? 0, ...item.extra };
      const r = await ai('/api/generate-exam', { params: plan });
      const questions: Json[] = r.data.exam?.questions ?? [];
      const count = (type: string) => questions.filter(q => q.type === type).length;
      const entry: Json = { subject: item.subject, grade: item.grade, status: r.status, error: r.data.error, matchesPlan: r.status === 200 && count('multiple_choice') === plan.numMultipleChoice && count('true_false_group') === plan.numTrueFalse && count('short_answer') === plan.numShortAnswer && count('essay') === plan.numEssay,
        anyHuman: questions.some(q => q.verifiedBy === 'human'), warnings: r.data.warnings, verification: [], questions: questions.map(q => ({ type: q.type, content: q.content, key: q.correct_answer, choices: q.choices?.map((c: Json) => `${c.key}. ${c.text}`), tf: q.sub_questions?.map((s: Json) => `${s.key}:${s.isCorrect}`) })) };
      if (r.status === 200 && (plan as Json).assessmentMode !== 'comment_only') for (const q of ['multiple_choice', 'short_answer'].map(type => r.data.exam.questions.find((x: Json) => x.type === type)).filter(Boolean)) { // one of each type keeps the daily provider quota for more subjects
        const v = await ai('/api/verify-question', { question: q });
        entry.verification.push({ type: q.type, keyed: q.correct_answer, solved: v.data.solvedAnswer, isMatch: v.data.isMatch, recommendation: v.data.recommendation, status: v.status });
      }
      report.subjects.push(entry);
      console.log(item.subject, r.status, entry.matchesPlan ? 'match' : 'NO-MATCH', entry.verification.filter((v: Json) => v.isMatch).length + '/' + entry.verification.length);
    }
  } finally {
    report.finishedAt = new Date().toISOString(); report.providerCalls = calls; report.providerRefusals = refusals; report.refusalStatuses = refusalStatuses;
    const raw = JSON.stringify(report, null, 2);
    if (keys.some(key => raw.includes(key))) throw new Error('A key appeared in the report; refusing to write it.');
    fs.writeFileSync('qa/rebuild-2026-10-25/real_ai_eval_subjects_' + new Date().toISOString().replace(/[-:]/g, '').slice(0, 13) + '.json', raw);
    await db.aiUsageLog.deleteMany({ where: { userId: uid } }); await db.auditLog.deleteMany({ where: { actorId: uid } }); await db.user.deleteMany({ where: { id: uid } }); await db.$disconnect();
    console.log(`done: ${calls} provider calls, ${refusals} refusals; report written`);
  }
})().catch(error => { console.error('eval failed:', String(error?.message ?? error).slice(0, 300)); process.exitCode = 1; });
