import type { Exam } from '@/types/exam';
import { normalizeExamDocument } from './exam-document';

export function draftKey(ownerId: string, id: string) { return `examcraft:draft:${encodeURIComponent(ownerId)}:${encodeURIComponent(id)}`; }
export function writerDraftId(id: string, writerId: string) { return `recovery:writer:${encodeURIComponent(id)}:${encodeURIComponent(writerId)}`; }

/** Acknowledging one writer must never remove another writer's shared new-draft slot. */
export function retireWriterDraft(storage: Pick<Storage, 'setItem'>, ownerId: string, id: string, writerId: string, saved: Exam) {
  storage.setItem(draftKey(ownerId, writerDraftId(id, writerId)), JSON.stringify({ ownerId, writerId, unsaved: false, retired: true, savedAt: new Date().toISOString(), exam: saved }));
}

function retired(storage: Pick<Storage, 'getItem'>, ownerId: string, id: string, writerId?: string) {
  if (!writerId || id.startsWith('recovery:')) return false;
  try {
    const value = JSON.parse(storage.getItem(draftKey(ownerId, writerDraftId(id, writerId))) ?? 'null');
    return value?.ownerId === ownerId && value.writerId === writerId && value.retired === true;
  } catch { return false; }
}

/** Archive before replacing a local working document. A full/blocked store must abort replacement. */
export function stageLatestExam(storage: Pick<Storage, 'getItem' | 'setItem'>, ownerId: string, local: Exam, remote: Exam, writerId?: string): string {
  if (local.id !== remote.id || local.serverId !== remote.id) throw new Error('Bản máy chủ không khớp đề đang mở.');
  const recoveryId = `recovery:${local.id}:${crypto.randomUUID()}`;
  writeDraft(storage, ownerId, recoveryId, local);
  writeDraft(storage, ownerId, remote.id, remote, false, writerId);
  return recoveryId;
}

export function recoveryDraftAsNew(exam: Exam): Exam {
  const now = new Date().toISOString();
  return { ...exam, id: `draft_${crypto.randomUUID()}`, serverId: undefined, version: undefined, access: undefined, createdAt: now, updatedAt: now, metadata: { ...exam.metadata, title: `${exam.metadata.title} (Nháp phục hồi)` } };
}
export function readDraft(storage: Pick<Storage, 'getItem'>, ownerId: string, id: string, includeSaved = false): Exam | null {
  const text = storage.getItem(draftKey(ownerId, id));
  if (!text) return null;
  const data = JSON.parse(text);
  if (data.ownerId !== ownerId) return null;
  if (retired(storage, ownerId, id, data.writerId)) return null;
  if (data.unsaved === false && !includeSaved) return null;
  return normalizeExamDocument(data.exam);
}
export function writeDraft(storage: Pick<Storage, 'setItem'> & Partial<Pick<Storage, 'getItem'>>, ownerId: string, id: string, exam: Exam, unsaved = true, writerId?: string) {
  const text = JSON.stringify({ ownerId, unsaved, writerId, savedAt: new Date().toISOString(), exam });
  if (writerId) {
    // Distinct writers never share this slot. Persist it before touching any shared pointer.
    const key = draftKey(ownerId, writerDraftId(id, writerId)), previousText = storage.getItem?.(key);
    if (previousText) {
      let previous: { unsaved?: boolean; exam?: { id?: string } } | undefined;
      try { previous = JSON.parse(previousText); } catch { /* Keep unreadable bytes first. */ }
      if (!previous || (previous.unsaved !== false && previous.exam?.id !== exam.id)) storage.setItem(draftKey(ownerId, `recovery:${previous?.exam?.id ?? 'unreadable'}:${crypto.randomUUID()}`), previousText);
    }
    storage.setItem(key, text);
  }
  if (storage.getItem) {
    const previousText = storage.getItem(draftKey(ownerId, id));
    if (previousText) {
      // Keep another tab's unsaved content before replacing the shared resume slot.
      // Never delete unreadable drafts or overwrite their recovery slot.
      let previous: { ownerId?: string; unsaved?: boolean; writerId?: string; exam?: { id?: string } } | undefined;
      try { previous = JSON.parse(previousText); } catch { /* Keep the original bytes below. */ }
      const changedWriter = writerId !== undefined && previous?.writerId !== writerId;
      const differentNewDocument = id === 'new' && previous?.exam?.id !== exam.id;
      const previousRetired = retired({ getItem: key => storage.getItem!(key) }, ownerId, id, previous?.writerId);
      if (!previous || (previous.ownerId === ownerId && previous.unsaved !== false && !previousRetired && (changedWriter || differentNewDocument) && JSON.stringify(previous.exam) !== JSON.stringify(exam))) {
        const recoveryId = `recovery:${previous?.exam?.id ?? 'unreadable'}:${crypto.randomUUID()}`;
        storage.setItem(draftKey(ownerId, recoveryId), previousText);
      }
    }
  }
  storage.setItem(draftKey(ownerId, id), text);
}

export function listUnsavedDrafts(storage: Pick<Storage, 'getItem' | 'key' | 'length'>, ownerId: string) {
  const prefix = `examcraft:draft:${encodeURIComponent(ownerId)}:`;
  const drafts: { storageId: string; exam: Exam; savedAt: string }[] = [];
  const unreadable: string[] = [];
  for (let index = 0; index < storage.length; index++) {
    const key = storage.key(index);
    if (!key?.startsWith(prefix)) continue;
    try {
      const value = JSON.parse(storage.getItem(key) ?? 'null');
      if (value?.ownerId !== ownerId || value.unsaved === false) continue;
      const storageId = decodeURIComponent(key.slice(prefix.length));
      if (retired(storage, ownerId, storageId, value.writerId)) continue;
      drafts.push({ storageId, exam: normalizeExamDocument(value.exam), savedAt: String(value.savedAt ?? '') });
    } catch { unreadable.push(key); }
  }
  const distinct = new Map<string, typeof drafts[number]>();
  const priority = (id: string) => id.startsWith('recovery:writer:') ? 2 : id.startsWith('recovery:') ? 1 : 0;
  for (const item of drafts) {
    const signature = JSON.stringify(item.exam, (_key, value) => value && typeof value === 'object' && !Array.isArray(value) ? Object.fromEntries(Object.keys(value).sort().map(key => [key, value[key]])) : value);
    const previous = distinct.get(signature);
    if (!previous || priority(item.storageId) < priority(previous.storageId)) distinct.set(signature, item);
  }
  return { drafts: [...distinct.values()].sort((a, b) => b.savedAt.localeCompare(a.savedAt)), unreadable };
}
