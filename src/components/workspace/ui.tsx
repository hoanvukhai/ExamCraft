import type { ReactNode } from 'react';

/** The content column of a page inside the frame: one width, one padding. `wide` is for pages with large tables. */
export function PageBody({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return <main className={`app-page mx-auto w-full px-4 sm:px-6 py-6 space-y-6 ${wide ? 'max-w-7xl' : 'max-w-6xl'}`}>{children}</main>;
}

/** The title block every management page starts with: a title, one line of help, and the main action on the right. */
export function PageHeader({ title, description, status, actions }: { title: ReactNode; description?: ReactNode; status?: ReactNode; actions?: ReactNode }) {
  return <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b">
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-3"><h1 className="text-2xl font-semibold">{title}</h1>{status}</div>
      {description && <p className="text-sm text-[var(--ui-text-secondary)] mt-1">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
  </div>;
}
