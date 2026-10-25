import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(path.join(dir, entry.name)) : /\.(ts|tsx)$/.test(entry.name) ? [path.join(dir, entry.name)] : []);
}
const files = walk('src').map(file => ({ file: file.replaceAll('\\', '/'), text: fs.readFileSync(file, 'utf8') }));
const providerFiles = files.filter(({ text }) => /new GoogleGenAI\(/.test(text));

test('provider clients are only created in the known places', () => {
  assert.deepEqual(providerFiles.map(item => item.file).sort(), [
    'src/app/api/exam-copilot/route.ts', 'src/app/api/generate-exam/route.ts', 'src/app/api/knowledge-scope/propose/route.ts', 'src/app/api/ocr-exam-image/route.ts',
    'src/app/api/parse-docx/route.ts', 'src/app/api/parse-exam-text/route.ts', 'src/app/api/teacher/ai-memory/analyze/route.ts', 'src/app/api/teacher/assistant/route.ts',
    'src/app/api/tweak-question/route.ts', 'src/app/api/verify-question/route.ts',
  ].sort(), 'a new place that calls the provider must be reviewed against these rules, then added here');
});

test('every route that calls the provider goes through the per-user key helper with the signed-in user', () => {
  assert.ok(providerFiles.length >= 10);
  for (const { file, text } of providerFiles) {
    assert.match(text, /executeWithKeyRotation\(/, `${file} must use executeWithKeyRotation`);
    assert.match(text, /userId:\s*[\w.]+/, `${file} must pass the signed-in user id to the helper`);
    assert.match(text, /requireAuth|requireRequestAuth|requireTeacher|getCurrentUser/, `${file} must authenticate the caller`);
  }
});

test('only routes create a provider client, so the key can only come from the helper callback', () => {
  assert.ok(providerFiles.every(item => item.file.startsWith('src/app/api/')), 'no library creates a client with a key of its own');
  assert.ok(providerFiles.length >= 10, 'the route scan must actually find the AI routes');
  for (const { file, text } of providerFiles) assert.match(text, /new GoogleGenAI\(\{\s*apiKey(\s*:\s*key)?\s*\}\)/, `${file} builds the client from the callback key`);
});

test('no code reads a provider key from the environment or writes keys to logs', () => {
  for (const { file, text } of files) {
    assert.ok(!/process\.env\.(GEMINI_API_KEY|GOOGLE_API_KEY|GOOGLE_GENAI_API_KEY|API_KEY)\b/.test(text), `${file} must not read a shared provider key`);
    assert.ok(!/console\.(log|info|warn|error|debug)\([^)]*\b(apiKey|rawKey|customKey|keyEncrypted|keyIv|keyTag)\b/.test(text), `${file} must not log key material`);
  }
});

test('the helper refuses an anonymous caller and shared keys', () => {
  const helper = files.find(item => item.file === 'src/lib/gemini-keys.ts')!;
  assert.match(helper.text, /if \(!context\?\.userId\) throw new AiRequestError\([^)]*401/, 'no user id, no provider call');
  assert.match(helper.text, /export function getRegisteredKeys\(\): KeyInfo\[\] \{ return \[\]; \}/, 'no shared key list');
  assert.match(helper.text, /userApiKey\.findMany\(\{ where: \{ userId: context\.userId/, 'saved keys are looked up by the caller');
});
