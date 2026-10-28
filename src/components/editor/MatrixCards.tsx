import type { ReactNode } from 'react';

export function MatrixCards({
  title,
  headers,
  rows,
}: {
  title: string;
  headers: string[];
  rows: ReactNode[][];
}) {
  return (
    <section aria-label={title} className="space-y-2 min-w-0">
      <h3 className="font-semibold text-sm">{title}</h3>
      {rows.length === 0 && <p className="text-sm">Chưa có nội dung.</p>}
      {rows.map((row, index) => (
        <dl key={index} className="rounded-xl border p-3 text-sm min-w-0 space-y-2">
          {headers.map((header, column) => (
            <div key={column} className="min-w-0 break-words">
              <dt className="text-xs font-medium">{header}</dt>
              <dd className="whitespace-pre-wrap">{row[column] ?? '—'}</dd>
            </div>
          ))}
        </dl>
      ))}
    </section>
  );
}
