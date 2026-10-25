import { createHash } from 'node:crypto';

const canonical = (value: unknown): unknown => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)])) : value;
export function bankSaveReceipt(ownerId: string, requestId: string, body: unknown) {
  return { id: 'q_save_' + createHash('sha256').update(ownerId + ':' + requestId).digest('hex'), fingerprint: createHash('sha256').update(JSON.stringify(canonical(body))).digest('hex') };
}
