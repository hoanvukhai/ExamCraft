import type { Exam } from '@/types/exam';
import { normalizeExamDocument } from './exam-document';

const imageLimit = 2 * 1024 * 1024;
const imageTypes = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp']);
function base64(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 32768) binary += String.fromCharCode(...bytes.subarray(i, i + 32768));
  return btoa(binary);
}

/** Fetch in the browser's current permissions, never as a privileged server proxy. */
export async function portableExamBackup(exams: Exam[], fetchImage: typeof fetch = fetch) {
  const documents = structuredClone(exams), cache = new Map<string, string>();
  let embeddedImages = 0;
  for (const document of documents) {
    for (const item of [...document.questions, ...(document.passages ?? [])]) {
      for (const figure of item.figures ?? []) {
        if (!['image', 'geometry'].includes(figure.kind)) continue;
        const data = figure.data && typeof figure.data === 'object' ? figure.data as Record<string, unknown> : {};
        const source = typeof data.url === 'string' ? data.url : figure.renderedBase64 ?? (typeof figure.data === 'string' ? figure.data : '');
        if (!source) throw Error(`Ảnh “${figure.caption || figure.id}” chưa có tệp; chưa tạo bản sao lưu.`);
        let inline = cache.get(source);
        if (!inline) {
          if (!/^(data:image\/(png|jpeg|gif|webp);base64,|https?:\/\/|\/(?!\/))/i.test(source)) throw Error('Nguồn ảnh chưa hỗ trợ sao lưu. Hãy tải ảnh lên trực tiếp.');
          let response: Response;
          try { response = await fetchImage(source, { signal: AbortSignal.timeout(10000) }); }
          catch { throw Error(`Không tải được ảnh “${figure.caption || figure.id}”; chưa tạo bản sao lưu. Nguồn cũ vẫn giữ nguyên.`); }
          const mime = (response.headers.get('content-type') ?? '').split(';')[0].toLowerCase();
          if (!response.ok || !imageTypes.has(mime) || Number(response.headers.get('content-length') ?? 0) > imageLimit) throw Error('Ảnh thiếu, sai định dạng hoặc vượt2MB; chưa tạo bản sao lưu.');
          if (!response.body) throw Error('Không đọc được tệp ảnh để sao lưu.');
          const reader = response.body.getReader(), chunks: Uint8Array[] = []; let size = 0;
          try {
            while (true) {
              const { value, done } = await reader.read(); if (done) break;
              size += value.length;
              if (size > imageLimit) { await reader.cancel(); throw Error('Ảnh vượt2MB; chưa tạo bản sao lưu.'); }
              chunks.push(value);
            }
          } finally { reader.releaseLock(); }
          if (!size) throw Error('Tệp ảnh rỗng; chưa tạo bản sao lưu.');
          const bytes = new Uint8Array(size); let offset = 0;
          for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
          inline = `data:${mime};base64,${base64(bytes)}`; cache.set(source, inline);
        }
        // Replace the display source as well as its fallback so restore needs no old URL.
        figure.data = { ...data, url: inline }; figure.renderedBase64 = inline;
        embeddedImages++;
      }
    }
    normalizeExamDocument(document); // Includes the existing 15MB document limit.
  }
  return { app: 'ExamCraft', formatVersion: 2, exportedAt: new Date().toISOString(), embeddedImages, exams: documents, questions: [] };
}
