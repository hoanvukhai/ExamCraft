'use client';
import { withEditorParts } from '@/lib/editor-parts';
import { reconcileQuestionOutline } from '@/lib/exam-outline';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { Exam } from '@/types/exam';
import { loadExam, checkExamVersion, persistExam, SaveExamError, isExamAccessError } from '@/lib/exam-client';
import { readDraft, writeDraft, retireWriterDraft, stageLatestExam } from '@/lib/exam-draft';
import { copyQuestionDraftsAfterCreate } from '@/lib/question-draft';
import { mergeExams, type MergeChoices, type MergeConflict } from '@/lib/exam-merge';

export type RemoteChange = { id: number; labels: string[]; merged: boolean };

/** Which questions differ, as "Câu n", plus the exam information when it differs. */
function describeChange(before: Exam, after: Exam): string[] {
  const labels: string[] = [];
  const old = new Map(before.questions.map((question) => [question.id, JSON.stringify(question)]));
  after.questions.forEach((question, index) => {
    if (old.get(question.id) !== JSON.stringify(question)) labels.push('Câu ' + (index + 1));
  });
  const removed = before.questions.filter(
    (question) => !after.questions.some((item) => item.id === question.id),
  ).length;
  if (removed) labels.push(removed + ' câu bị xóa');
  if (JSON.stringify(before.metadata) !== JSON.stringify(after.metadata)) labels.push('thông tin đề');
  return labels;
}

export type SaveState = 'loading' | 'saved' | 'dirty' | 'saving' | 'offline' | 'conflict' | 'error';
function blankExam(): Exam {
  const now = new Date(),
    year = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  return {
    id: `draft_${crypto.randomUUID()}`,
    metadata: {
      title: 'ĐỀ KIỂM TRA MỚI',
      schoolName: '',
      departmentName: '',
      subject: 'toan',
      grade: 6,
      durationMinutes: 45,
      academicYear: `${year} - ${year + 1}`,
    },
    questions: [],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

export function useExamPersistence(ownerId: string, requestedId?: string, creationFolderId?: string | null) {
  const pathname = usePathname();
  const [exam, setValue] = useState<Exam>(blankExam);
  const [state, setState] = useState<SaveState>('loading');
  const [message, setMessage] = useState('');
  const [recoveredDraft, setRecoveredDraft] = useState(false);
  const [folderUnavailable, setFolderUnavailable] = useState(false);
  const [loadedKey, setLoadedKey] = useState('');
  const [writerId] = useState(() => crypto.randomUUID());
  const [editorSessionKey, setEditorSessionKey] = useState(() => crypto.randomUUID());
  const current = useRef(exam),
    edits = useRef(0),
    savedEdits = useRef(0),
    ready = useRef(false);
  const activeOwner = useRef(ownerId),
    flight = useRef<Promise<Exam | null> | null>(null);
  const storageId = useRef(requestedId && requestedId !== 'new' ? requestedId : 'new');
  const generation = useRef(0);
  const peers = useRef(false);
  /** Tell the hook whether someone else has the exam open, so it asks more often. */
  const setPeersPresent = useCallback((present: boolean) => {
    peers.current = present;
  }, []);
  // The last copy that is known to be on the server: what both of us started from when two people edit.
  const serverBase = useRef<Exam | null>(null);
  // Places both of us changed differently: shown to the teacher to choose, with the server copy they collided with.
  const [conflicts, setConflicts] = useState<{ list: MergeConflict[]; remote: Exam } | null>(null);
  const [remoteChange, setRemoteChange] = useState<RemoteChange | null>(null);
  const announce = useCallback((before: Exam, after: Exam, merged: boolean) => {
    const labels = describeChange(before, after);
    if (labels.length) setRemoteChange((previous) => ({ id: (previous?.id ?? 0) + 1, labels, merged }));
  }, []);

  const setExam = useCallback(
    (value: React.SetStateAction<Exam>) => {
      if (!ready.current || activeOwner.current !== ownerId || current.current.access?.canEdit === false)
        return false;
      const base = withEditorParts(current.current);
      const candidate = typeof value === 'function' ? value(base) : value;
      if (candidate === base) return false;
      let next: Exam;
      try {
        next = withEditorParts(reconcileQuestionOutline(base, candidate));
      } catch {
        setMessage('Chưa áp dụng được thay đổi dàn ý. Nội dung đang soạn vẫn được giữ.');
        return false;
      }
      if (next === current.current) return false;
      current.current = next;
      edits.current += 1;
      setValue(next);
      setState((previous) => (previous === 'conflict' ? previous : 'dirty'));
      return true;
    },
    [ownerId],
  );

  useEffect(() => {
    let cancelled = false;
    const id = requestedId && requestedId !== 'new' ? requestedId : 'new';
    // A successful create replaces the URL before Next updates the route props.
    // Both a new draft and a recovery copy must retain their acknowledged ID
    // while the URL updates before the server route props catch up.
    if (
      ready.current &&
      activeOwner.current === ownerId &&
      (current.current.serverId === id ||
        (current.current.serverId && pathname === `/editor/${current.current.serverId}`))
    ) {
      queueMicrotask(() => {
        if (!cancelled) setLoadedKey(`${ownerId}/${requestedId ?? 'new'}`);
      });
      return () => {
        cancelled = true;
      };
    }
    generation.current += 1;
    flight.current = null;
    setEditorSessionKey(crypto.randomUUID());
    activeOwner.current = ownerId;
    ready.current = false;
    storageId.current = id;
    setState('loading');
    setFolderUnavailable(false);
    (async () => {
      try {
        const draft = readDraft(localStorage, ownerId, id);
        if (!cancelled) setRecoveredDraft(Boolean(draft && id !== 'new'));
        let loaded: Exam;
        if (id === 'new') loaded = draft ?? { ...blankExam(), creationFolderId: creationFolderId ?? null };
        else {
          const server = await loadExam(id, ownerId);
          loaded = draft ? { ...draft, access: server.access } : server;
          if (draft && draft.version !== server.version) {
            if (cancelled) return;
            const recovered = { ...draft, access: server.access };
            current.current = recovered;
            setValue(recovered);
            edits.current = 1;
            savedEdits.current = 0;
            ready.current = true;
            setLoadedKey(`${ownerId}/${requestedId ?? 'new'}`);
            setState('conflict');
            setMessage(
              'Có bản nháp trên máy và một phiên bản khác trên máy chủ. Hãy tải bản nháp trước khi mở lại bản máy chủ.',
            );
            return;
          }
        }
        if (cancelled) return;
        current.current = loaded;
        if (!draft) serverBase.current = loaded;
        setValue(loaded);
        edits.current = draft ? 1 : 0;
        savedEdits.current = 0;
        ready.current = true;
        setLoadedKey(`${ownerId}/${requestedId ?? 'new'}`);
        setState(draft ? 'dirty' : id === 'new' ? 'dirty' : 'saved');
        setMessage(
          id === 'new' && draft && (draft.creationFolderId ?? null) !== (creationFolderId ?? null)
            ? 'Đang giữ bản nháp trước cùng vị trí tạo ban đầu. Hãy lưu hoặc giữ bản này thành đề riêng trước khi tạo đề ở thư mục khác.'
            : '',
        );
      } catch (error) {
        if (cancelled) return;
        try {
          const cached = readDraft(localStorage, ownerId, id, true);
          if (cached && !(error instanceof SaveExamError && error.status >= 400 && error.status < 500)) {
            current.current = cached;
            setValue(cached);
            edits.current = 1;
            savedEdits.current = 0;
            ready.current = true;
            setLoadedKey(`${ownerId}/${requestedId ?? 'new'}`);
            setState('offline');
            setMessage(
              'Đang mở bản lưu trên máy. Khi kết nối lại, hệ thống sẽ kiểm phiên bản trước khi ghi.',
            );
            return;
          }
        } catch {
          /* Keep unreadable data in place for manual recovery. */
        }
        setState('error');
        setMessage(
          error instanceof Error ? error.message : 'Không mở được bản nháp. Dữ liệu cũ vẫn được giữ.',
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ownerId, requestedId, creationFolderId, pathname]);

  const freezeAccess = useCallback(() => {
    let warning = '';
    if (edits.current !== savedEdits.current) {
      try {
        writeDraft(localStorage, ownerId, storageId.current, current.current, true, writerId);
      } catch {
        warning = ' Bộ nhớ nháp bị chặn hoặc đầy; hãy tải bản nháp đang mở xuống trước khi rời trang.';
      }
    }
    ready.current = false;
    setLoadedKey('');
    return warning;
  }, [ownerId, writerId]);

  const save = useCallback(async (): Promise<Exam | null> => {
    if (!ready.current || activeOwner.current !== ownerId) return null;
    if (current.current.access?.canEdit === false) {
      setMessage('Bạn đang có quyền xem/góp ý. Chủ đề cần cấp quyền sửa để lưu thay đổi.');
      return null;
    }
    if (flight.current) return flight.current;
    const document = current.current,
      revision = edits.current,
      savingOwner = ownerId,
      savingGeneration = generation.current;
    setState('saving');
    setMessage('');
    setFolderUnavailable(false);
    const operation = (async () => {
      try {
        const saved = await persistExam(document, savingOwner);
        if (activeOwner.current !== savingOwner || generation.current !== savingGeneration) return null;
        const stillCurrent = edits.current === revision;
        const next = stillCurrent
          ? saved
          : {
              ...current.current,
              id: saved.id,
              serverId: saved.id,
              version: saved.version,
              access: saved.access,
            };
        if (!document.serverId && document.id !== saved.id) {
          try {
            if (!copyQuestionDraftsAfterCreate(savingOwner, document.id, saved.id, localStorage))
              setMessage(
                'Đề đã lưu; có nháp câu chưa chuyển đầy đủ. Bản gốc vẫn được giữ trong danh sách nháp trên máy.',
              );
          } catch {
            setMessage('Đề đã lưu; hãy giữ tab và tải nháp câu vì bộ nhớ máy chưa xác nhận được bản nháp.');
          }
        }
        current.current = next;
        serverBase.current = saved;
        savedEdits.current = revision;
        setValue(next);
        if (stillCurrent) setRecoveredDraft(false);
        let cacheWritten = false;
        try {
          writeDraft(localStorage, savingOwner, saved.id, next, !stillCurrent, writerId);
          cacheWritten = true;
        } catch {
          setMessage('Đề đã lưu trên máy chủ. Bộ nhớ nháp trên máy đang đầy hoặc bị chặn.');
        }
        if (storageId.current !== saved.id) {
          // Switch the address before retiring the unacknowledged new-draft entry.
          window.history.replaceState(null, '', `/editor/${saved.id}`);
          if (storageId.current === 'new' && cacheWritten) {
            try {
              retireWriterDraft(localStorage, savingOwner, 'new', writerId, next);
            } catch {
              /* Keep the old recovery data if acknowledgement cannot be recorded. */
            }
          }
        }
        storageId.current = saved.id;
        setState(stillCurrent ? 'saved' : 'dirty');
        return saved;
      } catch (error) {
        if (activeOwner.current !== savingOwner || generation.current !== savingGeneration) return null;
        const warning = isExamAccessError(error) ? freezeAccess() : '';
        setFolderUnavailable(error instanceof SaveExamError && error.code === 'FOLDER_UNAVAILABLE');
        setState(
          error instanceof SaveExamError && error.status === 409
            ? 'conflict'
            : navigator.onLine
              ? 'error'
              : 'offline',
        );
        setMessage(
          (error instanceof Error ? error.message : 'Chưa lưu được đề. Bản nháp vẫn được giữ.') + warning,
        );
        return null;
      } finally {
        if (generation.current === savingGeneration) flight.current = null;
      }
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
      try {
        writeDraft(localStorage, ownerId, storageId.current, exam, true, writerId);
      } catch {
        queueMicrotask(() =>
          setMessage('Bộ nhớ bản nháp trên máy đã đầy hoặc bị chặn. Hãy tải bản sao JSON và thử lưu lại.'),
        );
      }
    }
    if (state !== 'dirty') return;
    const timer = setTimeout(() => {
      void save();
    }, 900);
    return () => clearTimeout(timer);
  }, [exam, state, ownerId, save, writerId]);

  useEffect(() => {
    const retry = () => {
      if (ready.current && edits.current !== savedEdits.current)
        setState((previous) => (previous === 'conflict' ? previous : 'dirty'));
    };
    const unload = (event: BeforeUnloadEvent) => {
      if (edits.current !== savedEdits.current) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('online', retry);
    window.addEventListener('beforeunload', unload);
    return () => {
      window.removeEventListener('online', retry);
      window.removeEventListener('beforeunload', unload);
    };
  }, []);

  useEffect(() => {
    let cancelled = false,
      polling = false;
    const refresh = async () => {
      if (
        polling ||
        flight.current ||
        !ready.current ||
        activeOwner.current !== ownerId ||
        !current.current.serverId ||
        !navigator.onLine
      )
        return;
      polling = true;
      const id = current.current.serverId,
        pollingGeneration = generation.current;
      try {
        // Ask for the version alone; the whole exam is loaded only when something is different.
        const quick = await checkExamVersion(id, ownerId);
        if (
          quick.version === current.current.version &&
          JSON.stringify(quick.permissions) === JSON.stringify(current.current.access)
        )
          return;
        const remote = await loadExam(id, ownerId);
        if (
          cancelled ||
          generation.current !== pollingGeneration ||
          flight.current ||
          current.current.serverId !== id ||
          activeOwner.current !== ownerId
        )
          return;
        if (remote.access?.canEdit === false && edits.current !== savedEdits.current) {
          current.current = { ...current.current, access: remote.access };
          setValue(current.current);
          setState('conflict');
          setMessage('Quyền sửa đã thay đổi. Bản nháp vẫn được giữ, nhưng chưa thể ghi vào đề chung.');
          return;
        }
        if (
          remote.version === current.current.version &&
          JSON.stringify(remote.access) === JSON.stringify(current.current.access)
        )
          return;
        if (edits.current !== savedEdits.current) {
          const base = serverBase.current;
          if (base && base.id === remote.id) {
            const result = mergeExams(base, current.current, remote);
            if (!result.conflicts.length) {
              // Different parts were changed: keep both and let the normal save carry them.
              const merged = {
                ...result.exam,
                serverId: remote.serverId ?? remote.id,
                version: remote.version,
                access: remote.access,
              };
              announce(base, remote, true);
              serverBase.current = remote;
              current.current = merged;
              edits.current += 1;
              setValue(merged);
              setState('dirty');
              setMessage('Đã ghép phần người khác vừa sửa vào bản của bạn.');
              return;
            }
          }
          if (base && base.id === remote.id) {
            const result = mergeExams(base, current.current, remote);
            setConflicts({ list: result.conflicts, remote });
          }
          setState('conflict');
          setMessage(
            'Có người vừa lưu phiên bản mới và cùng sửa một chỗ với bạn. Bản nháp của bạn vẫn được giữ; hãy đối chiếu hoặc lưu bản sao.',
          );
          return;
        }
        setConflicts(null);
        announce(current.current, remote, false);
        serverBase.current = remote;
        current.current = remote;
        setValue(remote);
        setState('saved');
        try {
          writeDraft(localStorage, ownerId, id, remote, false, writerId);
        } catch {
          /* Server data remains available. */
        }
      } catch (error) {
        if (
          cancelled ||
          generation.current !== pollingGeneration ||
          current.current.serverId !== id ||
          activeOwner.current !== ownerId
        )
          return;
        if (isExamAccessError(error)) {
          const warning = freezeAccess();
          setState('error');
          setMessage(
            'Phiên đăng nhập hoặc quyền truy cập đề đã thay đổi. Hãy kiểm tra lại từ kho đề. Bản đang mở vẫn có thể tải xuống.' +
              warning,
          );
        }
      } finally {
        polling = false;
      }
    };
    // Often when someone else is in the exam, rarely when alone, never while the tab is hidden.
    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      timer = setTimeout(
        () => {
          if (document.visibilityState !== 'hidden') void refresh();
          if (!cancelled) schedule();
        },
        peers.current ? 10_000 : 30_000,
      );
    };
    schedule();
    const wake = () => {
      if (document.visibilityState !== 'hidden') void refresh();
    };
    window.addEventListener('focus', wake);
    document.addEventListener('visibilitychange', wake);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      window.removeEventListener('focus', wake);
      document.removeEventListener('visibilitychange', wake);
    };
  }, [ownerId, writerId, freezeAccess, announce]);

  const saveCopy = useCallback(async () => {
    if (!ready.current || activeOwner.current !== ownerId) {
      setMessage('Hãy mở lại đúng tài khoản trước khi tạo bản sao. Bản nháp vẫn được giữ.');
      return null;
    }
    if (flight.current) {
      setMessage('Đang lưu đề. Hãy đợi lần lưu hiện tại kết thúc trước khi tạo bản sao.');
      return null;
    }
    const value = {
      ...current.current,
      id: `draft_${crypto.randomUUID()}`,
      serverId: undefined,
      version: undefined,
      access: undefined,
      metadata: {
        ...current.current.metadata,
        title: `${current.current.metadata.title} (Bản sao phục hồi)`,
      },
    };
    current.current = value;
    edits.current += 1;
    setValue(value);
    setState('dirty');
    return save();
  }, [ownerId, save]);

  const openLatest = useCallback(async (): Promise<Exam | null> => {
    if (!ready.current || activeOwner.current !== ownerId || !current.current.serverId || flight.current)
      return null;
    const id = current.current.serverId,
      revision = edits.current,
      requestGeneration = generation.current;
    setState('saving');
    setMessage('Đang tải bản máy chủ và giữ riêng bản nháp…');
    const operation = (async () => {
      try {
        const remote = await loadExam(id, ownerId);
        if (
          generation.current !== requestGeneration ||
          activeOwner.current !== ownerId ||
          current.current.serverId !== id
        )
          return null;
        if (edits.current !== revision) {
          setState('conflict');
          setMessage('Bạn vừa sửa thêm trong lúc tải. Chưa thay bản đang soạn; hãy thử mở bản máy chủ lại.');
          return null;
        }
        try {
          stageLatestExam(localStorage, ownerId, current.current, remote, writerId);
        } catch {
          setState('conflict');
          setMessage(
            'Chưa thể giữ riêng nháp vì bộ nhớ bị chặn hoặc đầy. Hãy tải bản nháp trước; bản đang soạn chưa bị thay.',
          );
          return null;
        }
        current.current = remote;
        serverBase.current = remote;
        savedEdits.current = edits.current;
        setValue(remote);
        setState('saved');
        setMessage(
          'Đã mở bản máy chủ. Nháp trước đó còn trong “Bản nháp chưa lưu trên máy này” để tải hoặc mở riêng.',
        );
        return remote;
      } catch (error) {
        if (generation.current !== requestGeneration || activeOwner.current !== ownerId) return null;
        const warning = isExamAccessError(error) ? freezeAccess() : '';
        setState('conflict');
        setMessage(
          (error instanceof Error ? error.message : 'Chưa mở được bản máy chủ; bản nháp vẫn được giữ.') +
            warning,
        );
        return null;
      } finally {
        if (generation.current === requestGeneration) flight.current = null;
      }
    })();
    flight.current = operation;
    return operation;
  }, [ownerId, writerId, freezeAccess]);

  const acceptServerDocument = useCallback(
    (document: Exam) => {
      if (flight.current || edits.current !== savedEdits.current || document.id !== current.current.id) {
        setState('conflict');
        setMessage('Bản trên máy chủ đã đổi. Bản nháp đang sửa vẫn được giữ để đối chiếu.');
        return false;
      }
      const next = { ...document, serverId: document.id, access: current.current.access };
      serverBase.current = next;
      current.current = next;
      setValue(next);
      setState('saved');
      setMessage('Đã mở phiên bản mới từ máy chủ.');
      try {
        writeDraft(localStorage, ownerId, next.id, next, false, writerId);
      } catch {
        /* Preserve server acknowledgement. */
      }
      return true;
    },
    [ownerId, writerId],
  );

  const resolveConflicts = useCallback(
    (choices: MergeChoices) => {
      const pending = conflicts,
        base = serverBase.current;
      if (!pending || !base || flight.current) return false;
      const result = mergeExams(base, current.current, pending.remote, choices);
      const merged = {
        ...result.exam,
        serverId: pending.remote.serverId ?? pending.remote.id,
        version: pending.remote.version,
        access: pending.remote.access,
      };
      announce(base, pending.remote, true);
      serverBase.current = pending.remote;
      current.current = merged;
      edits.current += 1;
      setValue(merged);
      setConflicts(null);
      setState('dirty');
      setMessage('Đã ghép theo lựa chọn của bạn.');
      return true;
    },
    [conflicts, announce],
  );

  const editorExam = useMemo(() => withEditorParts(exam), [exam]);
  return {
    exam: editorExam,
    editorSessionKey,
    setExam,
    save,
    ensureSaved,
    saveCopy,
    openLatest,
    acceptServerDocument,
    remoteChange,
    setPeersPresent,
    conflicts: conflicts?.list ?? [],
    resolveConflicts,
    state,
    message,
    folderUnavailable,
    recoveredDraft,
    dismissRecoveredDraft: () => setRecoveredDraft(false),
    ready: state !== 'loading' && loadedKey === `${ownerId}/${requestedId ?? 'new'}`,
  };
}
