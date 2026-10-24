import type { Exam, Figure } from '@/types/exam';
import { drawFunctionPlot, type FunctionPlotData } from './plot-canvas';

type ExportFigure = Figure & { exportSize?: { width: number; height: number } };

/** Build temporary PNGs for Word without mutating the saved source document. */
export async function prepareExportFigures(exam: Exam): Promise<Exam> {
  const prepared = structuredClone(exam);
  for (const item of [...prepared.questions, ...(prepared.passages ?? [])]) {
    for (const figure of item.figures ?? []) {
      const exported = figure as ExportFigure;
      if (figure.renderedBase64 || figure.kind === 'variation_table') continue;
      if (figure.kind === 'function_plot') {
        const canvas = document.createElement('canvas'); canvas.width = 720; canvas.height = 480;
        drawFunctionPlot(canvas, figure.data as FunctionPlotData, false, 2);
        figure.renderedBase64 = canvas.toDataURL('image/png'); exported.exportSize = { width: 360, height: 240 };
      } else if (figure.kind === 'image') {
        const data = figure.data && typeof figure.data === 'object' ? figure.data as Record<string, unknown> : {};
        const source = typeof figure.data === 'string' ? figure.data : data.url;
        if (typeof source !== 'string' || !/^(data:image\/|https?:\/\/|\/)/i.test(source)) throw new Error(`Ảnh “${figure.caption ?? figure.id}” thiếu tệp. Hãy bổ sung trước khi xuất Word.`);
        const image = new Image(); image.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(() => { image.src = ''; reject(new Error('Không tải được ảnh để xuất Word trong 10 giây. Hãy tải ảnh lên trực tiếp.')); }, 10000);
          image.onload = () => { clearTimeout(timer); resolve(); };
          image.onerror = () => { clearTimeout(timer); reject(new Error('Ảnh bị thiếu hoặc nguồn ảnh không cho xuất. Hãy tải ảnh lên trực tiếp.')); };
          image.src = source;
        });
        if (!image.naturalWidth || !image.naturalHeight) throw new Error('Ảnh không có kích thước hợp lệ.');
        const ratio = Math.min(1, 1600 / image.naturalWidth, 1600 / image.naturalHeight);
        const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio)); canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
        const context = canvas.getContext('2d'); if (!context) throw new Error('Trình duyệt không tạo được ảnh xuất.');
        context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(image, 0, 0, canvas.width, canvas.height);
        try { figure.renderedBase64 = canvas.toDataURL('image/png'); }
        catch { throw new Error('Nguồn ảnh chặn sao chép. Hãy tải ảnh lên trực tiếp trước khi xuất Word.'); }
        const scale = Math.min(1, 420 / canvas.width, 420 / canvas.height);
        exported.exportSize = { width: Math.round(canvas.width * scale), height: Math.round(canvas.height * scale) };
      } else if (figure.kind === 'geometry') {
        throw new Error(`Hình học “${figure.caption ?? figure.id}” chưa có bản ảnh. Hãy bổ sung ảnh của hình trước khi xuất Word.`);
      }
    }
  }
  return prepared;
}
