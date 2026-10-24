'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Exam } from '@/types/exam';
import { loadExam, persistExam, SaveExamError, isExamAccessError } from '@/lib/exam-client';
import { readDraft, writeDraft, retireWriterDraft, stageLatestExam } from '@/lib/exam-draft';

export type SaveState = 'loading' | 'saved' | 'dirty' | 'saving' | 'offline' | 'conflict' | 'error';
function blankExam(): Exam {
  const now = new Date(), year = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  return { id: `draft_${crypto.randomUUID()}`, metadata: { title: 'ĐỀ KIỂM TRA MỚI', schoolName: '', departmentName: '', subject: 'toan', grade: 6, durationMinutes: 45, academicYear: `${year} - ${year + 1}` }, questions: [], createdAt: now.toISOString(), updatedAt: now.toISOString() };
}

export function useExamPersistence(ownerId: string, requestedId?: string) {
  const [exam, setValue] = useState<Exam>(blankExam);
  const [state, setState] = useState<SaveState>('loading');
  const [message, setMessage] = useState('');
  const [loadedKey, setLoadedKey] = useState('');
  const [writerId] = useState(() => crypto.randomUUID());
  const current = useRef(exam), edits = useRef(0), savedEdits = useRef(0), ready = useRef(false);
  const activeOwner = useRef(ownerId), flight = useRef<Promise<Exam | null> | null>(null);
  const storageId = useRef(requestedId && requestedId !== 'new' ? requestedId : 'new');
  const generation = useRef(0);

  const setExam = useCallback((value: React.SetStateAction<Exam>) => {
    if (!ready.current || activeOwner.current !== ownerId || current.current.access?.canEdit === false) return;
    const next = typeof value === 'function' ? value(current.current) : value;
    if (next === current.current) return;
    current.current = next; edits.current += 1;
    setValue(next); setState(previous => previous === 'conflict' ? previous : 'dirty');
  }, [ownerId]);

  useEffect(() => {
    let cancelled = false;
    const id = requestedId && requestedId !== 'new' ? requestedId : 'new';
    if (ready.current && activeOwner.current === ownerId && current.current.serverId === id) {
      queueMicrotask(() => { if (!cancelled) setLoadedKey(`${ownerId}/${requestedId ?? 'new'}`); });
      return () => { cancelled = true; };
    }
    generation.current += 1; flight.current = null;
    activeOwner.current = ownerId; ready.current = false; storageId.current = id;
    setState('loading');
    (async () => {
      try {
        const draft = readDraft(localStorage, ownerId, id);
        let loaded: Exam;
        if (id === 'new') loaded = draft ?? blankExam();
        else {
          const server = await loadExam(id, ownerId);
          loaded = draft ? { ...draft, access: server.access } : server;
          if (draft && draft.version !== server.version) {
            if (cancelled) return;
            const recovered = { ...draft, access: server.access };
            current.current = recovered; setValue(recovered); edits.current = 1; savedEdits.current = 0; ready.current = true; setLoadedKey(`${ownerId}/${requestedId ?? 'new'}`);
            setState('conflict'); setMessage('Có bản nháp trên máy và một phiên bản khác trên máy chủ. Hãy tải bản nháp trước khi mở lại bản máy chủ.'); return;
          }
        }
        if (cancelled) return;
        current.current = loaded; setValue(loaded); edits.current = draft ? 1 : 0; savedEdits.current = 0; ready.current = true; setLoadedKey(`${ownerId}/${requestedId ?? 'new'}`);
        setState(draft ? 'dirty' : id === 'new' ? 'dirty' : 'saved'); setMessage('');
      } catch (error) {
        if (cancelled) return;
        try {
          const cached = readDraft(localStorage, ownerId, id, true);
          if (cached && !(error instanceof SaveExamError && error.status >= 400 && error.status < 500)) {
            current.current = cached; setValue(cached); edits.current = 1; savedEdits.current = 0; ready.current = true; setLoadedKey(`${ownerId}/${requestedId ?? 'new'}`);
            setState('offline'); setMessage('Đang mở bản lưu trên máy. Khi kết nối lại, hệ thống sẽ kiểm phiên bản trước khi ghi.'); return;
          }
        } catch { /* Keep unreadable data in place for manual recovery. */ }
        setState('error'); setMessage(error instanceof Error ? error.message : 'Không mở được bản nháp. Dữ liệu cũ vẫn được giữ.');
      }
    })();
    return () => { cancelled = true; };
  }, [ownerId, requestedId]);

  const freezeAccess = useCallback(() => {
    let warning = '';
    if (edits.current !== savedEdits.current) {
      try { writeDraft(localStorage, ownerId, storageId.current, current.current, true, writerId); }
      catch { warning = ' Bộ nhớ nháp bị chặn hoặc đầy; hãy tải bản nháp đang mở xuống trước khi rời trang.'; }
    }
    ready.current = false; setLoadedKey('');
    return warning;
  }, [ownerId, writerId]);

  const save = useCallback(async (): Promise<Exam | null> => {
    if (!ready.current || activeOwner.current !== ownerId) return null;
    if (current.current.access?.canEdit === false) { setMessage('Bạn đang có quyền xem/góp ý. Chủ đề cần cấp quyền sửa để lưu thay đổi.'); return null; }
    if (flight.current) return flight.current;
    const document = current.current, revision = edits.current, savingOwner = ownerId, savingGeneration = generation.current;
    setState('saving'); setMessage('');
    const operation = (async () => {
      try {
        const saved = await persistExam(document, savingOwner);
        if (activeOwner.current !== savingOwner || generation.current !== savingGeneration) return null;
        const stillCurrent = edits.current === revision;
        const next = stillCurrent ? saved : { ...current.current, id: saved.id, serverId: saved.id, version: saved.version, access: saved.access };
        current.current = next; savedEdits.current = revision; setValue(next);
        let cacheWritten = false;
        try { writeDraft(localStorage, savingOwner, saved.id, next, !stillCurrent, writerId); cacheWritten = true; }
        catch { setMessage('Đề đã lưu trên máy chủ. Bộ nhớ nháp trên máy đang đầy hoặc bị chặn.'); }
        if (storageId.current !== saved.id) {
          // Switch the address before retiring the unacknowledged new-draft entry.
          window.history.replaceState(null, '', `/editor/${saved.id}`);
          if (storageId.current === 'new' && cacheWritten) {
            try { retireWriterDraft(localStorage, savingOwner, 'new', writerId, next); } catch { /* Keep the old recovery data if acknowledgement cannot be recorded. */ }
          }
        }
        storageId.current = saved.id;
        setState(stillCurrent ? 'saved' : 'dirty');
        return saved;
      } catch (error) {
        if (activeOwner.current !== savingOwner || generation.current !== savingGeneration) return null;
        const warning = isExamAccessError(error) ? freezeAccess() : '';
        setState(error instanceof SaveExamError && error.status === 409 ? 'conflict' : navigator.onLine ? 'error' : 'offline');
        setMessage((error instanceof Error ? error.message : 'Chưa lưu được đề. Bản nháp vẫn được giữ.') + warning);
        return null;
      } finally { if (generation.current === savingGeneration) flight.current = null; }
    })();
    flight.current = operation;
    return operation;
  }, [ownerId, writerId, freezeAccess]);

  const ensureSaved = useCallback(async () => {
    for (let attempt = 0; attempt < 4; attempt++) {
      const saved = await save();
      if (!saved) return null;
      if (edits.current === savedEdits.current) return current.current;
    }
    setMessage('Đề vẫn đang được sửa. Hãy đợi lưu xong rồi tạo liên kết.');
    return null;
  }, [save]);

  useEffect(() => {
    if (!ready.current || state === 'loading' || activeOwner.current !== ownerId) return;
    if (edits.current !== savedEdits.current || state === 'dirty') {
      try { writeDraft(localStorage, ownerId, storageId.current, exam, true, writerId); }
      catch { queueMicrotask(() => setMessage('Bộ nhớ bản nháp trên máy đã đầy hoặc bị chặn. Hãy tải bản sao JSON và thử lưu lại.')); }
    }
    if (state !== 'dirty') return;
    const timer = setTimeout(() => { void save(); }, 900);
    return () => clearTimeout(timer);
  }, [exam, state, ownerId, save, writerId]);

  useEffect(() => {
    const retry = () => { if (ready.current && edits.current !== savedEdits.current) setState(previous => previous === 'conflict' ? previous : 'dirty'); };
    const unload = (event: BeforeUnloadEvent) => { if (edits.current !== savedEdits.current) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('online', retry); window.addEventListener('beforeunload', unload);
    return () => { window.removeEventListener('online', retry); window.removeEventListener('beforeunload', unload); };
  }, []);

  useEffect(() => {
    let cancelled = false, polling = false;
    const refresh = async () => {
      if (polling || flight.current || !ready.current || activeOwner.current !== ownerId || !current.current.serverId || !navigator.onLine) return;
      polling = true;
      const id = current.current.serverId, pollingGeneration = generation.current;
      try {
        const remote = await loadExam(id, ownerId);
        if (cancelled || generation.current !== pollingGeneration || flight.current || current.current.serverId !== id || activeOwner.current !== ownerId) return;
        if (remote.access?.canEdit === false && edits.current !== savedEdits.current) {
          current.current = { ...current.current, access: remote.access }; setValue(current.current);
          setState('conflict'); setMessage('Quyền sửa đã thay đổi. Bản nháp vẫn được giữ, nhưng chưa thể ghi vào đề chung.'); return;
        }
        if (remote.version === current.current.version && JSON.stringify(remote.access) === JSON.stringify(current.current.access)) return;
        if (edits.current !== savedEdits.current) {
          setState('conflict'); setMessage('Có người vừa lưu phiên bản mới. Bản nháp của bạn vẫn được giữ; hãy đối chiếu hoặc lưu bản sao.');
          return;
        }
        current.current = remote; setValue(remote); setState('saved');
        try { writeDraft(localStorage, ownerId, id, remote, false, writerId); } catch { /* Server data remains available. */ }
      } catch (error) {
        if (cancelled || generation.current !== pollingGeneration || current.current.serverId !== id || activeOwner.current !== ownerId) return;
        if (isExamAccessError(error)) {
          const warning = freezeAccess();
          setState('error'); setMessage('Phiên đăng nhập hoặc quyền truy cập đề đã thay đổi. Hãy kiểm tra lại từ kho đề. Bản đang mở vẫn có thể tải xuống.' + warning);
        }
      } finally { polling = false; }
    };
    const interval = setInterval(() => void refresh(), 8000);
    window.addEventListener('focus', refresh);
    return () => { cancelled = true; clearInterval(interval); window.removeEventListener('focus', refresh); };
  }, [ownerId, writerId, freezeAccess]);

  const saveCopy = useCallback(async () => {
    if (!ready.current || activeOwner.current !== ownerId) { setMessage('Hãy mở lại đúng tài khoản trước khi tạo bản sao. Bản nháp vẫn được giữ.'); return null; }
    if (flight.current) { setMessage('Đang lưu đề. Hãy đợi lần lưu hiện tại kết thúc trước khi tạo bản sao.'); return null; }
    const value = { ...current.current, id: `draft_${crypto.randomUUID()}`, serverId: undefined, version: undefined, access: undefined, metadata: { ...current.current.metadata, title: `${current.current.metadata.title} (Bản sao phục hồi)` } };
    current.current = value; edits.current += 1; setValue(value); setState('dirty');
    return save();
  }, [ownerId, save]);

  const openLatest = useCallback(async (): Promise<Exam | null> => {
    if (!ready.current || activeOwner.current !== ownerId || !current.current.serverId || flight.current) return null;
    const id = current.current.serverId, revision = edits.current, requestGeneration = generation.current;
    setState('saving'); setMessage('Đang tải bản máy chủ và giữ riêng bản nháp…');
    const operation = (async () => {
      try {
        const remote = await loadExam(id, ownerId);
        if (generation.current !== requestGeneration || activeOwner.current !== ownerId || current.current.serverId !== id) return null;
        if (edits.current !== revision) { setState('conflict'); setMessage('Bạn vừa sửa thêm trong lúc tải. Chưa thay bản đang soạn; hãy thử mở bản máy chủ lại.'); return null; }
        try { stageLatestExam(localStorage, ownerId, current.current, remote, writerId); }
        catch { setState('conflict'); setMessage('Chưa thể giữ riêng nháp vì bộ nhớ bị chặn hoặc đầy. Hãy tải bản nháp trước; bản đang soạn chưa bị thay.'); return null; }
        current.current = remote; savedEdits.current = edits.current; setValue(remote); setState('saved');
        setMessage('Đã mở bản máy chủ. Nháp trước đó còn trong “Bản nháp chưa lưu trên máy này” để tải hoặc mở riêng.');
        return remote;
      } catch (error) {
        if (generation.current !== requestGeneration || activeOwner.current !== ownerId) return null;
        const warning = isExamAccessError(error) ? freezeAccess() : '';
        setState('conflict'); setMessage((error instanceof Error ? error.message : 'Chưa mở được bản máy chủ; bản nháp vẫn được giữ.') + warning); return null;
      } finally { if (generation.current === requestGeneration) flight.current = null; }
    })();
    flight.current = operation;
    return operation;
  }, [ownerId, writerId, freezeAccess]);

  const acceptServerDocument = useCallback((document: Exam) => {
    if (flight.current || edits.current !== savedEdits.current || document.id !== current.current.id) {
      setState('conflict'); setMessage('Bản trên máy chủ đã đổi. Bản nháp đang sửa vẫn được giữ để đối chiếu.'); return false;
    }
    const next = { ...document, serverId: document.id, access: current.current.access };
    current.current = next; setValue(next); setState('saved'); setMessage('Đã mở phiên bản mới từ máy chủ.');
    try { writeDraft(localStorage, ownerId, next.id, next, false, writerId); } catch { /* Preserve server acknowledgement. */ }
    return true;
  }, [ownerId, writerId]);

  return { exam, setExam, save, ensureSaved, saveCopy, openLatest, acceptServerDocument, state, message, ready: state !== 'loading' && loadedKey === `${ownerId}/${requestedId ?? 'new'}` };
}
