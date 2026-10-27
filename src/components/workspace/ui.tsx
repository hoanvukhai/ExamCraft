'use client';
import type { ComponentType, ReactNode } from 'react';
import { Search } from 'lucide-react';

type Icon = ComponentType<{ className?: string }>;

/** The content column of a page inside the frame. It fills the width the frame gives it, like the library, instead of a fixed centred column. */
export function PageBody({ children }: { children: ReactNode }) {
  return <main className="app-page w-full px-4 sm:px-6 py-5 space-y-5">{children}</main>;
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

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border bg-[var(--ui-surface)] ${className}`}>{children}</div>;
}

/** One bar for search and filters, the same on every list page. */
export function FilterBar({ children }: { children: ReactNode }) {
  return <Panel className="p-3 flex flex-wrap items-center gap-3">{children}</Panel>;
}

export function SearchField({ value, onChange, placeholder, label }: { value: string; onChange: (value: string) => void; placeholder: string; label: string }) {
  return <label className="relative block min-w-52 flex-1 max-w-md">
    <span className="sr-only">{label}</span>
    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ui-text-secondary)] pointer-events-none" />
    <input type="text" value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} className="teacher-field w-full pl-9" />
  </label>;
}

export function EmptyState({ Icon, title, text, action }: { Icon: Icon; title: ReactNode; text?: ReactNode; action?: ReactNode }) {
  return <Panel className="p-10 sm:p-14 text-center">
    <Icon className="w-10 h-10 text-[var(--ui-text-secondary)] mx-auto mb-3" />
    <h2 className="text-base font-semibold">{title}</h2>
    {text && <p className="text-sm text-[var(--ui-text-secondary)] mt-1 max-w-md mx-auto">{text}</p>}
    {action && <div className="mt-5 flex justify-center">{action}</div>}
  </Panel>;
}

export function LoadingBlock({ text }: { text: string }) {
  return <div role="status" className="py-16 flex flex-col items-center justify-center text-[var(--ui-text-secondary)]">
    <div className="w-7 h-7 border-[3px] border-[var(--ui-accent)] border-t-transparent rounded-full animate-spin mb-3" />
    <p className="text-sm">{text}</p>
  </div>;
}

/** Small label. `active` is the one semantic colour (open, running); everything else is neutral. */
export function Tag({ children, active = false }: { children: ReactNode; active?: boolean }) {
  return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${active ? 'app-status-active' : 'bg-[var(--ui-surface-variant)] text-[var(--ui-text-secondary)]'}`}>{children}</span>;
}
