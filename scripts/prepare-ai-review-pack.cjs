// Export only an explicit, tracked source allowlist. Never package the working tree or runtime data.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const files = [
  'AGENTS.md', 'package.json', 'next.config.ts', 'tsconfig.json', 'prisma/schema.prisma',
  'docs/ban-giao/00_DOC_TRUOC.md', 'docs/ban-giao/01_BAN_DO_MA_NGUON.md', 'docs/ban-giao/02_TRANG_THAI_TIEP_NOI.md',
  'docs/ke-hoach-2026-10-21/03_CHECKLIST.md',
  'qa/rebuild-2026-10-23/SHARE_COPY.md', 'qa/rebuild-2026-10-23/STUDENT_DRAFT_JOURNAL.md',
  'qa/rebuild-2026-10-23/MANUAL_GRADE_CAS_AND_HISTORY.md', 'qa/rebuild-2026-10-23/ASSIGNMENT_ACCESS_AND_STUDENT_FLOW.md',
  'src/app/a/[publicId]/page.tsx', 'src/app/share/[id]/page.tsx', 'src/app/teacher/assignments/[id]/page.tsx',
  'src/app/api/public/share/[id]/copy/route.ts', 'src/app/api/public/share/[id]/route.ts',
  'src/app/api/public/assignments/[publicId]/start/route.ts', 'src/app/api/public/attempts/[id]/draft/route.ts',
  'src/app/api/public/attempts/[id]/submit/route.ts', 'src/app/api/teacher/attempts/[id]/route.ts',
  'src/components/ShareModal.tsx', 'src/components/StudentResultsModal.tsx', 'src/hooks/usePinnedAccount.ts',
  'src/types/exam.ts', 'src/lib/share-copy.ts', 'src/lib/exam-persistence.ts', 'src/lib/exam-document.ts',
  'src/lib/public-exam.ts', 'src/lib/attempt-access.ts', 'src/lib/attempt-layout.ts', 'src/lib/attempt-draft-revision.ts',
  'src/lib/structured-question.ts', 'src/lib/student-response-text.ts', 'src/lib/student-draft-journal.ts',
  'src/lib/manual-grade-revision.ts', 'src/lib/manual-grading.ts', 'src/lib/attempt-grading.ts',
  'src/lib/api-error.ts', 'src/lib/auth.ts', 'src/lib/prisma.ts', 'src/lib/request-account.ts',
  'src/lib/request-auth.ts', 'src/lib/account-fetch.ts',
  'tests/share_copy.test.ts', 'tests/student_draft_journal.test.ts', 'tests/manual_grade_revision.test.ts',
  'tests/http_workflows.test.ts',
];
const git = args => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
try {
  const commit = git(['rev-parse', 'HEAD']);
  for (const file of files) {
    const source = git(['show', `${commit}:${file}`]);
    if (/(?:AIza[A-Za-z0-9_-]{30,}|AQ\.[A-Za-z0-9_-]{30,}|sk-[A-Za-z0-9_-]{30,}|-----BEGIN [A-Z ]*PRIVATE KEY-----)/.test(source)) throw Error('Credential-like content in allowlist; no archive created.');
  }
  const output = path.join('qa', 'ai-review', `EXAMCRAFT_REVIEW_${commit.slice(0, 7)}.zip`);
  if (fs.existsSync(output)) throw Error('Snapshot archive already exists; keep it or choose a new Git baseline.');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  git(['archive', '--format=zip', `--output=${output}`, commit, '--', ...files]);
  fs.writeFileSync(path.join('qa', 'ai-review', `MANIFEST_${commit.slice(0, 7)}.json`), JSON.stringify({ generatedAt: new Date().toISOString(), commit, files, source: 'tracked Git snapshot only', excludes: ['.env', 'keys', 'cookies', 'backups', 'database dumps', 'uploads', 'node_modules', '.git'] }, null, 2));
  console.log(`Prepared ${files.length} allowlisted source files; snapshot ${commit.slice(0, 7)}; archive ${fs.statSync(output).size} bytes.`);
} catch (error) {
  console.error(error.message.startsWith('Credential-like') || error.message.startsWith('Snapshot archive') ? error.message : 'Could not prepare the allowlisted review snapshot; no secret output printed.');
  process.exitCode = 1;
}
