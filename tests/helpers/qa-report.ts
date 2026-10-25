import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

/** Publish complete QA JSON without truncating the previous evidence while Windows readers hold it. */
export function writeQaReport(file: string, content: string) {
  const root = path.resolve('qa'), target = path.resolve(file), relative = path.relative(root, target);
  if (path.isAbsolute(relative) || relative.startsWith('..') || !/^rebuild-\d{4}-\d{2}-\d{2}[\\/][^\\/]+\.json$/.test(relative)) throw new Error('QA report path must stay in a dated QA group');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const temporary = target + '.' + randomUUID() + '.tmp';
  fs.writeFileSync(temporary, content, { encoding: 'utf8', flag: 'wx' });
  for (let attempt = 0; ; attempt++) {
    try { fs.renameSync(temporary, target); return; }
    catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (process.platform !== 'win32' || attempt >= 10 || !['UNKNOWN', 'EBUSY', 'EPERM', 'EACCES'].includes(code ?? '')) throw error;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
    }
  }
}
