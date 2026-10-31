'use client';
import { useEffect, useRef, useState, type RefObject } from 'react';

export const A4_WIDTH_PX = 793.7;
export const A4_HEIGHT_PX = 1123;

let pageStyles: CSSStyleSheet | null = null;
/** The page's own styles, copied once so a thumbnail inside a shadow tree looks like the sheet. */
function sharedStyles() {
  if (pageStyles) return pageStyles;
  const sheet = new CSSStyleSheet();
  let text = '';
  for (const source of Array.from(document.styleSheets)) {
    try {
      text += Array.from(source.cssRules, (rule) => rule.cssText).join(' ') + ' ';
    } catch {
      /* A cross-origin sheet cannot be read; the sheet does not depend on it. */
    }
  }
  sheet.replaceSync(text);
  return (pageStyles = sheet);
}

/** A small copy of one page: the sheet itself is cloned and clipped to that page, so it always looks like the real thing. */
function Thumb({
  paper,
  page,
  width,
  version,
}: {
  paper: RefObject<HTMLDivElement | null>;
  page: number;
  width: number;
  version: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const shadow = useRef<ShadowRoot | null>(null);
  const scale = width / A4_WIDTH_PX;
  useEffect(() => {
    const target = host.current;
    const source = paper.current;
    if (!target || !source) return;
    const timer = setTimeout(() => {
      const clone = source.cloneNode(true) as HTMLElement;
      // The copy lives in a closed shadow tree: nothing in the page (selection, scrolling, tests) can reach into it.
      shadow.current ??= target.attachShadow({ mode: 'closed' });
      shadow.current.adoptedStyleSheets = [sharedStyles()];
      clone.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'));
      clone.querySelectorAll('.no-print').forEach((element) => element.remove());
      clone.style.cssText = `zoom:1;position:absolute;left:0;top:0;width:${A4_WIDTH_PX}px;margin:0;box-shadow:none;border:0;pointer-events:none;transform-origin:top left;transform:translateY(${-page * A4_HEIGHT_PX * scale}px) scale(${scale});`;
      clone.setAttribute('aria-hidden', 'true');
      shadow.current.replaceChildren(clone);
    }, 250);
    return () => clearTimeout(timer);
  }, [paper, page, scale, version]);
  return (
    <div
      ref={host}
      aria-hidden="true"
      className="relative overflow-hidden bg-white"
      style={{ width, height: A4_HEIGHT_PX * scale }}
    />
  );
}

type Item = { label: string; onClick: () => void; disabled?: boolean };

/** Pages as small sheets under the big one: bar of thumbnails with "1 · Câu 1–8", like the page strip of a design tool. */
export function PageStrip({
  paper,
  version,
  pages,
  current,
  selected,
  ranges,
  onGo,
  onSelect,
  onAdd,
  onMove,
  commands,
  canEdit,
}: {
  paper: RefObject<HTMLDivElement | null>;
  version: string;
  pages: number;
  current: number;
  selected: number | null;
  ranges: string[];
  onGo: (page: number) => void;
  onSelect: (page: number) => void;
  onAdd?: () => void;
  onMove?: (from: number, to: number) => void;
  commands?: (page: number) => Item[];
  canEdit: boolean;
}) {
  const [dragging, setDragging] = useState<number | null>(null);
  return (
    <nav aria-label="Dải trang" className="no-print flex min-w-0 items-end gap-2 overflow-x-auto px-2 py-1.5">
      {Array.from({ length: pages }, (_, index) => (
        <div
          key={index}
          draggable={canEdit && !!onMove}
          onDragStart={() => setDragging(index)}
          onDragEnd={() => setDragging(null)}
          onDragOver={(event) => dragging !== null && event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            if (dragging !== null && dragging !== index) onMove?.(dragging, index);
            setDragging(null);
          }}
          className="shrink-0"
        >
          <button
            type="button"
            aria-label={`Trang ${index + 1}`}
            aria-current={current === index ? 'true' : undefined}
            title={ranges[index] || `Trang ${index + 1}`}
            onClick={() => {
              onGo(index);
              onSelect(index);
            }}
            className={
              'block rounded-md border-2 p-0 ' +
              (selected === index
                ? 'border-[var(--ui-text-primary)]'
                : current === index
                  ? 'border-[var(--ui-border)]'
                  : 'border-transparent')
            }
          >
            <Thumb paper={paper} page={index} width={64} version={version} />
          </button>
          <div className="flex items-center justify-between gap-1 pt-0.5 text-[11px] text-[var(--ui-text-secondary)]">
            <span className="truncate">
              {index + 1}
              {ranges[index] ? ' · ' + ranges[index] : ''}
            </span>
            {canEdit && commands && (
              <select
                aria-label={`Thao tác trang ${index + 1}`}
                value=""
                className="w-5 bg-transparent text-[11px]"
                onChange={(event) => {
                  const item = commands(index)[Number(event.target.value)];
                  if (item && !item.disabled) item.onClick();
                }}
              >
                <option value="">⋯</option>
                {commands(index).map((item, at) => (
                  <option key={item.label} value={at} disabled={item.disabled}>
                    {item.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      ))}
      {canEdit && onAdd && (
        <button
          type="button"
          aria-label="Thêm trang"
          title="Thêm trang"
          onClick={onAdd}
          className="app-button-secondary mb-5 min-h-9 min-w-9 shrink-0 rounded-lg"
        >
          +
        </button>
      )}
    </nav>
  );
}

/** All pages at once, to see the whole exam and drag a page to another place. */
export function PageGrid({
  paper,
  version,
  pages,
  selected,
  ranges,
  onSelect,
  onOpen,
  onMove,
  canEdit,
}: {
  paper: RefObject<HTMLDivElement | null>;
  version: string;
  pages: number;
  selected: number | null;
  ranges: string[];
  onSelect: (page: number) => void;
  onOpen: (page: number) => void;
  onMove?: (from: number, to: number) => void;
  canEdit: boolean;
}) {
  const [dragging, setDragging] = useState<number | null>(null);
  return (
    <div
      role="group"
      aria-label="Lưới trang"
      className="grid gap-4 p-4 sm:p-8"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}
    >
      {Array.from({ length: pages }, (_, index) => (
        <div
          key={index}
          draggable={canEdit && !!onMove}
          onDragStart={() => setDragging(index)}
          onDragEnd={() => setDragging(null)}
          onDragOver={(event) => dragging !== null && event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            if (dragging !== null && dragging !== index) onMove?.(dragging, index);
            setDragging(null);
          }}
        >
          <button
            type="button"
            aria-label={`Trang ${index + 1}`}
            onClick={() => onSelect(index)}
            onDoubleClick={() => onOpen(index)}
            className={
              'block rounded-md border-2 p-0 shadow-xs ' +
              (selected === index ? 'border-[var(--ui-text-primary)]' : 'border-transparent')
            }
          >
            <Thumb paper={paper} page={index} width={140} version={version} />
          </button>
          <p className="pt-1 text-xs text-[var(--ui-text-secondary)]">
            Trang {index + 1}
            {ranges[index] ? ' · ' + ranges[index] : ''}
          </p>
        </div>
      ))}
    </div>
  );
}
