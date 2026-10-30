'use client';

import { useLayoutEffect, useRef, useState, useId } from 'react';
import { EditorNodeScope } from './editor/EditorSelection';
import type { Figure } from '@/types/exam';

const field = 'w-full border rounded p-2 bg-transparent text-sm';
const object = (value: unknown): Record<string, unknown> => value && typeof value === 'object' ? value as Record<string, unknown> : {};

export function FigureEditor({ figures, onChange, initialOpen }: { figures: Figure[]; onChange: (figures: Figure[]) => void; initialOpen?: boolean }) {
  const scopeId = useId();
  const [error, setError] = useState('');
  const current = useRef(figures);
  useLayoutEffect(() => { current.current = figures; }, [figures]);
  const update = (id: string, value: Partial<Figure>) => onChange(current.current.map(f => f.id === id ? { ...f, ...value, ...(Object.hasOwn(value, 'data') || Object.hasOwn(value, 'kind') ? { renderedBase64: undefined } : {}) } : f));
  const upload = async (file?: File, id?: string) => {
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/gif', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) { setError('Chọn ảnh PNG, JPG, GIF hoặc WebP tối đa 2 MB.'); return; }
    try {
      const url = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('Không đọc được ảnh.')); reader.readAsDataURL(file); });
      if (id) update(id, { kind: 'image', data: { url } });
      else onChange([...current.current, { id: crypto.randomUUID(), kind: 'image', data: { url } }]);
      setError('');
    } catch { setError('Không đọc được ảnh. Hãy chọn lại tệp.'); }
  };
  return <details open={initialOpen || undefined} className="border rounded p-3"><summary className="cursor-pointer">Hình và đồ thị ({figures.length})</summary>
    <p className="text-xs my-2">Ảnh được lưu trong nội dung đang sửa. Công thức trong nội dung có thể viết giữa dấu $.</p>
    {error && <p role="alert" className="text-red-600">{error}</p>}
    {figures.map((figure, index) => { const data = object(figure.data); return <EditorNodeScope key={figure.id} id={scopeId + figure.id} label={`Hình ${index + 1}`} className="my-3 border rounded p-3 space-y-2" commands={[
        { label: 'Chú thích', run: () => document.getElementById(scopeId + 'caption-' + figure.id)?.focus() },
        { label: 'Thay ảnh', disabled: !['image', 'geometry'].includes(figure.kind), run: () => document.getElementById(scopeId + 'upload-' + figure.id)?.click() },
        { label: 'Bỏ hình này', run: () => { if (window.confirm('Bỏ hình đang chọn? Nội dung còn lại được giữ.')) onChange(current.current.filter(f => f.id !== figure.id)); } },
      ]}><p className="text-sm font-medium">Hình {index + 1}</p>
      <label className="block text-sm">Chú thích<input id={scopeId + 'caption-' + figure.id} aria-label={`Chú thích hình ${index + 1}`} className={field} value={figure.caption ?? ''} onChange={e => update(figure.id, { caption: e.target.value })} /></label>
      {figure.kind === 'function_plot' && <>
        <label className="block text-sm">Hàm số y =<input className={field} aria-label={`Hàm số hình ${index + 1}`} placeholder="Ví dụ: x^2 - 2*x" value={String(data.expression ?? '')} onChange={e => update(figure.id, { data: { ...data, expression: e.target.value } })} /></label>
        <p className="text-xs">Hỗ trợ x, sin, cos, tan, sqrt, log, exp và các phép tính.</p>
        {(['xRange', 'yRange'] as const).map(axis => <div key={axis} className="grid grid-cols-2 gap-2">{[0, 1].map(bound => <label key={bound} className="text-sm">{axis === 'xRange' ? 'Trục x' : 'Trục y'} {bound === 0 ? 'từ' : 'đến'}<input className={field} type="number" step="any" value={Array.isArray(data[axis]) ? data[axis][bound] : bound === 0 ? -6 : 8} onChange={e => { const range = Array.isArray(data[axis]) ? [...data[axis]] : [-6, 8]; range[bound] = e.target.valueAsNumber; update(figure.id, { data: { ...data, [axis]: range } }); }} /></label>)}</div>)}
      </>}
      {figure.kind === 'variation_table' && <>
        <label className="block text-sm">Các mốc x (mỗi dòng một mốc)<textarea className={field} value={Array.isArray(data.xValues) ? data.xValues.join('\n') : ''} onChange={e => update(figure.id, { data: { ...data, xValues: e.target.value.split('\n') } })} /></label>
        <label className="block text-sm">Dấu đạo hàm (cách nhau bằng khoảng trắng: + - 0 ||)<input className={field} value={Array.isArray(data.yPrimeSigns) ? data.yPrimeSigns.join(' ') : ''} onChange={e => update(figure.id, { data: { ...data, yPrimeSigns: e.target.value.trim().split(/\s+/) } })} /></label>
        <label className="block text-sm">Giá trị y và chiều biến thiên (mỗi dòng: giá trị, ↑ hoặc ↓)<textarea className={field} value={Array.isArray(data.yValues) ? data.yValues.map(item => { const row = object(item); return row.type === 'up' ? '↑' : row.type === 'down' ? '↓' : String(row.val ?? ''); }).join('\n') : ''} onChange={e => update(figure.id, { data: { ...data, yValues: e.target.value.split('\n').map(val => val.trim() === '↑' ? { type: 'up' } : val.trim() === '↓' ? { type: 'down' } : { type: 'value', val }) } })} /></label>
      </>}
      {['image', 'geometry'].includes(figure.kind) && <label className="block text-sm">{figure.kind === 'geometry' ? 'Bổ sung ảnh cho hình học' : 'Thay ảnh'}<input id={scopeId + 'upload-' + figure.id} type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={e => { void upload(e.target.files?.[0], figure.id); e.target.value = ''; }} /></label>}
      <button type="button" onClick={() => onChange(figures.filter(f => f.id !== figure.id))}>Bỏ hình này</button>
    </EditorNodeScope>; })}
    <div className="flex gap-3 flex-wrap text-sm mt-2"><label className="cursor-pointer">Thêm ảnh<input className="block" type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={e => { void upload(e.target.files?.[0]); e.target.value = ''; }} /></label>
      <button type="button" onClick={() => onChange([...figures, { id: crypto.randomUUID(), kind: 'function_plot', data: { expression: '', xRange: [-6, 8], yRange: [-6, 8] } }])}>Thêm đồ thị</button>
      <button type="button" onClick={() => onChange([...figures, { id: crypto.randomUUID(), kind: 'variation_table', data: { xValues: [], yPrimeSigns: [], yValues: [] } }])}>Thêm bảng biến thiên</button>
    </div>
  </details>;
}
