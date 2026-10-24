// One-off codemod: make AI routes use the model passed by executeWithKeyRotation
const fs = require('fs');
const base = 'src/app/api/';
const edits = {
  'exam-copilot': [['const modelName = getGeminiModel();\n', ''], ['async (apiKey) => {', 'async (apiKey, modelName) => {']],
  'generate-exam': [['const modelName = getGeminiModel();\n', ''], ['async (apiKey) => {', 'async (apiKey, modelName) => {']],
  'parse-exam-text': [['const modelName = getGeminiModel();\n', ''], ['async (apiKey) => {', 'async (apiKey, modelName) => {']],
  'tweak-question': [['const modelName = getGeminiModel();\n', ''], ['async (apiKey) => {', 'async (apiKey, modelName) => {']],
  'parse-docx': [['const modelName = getGeminiModel();\n', ''], ['async (apiKey: string) => {', 'async (apiKey: string, modelName: string) => {']],
  'ocr-exam-image': [['const modelName = getGeminiModel();\n', ''], ['async (apiKey: string) => {', 'async (apiKey: string, modelName: string) => {']],
  'verify-question': [['async (apiKey) => {', 'async (apiKey, model) => {'], ['model: getGeminiModel(),\n          contents', 'model,\n          contents']],
  'teacher/assistant': [['async (apiKey) => {', 'async (apiKey, model) => {'], ['const model = getGeminiModel();\n', '']],
  'teacher/ai-memory/analyze': [['async (key) => {', 'async (key, model) => {'], ['const model = getGeminiModel();\n', '']],
};
for (const [route, reps] of Object.entries(edits)) {
  const file = `${base}${route}/route.ts`;
  let src = fs.readFileSync(file, 'utf8');
  const crlf = src.includes('\r\n');
  if (crlf) src = src.replace(/\r\n/g, '\n');
  for (const [from, to] of reps) {
    const idx = src.indexOf(from);
    if (idx < 0) { console.log(`MISS ${route}: ${JSON.stringify(from)}`); continue; }
    // strip leading indentation when deleting a whole line
    if (to === '' && from.endsWith('\n')) {
      const lineStart = src.lastIndexOf('\n', idx) + 1;
      src = src.slice(0, lineStart) + src.slice(idx + from.length);
    } else {
      src = src.slice(0, idx) + to + src.slice(idx + from.length);
    }
  }
  // drop getGeminiModel import if no longer used
  if (!/getGeminiModel\(/.test(src)) {
    src = src.replace(/,\s*getGeminiModel\b/, '').replace(/\bgetGeminiModel\s*,\s*/, '');
  }
  if (crlf) src = src.replace(/\n/g, '\r\n');
  fs.writeFileSync(file, src, 'utf8');
  console.log(`OK ${route}`);
}
