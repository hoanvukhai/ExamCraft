import type { portableExamBackup } from './portable-backup';

export const BACKUP_FILE_MAX_BYTES = 30 * 1024 * 1024;
export const BACKUP_FILE_MAX_EXAMS = 100;
type BackupInput = { exams: unknown[]; questions: unknown[] };
type PortableArchive = Awaited<ReturnType<typeof portableExamBackup>>;
const bytes = (text: string) => new TextEncoder().encode(text).length;

export function parseBackupText(text: string, maxBytes = BACKUP_FILE_MAX_BYTES): BackupInput {
  if (bytes(text) > maxBytes) throw Error('Tệp sao lưu quá lớn. Hãy chọn từng phần sao lưu, tối đa 30 MB mỗi tệp.');
  let value: unknown;
  try { value = JSON.parse(text.replace(/^\uFEFF/, '')); }
  catch { throw Error('Không đọc được JSON trong tệp sao lưu. Hãy chọn lại tệp gốc; dữ liệu hiện có chưa bị thay đổi.'); }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('Tệp chưa có danh sách đề hoặc câu hỏi hợp lệ.');
  const data = value as Record<string, unknown>;
  if (data.app === 'ExamCraft' && data.formatVersion !== undefined && data.formatVersion !== 1 && data.formatVersion !== 2) throw Error('Phiên bản tệp sao lưu chưa được hỗ trợ. Hãy giữ tệp gốc để chuyển đổi sau.');
  const singleExam = data.metadata && typeof data.metadata === 'object' && !Array.isArray(data.metadata) && data.exams === undefined;
  const exams = singleExam ? [data] : data.exams === undefined ? [] : data.exams;
  const questions = singleExam ? [] : data.questions === undefined ? [] : data.questions;
  if ((!singleExam && data.exams === undefined && data.questions === undefined) || !Array.isArray(exams) || !Array.isArray(questions)) throw Error('Danh sách đề hoặc câu hỏi trong tệp không hợp lệ.');
  if (exams.length > BACKUP_FILE_MAX_EXAMS || questions.length > 1000) throw Error('Mỗi phần nhập tối đa 100 đề và 1.000 câu rời. Hãy chia nhỏ tệp trước khi nhập.');
  return { exams, questions };
}

/** Keep whole documents in order; every file fits the same limits as the importer. */
export function splitBackupFiles(archive: PortableArchive, limits: { maxBytes?: number; maxExams?: number } = {}) {
  const maxBytes = limits.maxBytes ?? BACKUP_FILE_MAX_BYTES, maxExams = limits.maxExams ?? BACKUP_FILE_MAX_EXAMS;
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1 || !Number.isSafeInteger(maxExams) || maxExams < 1) throw Error('Giới hạn tệp sao lưu không hợp lệ.');
  const envelope = (images: number) => `${JSON.stringify({ app: archive.app, formatVersion: archive.formatVersion, exportedAt: archive.exportedAt, embeddedImages: images }).slice(0, -1)},"exams":[`;
  const suffix = '],"questions":[]}';
  const parts: { text: string; bytes: number; examCount: number }[] = [];
  let documents: string[] = [], documentBytes = 0, images = 0;
  const finish = () => {
    const text = envelope(images) + documents.join(',') + suffix;
    if (bytes(text) > maxBytes) throw Error('Một đề vượt giới hạn tệp sao lưu. Hãy giảm dung lượng ảnh trước; nguồn chưa bị thay đổi.');
    parts.push({ text, bytes: bytes(text), examCount: documents.length });
    documents = []; documentBytes = 0; images = 0;
  };
  for (const document of archive.exams) {
    const text = JSON.stringify(document), size = bytes(text);
    const imageCount = [...document.questions, ...(document.passages ?? [])].reduce((total, item) => total + (item.figures ?? []).filter(f => f.kind === 'image' || f.kind === 'geometry').length, 0);
    const candidateBytes = bytes(envelope(images + imageCount)) + documentBytes + size + documents.length + bytes(suffix);
    if (documents.length && (documents.length >= maxExams || candidateBytes > maxBytes)) finish();
    if (bytes(envelope(imageCount)) + size + bytes(suffix) > maxBytes) throw Error('Một đề vượt giới hạn tệp sao lưu. Hãy giảm dung lượng ảnh trước; nguồn chưa bị thay đổi.');
    documents.push(text); documentBytes += size; images += imageCount;
  }
  if (documents.length || !parts.length) finish();
  return parts.map((part, index) => ({ ...part, name: parts.length === 1 ? 'ExamCraft-kho-de.json' : `ExamCraft-kho-de-${String(index + 1).padStart(3, '0')}-of-${String(parts.length).padStart(3, '0')}.json` }));
}
