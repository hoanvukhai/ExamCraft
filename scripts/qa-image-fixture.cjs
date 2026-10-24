// Generates only new, disposable image/import fixtures inside this workspace.
const fs = require('node:fs'), path = require('node:path'), zlib = require('node:zlib'), crypto = require('node:crypto');
function crc32(bytes) { let crc = 0xffffffff; for (const byte of bytes) { crc ^= byte; for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0); } return (crc ^ 0xffffffff) >>> 0; }
function chunk(type, bytes) { const label = Buffer.from(type), length = Buffer.alloc(4), crc = Buffer.alloc(4); length.writeUInt32BE(bytes.length); crc.writeUInt32BE(crc32(Buffer.concat([label, bytes]))); return Buffer.concat([length, label, bytes, crc]); }
const output = path.resolve('public/qa-image-restore-20261023.png');
if (fs.existsSync(output)) throw Error('Fixture already exists; refusing overwrite.');
const width = 160, height = 80, scanlines = Buffer.alloc(height * (1 + width * 3));
for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) { const offset = y * (1 + width * 3) + 1 + x * 3; const border = x < 5 || y < 5 || x > 154 || y > 74; scanlines[offset] = border ? 10 : 30; scanlines[offset + 1] = border ? 20 : 150; scanlines[offset + 2] = border ? 40 : 230; }
const header = Buffer.alloc(13); header.writeUInt32BE(width, 0); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 2;
const png = Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', header), chunk('IDAT', zlib.deflateSync(scanlines)), chunk('IEND', Buffer.alloc(0))]);
fs.mkdirSync(path.dirname(output), { recursive: true }); fs.writeFileSync(output, png, { flag: 'wx' });
const now = new Date().toISOString();
const fixture = { exams: [{ id: 'qa-image-import-20261023', createdAt: now, updatedAt: now, metadata: { title: 'QA nhập và khôi phục ảnh', subject: 'toan', grade: 6, durationMinutes: 15, schoolName: '', departmentName: '' }, questions: [{ id: 'q', type: 'essay', difficulty: 'thong_hieu', content: 'QA ảnh xanh phải còn sau khôi phục', step_by_step_solution: 'QA lời giải kèm ảnh', figures: [{ id: 'qa-png', kind: 'image', data: { url: '/qa-image-restore-20261023.png' }, caption: 'Ảnh QA xanh160x80' }], points: 0 }] }, { id: 'qa-invalid-image-import-20261023', metadata: { title: 'QA mục lỗi cần giữ', subject: 'toan', grade: 6 }, questions: [{ id: 'bad', type: 'unsupported', content: 'Không nhập mục này' }] }], questions: [] };
fs.writeFileSync('qa/rebuild-2026-10-23/image-import-fixture.json', JSON.stringify(fixture, null, 2), { flag: 'wx' });
fs.writeFileSync('qa/rebuild-2026-10-23/image-source.json', JSON.stringify({ path: 'public/qa-image-restore-20261023.png', width, height, bytes: png.length, sha256: crypto.createHash('sha256').update(png).digest('hex') }, null, 2), { flag: 'wx' });
console.log('New fake image and JSON import fixture created; no DB or existing user data changed.');
