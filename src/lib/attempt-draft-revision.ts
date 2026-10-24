import { createHash } from 'node:crypto';

// Content CAS: equivalent JSON objects share a token, including legacy null/empty drafts.
function canonical(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, entry]) => JSON.stringify(key) + ':' + canonical(entry)).join(',') + '}';
  return JSON.stringify(value) ?? 'null';
}

export function attemptDraftRevision(draft: unknown): string {
  return createHash('sha256').update(canonical(draft ?? {})).digest('hex');
}

export function validDraftRevision(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
}
