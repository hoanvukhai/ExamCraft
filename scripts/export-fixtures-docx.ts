// Usage: node --import tsx scripts/export-fixtures-docx.ts [outputDir]
// Writes each multi-subject sample exam to Word in three views (exam, answers, parallel) so they can be opened and checked by eye.
import fs from 'node:fs';
import path from 'node:path';
import { normalizeExamDocument } from '../src/lib/exam-document';
import { exportExamToDocx } from '../src/lib/docx-export';

const directory = 'qa/ai-review/fixtures/da-mon', output = process.argv[2] ?? 'tmp/xuat-mau';
fs.mkdirSync(output, { recursive: true });
(async () => {
  for (const file of fs.readdirSync(directory).filter(name => name.endsWith('.json'))) {
    const exam = normalizeExamDocument(JSON.parse(fs.readFileSync(path.join(directory, file), 'utf8')));
    const name = file.replace('.json', '');
    const save = async (suffix: string, blob: Blob) => fs.writeFileSync(path.join(output, `${name}_${suffix}.docx`), Buffer.from(await blob.arrayBuffer()));
    await save('de', await exportExamToDocx(exam, false, false));
    await save('dap-an', await exportExamToDocx(exam, true, false));
    await save('song-song', await exportExamToDocx(exam, true, false, 'parallel'));
  }
  console.log(fs.readdirSync(output).length, 'files in', output);
})();
