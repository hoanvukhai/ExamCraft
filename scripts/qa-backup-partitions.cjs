// Disposable fixtures only. Prove isolated server mode before every API write.
const fs = require('node:fs');
const origin = 'http://127.0.0.1:3117';
async function main() {
  const health = await fetch(origin + '/api/health').then(r => r.json());
  if (health.isolatedTest !== true) throw Error('Refusing fixture writes outside isolated test server.');
  const login = await fetch(origin + '/api/auth/login', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'qa_browser_2@example.invalid', password: 'ExamCraft-local-fixture-2026' }) });
  if (!login.ok) throw Error('Fixture login failed.');
  const cookie = login.headers.getSetCookie().map(v => v.split(';')[0]).join('; ');
  const now = new Date().toISOString();
  const exams = Array.from({ length: 94 }, (_, i) => ({ id: `qa-backup-part-${i}-20261023`, createdAt: now, updatedAt: now, metadata: { title: `QA chia kho ${String(i + 1).padStart(3, '0')}`, subject: 'toan', grade: 6, durationMinutes: 15, schoolName: '', departmentName: '' }, questions: [] }));
  const response = await fetch(origin + '/api/migration/import-legacy', { method: 'POST', headers: { Origin: origin, Cookie: cookie, 'Content-Type': 'application/json' }, body: JSON.stringify({ exams, questions: [], dryRun: false }) });
  const result = await response.json();
  if (!response.ok || result.errorCount) throw Error('Fixture import refused.');
  fs.writeFileSync('qa/rebuild-2026-10-23/backup-partitions-seed.json', JSON.stringify({ isolated: true, createdOrAlreadyPresent: result.results.length, results: result.results }, null, 2));
  fs.writeFileSync('qa/rebuild-2026-10-23/corrupt-backup-fixture.json', '{"exams": [ this is intentionally broken QA JSON');
  console.log('94 disposable fixture exams present in isolated QA account; corrupt file fixture prepared.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
