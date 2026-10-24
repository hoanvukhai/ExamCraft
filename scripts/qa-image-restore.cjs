// Exercises the real isolated HTTP API; no browser manipulation or main DB writes.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const { portableExamBackup } = require('../src/lib/portable-backup.ts');
const origin = 'http://127.0.0.1:3117', directory = path.resolve('qa/rebuild-2026-10-23');
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
(async () => {
  const report = { checkedAt: new Date().toISOString(), status: 'INCOMPLETE', sourceMovedNotDeleted: false, mainDatabaseMutations: false, realAiCalls: false };
  try {
    const health = await (await fetch(origin + '/api/health')).json();
    if (health.isolatedTest !== true) throw Error('Refusing writes: server not isolated');
    const login = await fetch(origin + '/api/auth/login', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'qa_browser_2@example.invalid', password: 'ExamCraft-local-fixture-2026' }) });
    if (!login.ok) throw Error('Fixture login failed');
    const cookie = login.headers.getSetCookie().map(c => c.split(';')[0]).join('; ');
    const request = async (url, body) => {
      const response = await fetch(origin + url, { method: body === undefined ? 'GET' : 'POST', headers: { Cookie: cookie, Origin: origin, 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
      const result = await response.json(); if (!response.ok) throw Error(`Fixture HTTP failure ${response.status}`); return result;
    };
    const fixture = JSON.parse(fs.readFileSync(path.join(directory, 'image-import-fixture.json'), 'utf8'));
    const source = JSON.parse(fs.readFileSync(path.join(directory, 'image-source.json'), 'utf8'));
    const preview = await request('/api/migration/import-legacy', { ...fixture, dryRun: true });
    if (preview.errorCount !== 1) throw Error('Expected one invalid item');
    const imported = await request('/api/migration/import-legacy', { ...fixture, dryRun: false });
    const entry = imported.results.find(r => r.kind === 'exam' && r.index === 0 && r.id);
    if (!entry) throw Error('Image fixture was not imported');
    const original = (await request(`/api/exams/${entry.id}`)).document;
    const archive = await portableExamBackup([original], (sourceUrl, options) => fetch(new URL(sourceUrl, origin), options));
    fs.writeFileSync(path.join(directory, 'image-portable-backup.json'), JSON.stringify(archive, null, 2));
    const absolute = path.resolve(source.path), preserved = path.join(directory, 'image-source-preserved.png');
    if (absolute !== path.resolve('public/qa-image-restore-20261023.png') || !absolute.startsWith(path.resolve('public') + path.sep)) throw Error('Unexpected fixture source path');
    if (digest(fs.readFileSync(absolute)) !== source.sha256 || fs.existsSync(preserved)) throw Error('Source mismatch or preserved fixture already exists');
    fs.renameSync(absolute, preserved); report.sourceMovedNotDeleted = true;
    const unavailable = await fetch(origin + '/qa-image-restore-20261023.png');
    if (unavailable.ok) throw Error('Source image still available; cannot prove restore independence');
    const restore = await request('/api/migration/import-legacy', { exams: archive.exams, dryRun: false });
    const restoredId = restore.results.find(r => r.id)?.id;
    if (!restoredId || restoredId === original.id) throw Error('Expected independent restored exam');
    const restored = (await request(`/api/exams/${restoredId}`)).document;
    const inline = restored.questions[0].figures[0].data.url;
    if (!inline.startsWith('data:image/png;base64,')) throw Error('Restored image is not embedded');
    const restoredHash = digest(Buffer.from(inline.split(',')[1], 'base64'));
    if (restoredHash !== source.sha256 || restored.questions[0].step_by_step_solution !== original.questions[0].step_by_step_solution || restored.questions[0].points !== 0) throw Error('Restored bytes, solution or zero points changed');
    const originalAfter = (await request(`/api/exams/${original.id}`)).document;
    if (JSON.stringify(originalAfter) !== JSON.stringify(original)) throw Error('Original exam changed');
    Object.assign(report, { status: 'PASS', originalExamId: original.id, restoredExamId: restoredId, sourceHttpStatusAfterMove: unavailable.status, originalImageSha256: source.sha256, restoredImageSha256: restoredHash, bytes: source.bytes, embeddedImages: archive.embeddedImages, originalExamUnchanged: true, zeroPointsAndSolutionRetained: true, database: 'examcraft_test_20261022', archive: 'image-portable-backup.json', preservedSource: 'image-source-preserved.png', method: 'API and production backup helper, not browser export/import proof' });
    console.log(JSON.stringify({ status: report.status, restoredUrl: `${origin}/editor/${restoredId}`, sameImageBytes: true }));
  } catch (error) { report.error = error instanceof Error ? error.message : 'Unknown fixture failure'; process.exitCode = 1; console.error('Image restore QA did not complete; see scoped report.'); }
  finally { fs.writeFileSync(path.join(directory, 'image-restore-api.json'), JSON.stringify(report, null, 2)); }
})();
