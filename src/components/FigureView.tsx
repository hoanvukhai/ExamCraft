'use client';

import { useState } from 'react';
import type { Figure } from '@/types/exam';
import { VariationTable, type VariationTableData } from './VariationTable';
import { FunctionPlot, type FunctionPlotData } from './FunctionPlot';
import { compileMathExpression } from '@/lib/math-expression';

export function FigureView({ figure, forceLight = false }: { figure: Figure; forceLight?: boolean }) {
  const [failedSource, setFailedSource] = useState('');
  const data = figure.data && typeof figure.data === 'object' ? figure.data as Record<string, unknown> : {};
  const source = typeof data.url === 'string' ? data.url : figure.renderedBase64 ?? (typeof figure.data === 'string' ? figure.data : '');
  const missing = (message: string) => <p role="note" className="border border-amber-400 rounded p-2 text-sm">{message}</p>;
  let content;
  if (figure.kind === 'variation_table') content = <VariationTable data={figure.data as VariationTableData} forceLight={forceLight} />;
  else if (figure.kind === 'function_plot') content = compileMathExpression(data.expression) ? <FunctionPlot data={figure.data as FunctionPlotData} forceLight={forceLight} /> : missing('Đồ thị chưa có biểu thức hợp lệ. Hãy sửa dữ liệu hình.');
  else if (source && /^(data:image\/|https?:\/\/|\/)/i.test(source) && failedSource !== source) content = <img src={source} alt={figure.caption || 'Hình của câu hỏi'} onError={() => setFailedSource(source)} className="max-h-64 max-w-full object-contain mx-auto bg-white rounded border" />;
  else content = missing('Hình chưa có tệp ảnh hoặc không tải được. Dữ liệu gốc vẫn được giữ; hãy bổ sung ảnh.');
  return <figure className="my-2 overflow-x-auto">{content}{figure.caption && <figcaption className="text-xs italic mt-1 text-center">{figure.caption}</figcaption>}</figure>;
}
