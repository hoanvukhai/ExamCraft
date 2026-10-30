'use client';
import { useState } from 'react';
import type { Exam } from '@/types/exam';
import {
  EXAM_KINDS,
  PRINT_FIELDS,
  PRINT_PAGE_FIELDS,
  PRINT_PRESETS,
  PRINT_ZONES,
  STUDENT_FIELDS,
  parsePrintLayout,
  type PrintBlock,
  type PrintLayout,
  type PrintZone,
} from '@/lib/print-layout';

type Props = { exam: Exam; canEdit: boolean; onChange: React.Dispatch<React.SetStateAction<Exam>> };

const MAX_BLOCKS = 12;

/** Printed lines around the exam body: student line, closing lines, footer with page numbers. */
export function EditorPrint({ exam, canEdit, onChange }: Props) {
  const stored = exam.metadata.printLayout;
  const layout = (() => {
    try {
      return stored === undefined ? undefined : parsePrintLayout(stored);
    } catch {
      return undefined;
    }
  })();
  const [previous, setPrevious] = useState<{ layout: PrintLayout | undefined } | null>(null);

  const set = (next: PrintLayout | undefined, remember = false) => {
    if (!canEdit) return;
    if (remember) setPrevious({ layout });
    onChange((prev) => {
      const metadata = { ...prev.metadata };
      if (next === undefined) delete metadata.printLayout;
      else metadata.printLayout = next;
      return { ...prev, metadata, updatedAt: new Date().toISOString() };
    });
  };
  const setBlocks = (zone: PrintZone, blocks: PrintBlock[]) => layout && set({ ...layout, [zone]: blocks });
  const patchBlock = (zone: PrintZone, id: string, patch: Partial<PrintBlock>) =>
    layout &&
    setBlocks(
      zone,
      layout[zone].map((block) => (block.id === id ? { ...block, ...patch } : block)),
    );
  const addBlock = (zone: PrintZone) => {
    if (!layout || layout[zone].length >= MAX_BLOCKS) return;
    const used = new Set(Object.values(layout).flatMap((v) => (Array.isArray(v) ? v.map((b) => b.id) : [])));
    let n = layout[zone].length + 1;
    while (used.has(`${zone}-${n}`)) n++;
    setBlocks(zone, [
      ...layout[zone],
      { id: `${zone}-${n}`, text: '', align: zone === 'footerRight' ? 'right' : 'left' },
    ]);
  };

  return (
    <section aria-label="Bố cục in" className="space-y-4 text-sm">
      <div>
        <h3 className="font-semibold">Bố cục in</h3>
        <p className="mt-1 text-xs text-[var(--ui-text-secondary)]">
          Dòng thí sinh, lời dặn, cuối đề và chân trang có số trang. Chọn một mẫu rồi sửa từng dòng. Đề chưa
          chọn mẫu vẫn in như cũ.
        </p>
      </div>

      <label className="block space-y-1">
        <span className="text-xs font-semibold">Loại bài kiểm tra</span>
        <select
          className="teacher-field w-full"
          disabled={!canEdit}
          value={exam.metadata.examKind ?? ''}
          onChange={(event) => {
            const value = event.target.value as keyof typeof EXAM_KINDS | '';
            onChange((prev) => {
              const metadata = { ...prev.metadata };
              if (value) metadata.examKind = value;
              else delete metadata.examKind;
              return { ...prev, metadata, updatedAt: new Date().toISOString() };
            });
          }}
        >
          <option value="">Chưa chọn</option>
          {Object.entries(EXAM_KINDS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-1">
        <span className="text-xs font-semibold">Cột phương án trắc nghiệm</span>
        <select
          className="teacher-field w-full"
          disabled={!canEdit}
          value={String(exam.metadata.choiceColumns ?? '')}
          onChange={(event) => {
            const raw = event.target.value;
            onChange((prev) => {
              const metadata = { ...prev.metadata };
              if (!raw) delete metadata.choiceColumns;
              else metadata.choiceColumns = raw === 'auto' ? 'auto' : (Number(raw) as 1 | 2 | 4);
              return { ...prev, metadata, updatedAt: new Date().toISOString() };
            });
          }}
        >
          <option value="">Như cũ (Word mỗi phương án một dòng)</option>
          <option value="auto">Tự chọn theo độ dài</option>
          <option value="1">1 cột</option>
          <option value="2">2 cột</option>
          <option value="4">4 cột</option>
        </select>
      </label>

      <div className="space-y-2">
        <p className="text-xs font-semibold">Mẫu bố cục</p>
        <p className="text-xs text-[var(--ui-text-secondary)]">
          Hiện tại: {layout ? 'đã có bố cục in' : 'bố cục in cố định như trước'}.
        </p>
        <ul className="space-y-2">
          {PRINT_PRESETS.map((preset) => (
            <li key={preset.key} className="flex items-start justify-between gap-2 rounded-lg border p-2">
              <span className="min-w-0">
                <strong className="block text-xs">{preset.name}</strong>
                <span className="text-xs text-[var(--ui-text-secondary)]">{preset.note}</span>
              </span>
              <button
                type="button"
                disabled={!canEdit}
                className="app-button-secondary min-h-9 shrink-0 px-3 text-xs"
                onClick={() => set(preset.make(), true)}
              >
                Áp dụng
              </button>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2">
          {previous && (
            <button
              type="button"
              disabled={!canEdit}
              className="app-button-secondary min-h-9 px-3 text-xs"
              onClick={() => {
                set(previous.layout);
                setPrevious(null);
              }}
            >
              Hoàn tác mẫu vừa áp dụng
            </button>
          )}
          {layout && (
            <button
              type="button"
              disabled={!canEdit}
              className="app-button-secondary min-h-9 px-3 text-xs"
              onClick={() => set(undefined, true)}
            >
              Về bố cục in cố định
            </button>
          )}
        </div>
      </div>

      {layout && (
        <>
          <fieldset disabled={!canEdit} className="space-y-2 rounded-lg border p-2">
            <legend className="px-1 text-xs font-semibold">Dòng thí sinh</legend>
            <select
              aria-label="Kiểu dòng thí sinh"
              className="teacher-field w-full"
              value={layout.studentLine.kind}
              onChange={(event) =>
                set({
                  ...layout,
                  studentLine: {
                    ...layout.studentLine,
                    kind: event.target.value as PrintLayout['studentLine']['kind'],
                  },
                })
              }
            >
              <option value="line">Một dòng</option>
              <option value="scoreBox">Dòng và khung Điểm · Lời nhận xét</option>
              <option value="none">Không in</option>
            </select>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {(Object.entries(STUDENT_FIELDS) as [keyof typeof STUDENT_FIELDS, string][]).map(
                ([key, label]) => (
                  <label key={key} className="inline-flex items-center gap-1.5 text-xs">
                    <input
                      type="checkbox"
                      checked={layout.studentLine.fields.includes(key)}
                      onChange={(event) =>
                        set({
                          ...layout,
                          studentLine: {
                            ...layout.studentLine,
                            fields: (Object.keys(STUDENT_FIELDS) as (keyof typeof STUDENT_FIELDS)[]).filter(
                              (field) =>
                                field === key
                                  ? event.target.checked
                                  : layout.studentLine.fields.includes(field),
                            ),
                          },
                        })
                      }
                    />
                    {label}
                  </label>
                ),
              )}
            </div>
          </fieldset>

          {PRINT_ZONES.map((zone) => (
            <fieldset key={zone.key} disabled={!canEdit} className="space-y-2 rounded-lg border p-2">
              <legend className="px-1 text-xs font-semibold">{zone.label}</legend>
              {layout[zone.key].length === 0 && (
                <p className="text-xs text-[var(--ui-text-secondary)]">Chưa có dòng nào.</p>
              )}
              {layout[zone.key].map((block, index) => (
                <div key={block.id} className="space-y-1.5 rounded-md bg-[var(--ui-surface-variant)] p-2">
                  <input
                    aria-label={`${zone.label} · dòng ${index + 1}`}
                    className="teacher-field w-full"
                    maxLength={500}
                    value={block.text}
                    placeholder="Gõ chữ hoặc chèn trường"
                    onChange={(event) => patchBlock(zone.key, block.id, { text: event.target.value })}
                  />
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <select
                      aria-label="Chèn trường"
                      className="teacher-field min-h-9 py-0 text-xs"
                      value=""
                      onChange={(event) => {
                        if (event.target.value)
                          patchBlock(zone.key, block.id, { text: `${block.text}{${event.target.value}}` });
                      }}
                    >
                      <option value="">Chèn trường ▾</option>
                      {[...PRINT_FIELDS, ...(zone.key.startsWith('footer') ? PRINT_PAGE_FIELDS : [])].map(
                        (field) => (
                          <option key={field} value={field}>
                            {field}
                          </option>
                        ),
                      )}
                    </select>
                    <select
                      aria-label="Căn lề"
                      className="teacher-field min-h-9 py-0 text-xs"
                      value={block.align ?? 'left'}
                      onChange={(event) =>
                        patchBlock(zone.key, block.id, { align: event.target.value as PrintBlock['align'] })
                      }
                    >
                      <option value="left">Trái</option>
                      <option value="center">Giữa</option>
                      <option value="right">Phải</option>
                    </select>
                    {(
                      [
                        ['bold', 'Đậm'],
                        ['italic', 'Nghiêng'],
                        ['uppercase', 'IN HOA'],
                        ['hidden', 'Ẩn'],
                      ] as const
                    ).map(([key, label]) => (
                      <label key={key} className="inline-flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={!!block[key]}
                          onChange={(event) =>
                            patchBlock(zone.key, block.id, { [key]: event.target.checked })
                          }
                        />
                        {label}
                      </label>
                    ))}
                    <button
                      type="button"
                      className="app-button-secondary min-h-9 px-2 text-xs"
                      onClick={() =>
                        setBlocks(
                          zone.key,
                          layout[zone.key].filter((item) => item.id !== block.id),
                        )
                      }
                    >
                      Xóa dòng
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="app-button-secondary min-h-9 px-3 text-xs"
                disabled={layout[zone.key].length >= MAX_BLOCKS}
                onClick={() => addBlock(zone.key)}
              >
                + Thêm dòng
              </button>
            </fieldset>
          ))}
          <p className="text-xs text-[var(--ui-text-secondary)]">
            Dòng chỉ gồm trường chưa có giá trị sẽ không in. Số trang trên màn hình là ước lượng; Word tự đánh
            số đúng.
          </p>
        </>
      )}
    </section>
  );
}
