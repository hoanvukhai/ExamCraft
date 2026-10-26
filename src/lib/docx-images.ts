import JSZip from 'jszip';
import type { Figure, Passage, Question } from '@/types/exam';

/**
 * Plain-text extraction drops pictures inside a Word file. Each picture is replaced by a marker "[HÌNH n]" before the text is read,
 * and after the AI has split the questions the pictures are attached to the question or passage whose text still carries the marker.
 * A marker that cannot be placed is reported, never silently lost.
 */
export type WordImage = { n: number; dataUrl: string; bytes: number };
const MIME: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp' };
const MAX_IMAGES = 60, MAX_IMAGE_BYTES = 3 * 1024 * 1024, MAX_TOTAL_BYTES = 24 * 1024 * 1024;

const attr = (tag: string, name: string) => new RegExp(`${name}="([^"]*)"`).exec(tag)?.[1];

export async function docxWithImagesAsMarkers(buffer: Buffer): Promise<{ buffer: Buffer; images: WordImage[]; skipped: number }> {
  const zip = await JSZip.loadAsync(buffer);
  const documentFile = zip.file('word/document.xml'), relsFile = zip.file('word/_rels/document.xml.rels');
  if (!documentFile || !relsFile) return { buffer, images: [], skipped: 0 };
  const targets = new Map<string, string>();
  for (const tag of (await relsFile.async('string')).match(/<Relationship\b[^>]*>/g) ?? []) { const id = attr(tag, 'Id'), target = attr(tag, 'Target'); if (id && target) targets.set(id, target); }
  let xml = await documentFile.async('string');
  const images: WordImage[] = []; let skipped = 0, total = 0;
  const marker = async (block: string) => {
    const id = /r:(?:embed|id)="([^"]+)"/.exec(block)?.[1];
    const target = id ? targets.get(id) : undefined;
    const path = target ? (target.startsWith('/') ? target.slice(1) : 'word/' + target) : undefined;
    const mime = path ? MIME[path.split('.').pop()?.toLowerCase() ?? ''] : undefined;
    const file = path && mime ? zip.file(path) : null;
    if (!file || !mime) { skipped++; return '<w:t xml:space="preserve"> [HÌNH không đọc được] </w:t>'; }
    const data = await file.async('nodebuffer');
    if (images.length >= MAX_IMAGES || data.length > MAX_IMAGE_BYTES || total + data.length > MAX_TOTAL_BYTES) { skipped++; return '<w:t xml:space="preserve"> [HÌNH quá lớn hoặc quá nhiều] </w:t>'; }
    total += data.length;
    const n = images.length + 1;
    images.push({ n, dataUrl: `data:${mime};base64,${data.toString('base64')}`, bytes: data.length });
    return `<w:t xml:space="preserve"> [HÌNH ${n}] </w:t>`;
  };
  // Replace from the end so earlier string positions stay valid while awaiting.
  const blocks = [...xml.matchAll(/<w:drawing\b[\s\S]*?<\/w:drawing>|<w:pict\b[\s\S]*?<\/w:pict>/g)];
  const replaced: string[] = [];
  for (const block of blocks) replaced.push(await marker(block[0]));
  let cursor = 0, out = '';
  blocks.forEach((block, i) => { out += xml.slice(cursor, block.index) + replaced[i]; cursor = (block.index ?? 0) + block[0].length; });
  xml = out + xml.slice(cursor);
  if (!blocks.length) return { buffer, images: [], skipped: 0 };
  zip.file('word/document.xml', xml);
  return { buffer: await zip.generateAsync({ type: 'nodebuffer' }), images, skipped };
}

const MARKER = /\[\s*H[ÌI]NH\s*(\d+)\s*\]/gi;
const strip = (text: string) => text.replace(MARKER, '').replace(/[ \t]+\n/g, '\n').replace(/ {2,}/g, ' ').trim();
const figureOf = (image: WordImage): Figure => ({ id: crypto.randomUUID(), kind: 'image', data: { url: image.dataUrl }, renderedBase64: image.dataUrl });

/** Puts each picture on the question or passage whose text carries its marker, and removes the marker text. */
export function attachWordImages<T extends { questions: Question[]; passages: Passage[]; warnings: string[] }>(imported: T, images: WordImage[], skipped = 0): T {
  if (!images.length && !skipped) return imported;
  const byNumber = new Map(images.map(image => [image.n, image]));
  const placed = new Set<number>();
  const found = (...texts: (string | undefined)[]) => texts.flatMap(text => [...(text ?? '').matchAll(MARKER)].map(match => Number(match[1])));
  const questions = imported.questions.map(question => {
    const numbers = found(question.content, ...(question.choices?.map(choice => choice.text) ?? []), ...(question.sub_questions?.map(sub => sub.content) ?? [])).filter(n => byNumber.has(n));
    if (!numbers.length) return { ...question, content: strip(question.content) };
    numbers.forEach(n => placed.add(n));
    return { ...question, content: strip(question.content), ...(question.choices ? { choices: question.choices.map(choice => ({ ...choice, text: strip(choice.text) })) } : {}),
      ...(question.sub_questions ? { sub_questions: question.sub_questions.map(sub => ({ ...sub, content: strip(sub.content) })) } : {}),
      figures: [...(question.figures ?? []), ...[...new Set(numbers)].map(n => figureOf(byNumber.get(n)!))] };
  });
  const passages = imported.passages.map(passage => {
    const numbers = found(passage.content).filter(n => byNumber.has(n));
    if (!numbers.length) return { ...passage, content: strip(passage.content) };
    numbers.forEach(n => placed.add(n));
    return { ...passage, content: strip(passage.content), figures: [...(passage.figures ?? []), ...[...new Set(numbers)].map(n => figureOf(byNumber.get(n)!))] };
  });
  const lost = images.filter(image => !placed.has(image.n)).map(image => image.n);
  const warnings = [...imported.warnings];
  if (placed.size) warnings.unshift(`Đã gắn ${placed.size} hình từ tệp Word vào câu hoặc ngữ liệu; hãy kiểm tra hình đúng vị trí.`);
  if (lost.length) warnings.unshift(`Có ${lost.length} hình trong tệp (hình ${lost.join(', ')}) chưa gắn được vào câu nào; hãy chèn thủ công từ tệp gốc.`);
  if (skipped) warnings.unshift(`Có ${skipped} hình không đọc được, quá lớn hoặc quá nhiều nên bị bỏ qua; hãy chèn thủ công từ tệp gốc.`);
  return { ...imported, questions, passages, warnings };
}
