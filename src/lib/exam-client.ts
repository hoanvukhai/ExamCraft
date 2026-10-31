import type { Exam } from '@/types/exam';
import { fromDatabaseExam, normalizeExamDocument } from './exam-document';

export class SaveExamError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
  }
}

export function isExamAccessError(error: unknown): error is SaveExamError {
  return (
    error instanceof SaveExamError &&
    (([401, 403, 404].includes(error.status) && error.code !== 'FOLDER_UNAVAILABLE') ||
      error.code === 'ACCOUNT_CHANGED')
  );
}

async function fetchExam(url: string, options: RequestInit) {
  try {
    return await fetch(url, options);
  } catch {
    throw new SaveExamError(
      'Chưa kết nối được máy chủ. Bản nháp vẫn được giữ trên máy; hãy thử lưu lại khi có kết nối.',
      0,
      'NETWORK_UNAVAILABLE',
    );
  }
}

export async function persistExam(exam: Exam, expectedUserId?: string): Promise<Exam> {
  const { creationFolderId, ...document } = normalizeExamDocument(exam);
  delete document.access;
  const existing = document.serverId === document.id && document.version != null;
  const response = await fetchExam(
    existing ? `/api/exams/${encodeURIComponent(document.id)}` : '/api/exams',
    {
      method: existing ? 'PATCH' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(expectedUserId ? { 'x-examcraft-user': expectedUserId } : {}),
      },
      body: JSON.stringify(
        existing
          ? { document, baseVersion: document.version }
          : {
              document,
              clientId: document.id,
              ...(creationFolderId === undefined ? {} : { folderId: creationFolderId }),
            },
      ),
    },
  );
  const result = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new SaveExamError(
      result.error ?? 'Chưa lưu được đề. Bản nháp vẫn được giữ trên máy',
      response.status,
      result.code,
    );
  return {
    ...(result.document
      ? normalizeExamDocument({ ...result.document, serverId: result.document.id })
      : fromDatabaseExam(result.exam)),
    access: result.permissions,
  };
}

export async function loadExam(id: string, expectedUserId: string): Promise<Exam> {
  const response = await fetchExam(`/api/exams/${encodeURIComponent(id)}`, {
    cache: 'no-store',
    headers: expectedUserId ? { 'x-examcraft-user': expectedUserId } : undefined,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new SaveExamError(result.error ?? 'Không tải được đề', response.status, result.code);
  return {
    ...(result.document
      ? normalizeExamDocument({ ...result.document, serverId: result.document.id })
      : fromDatabaseExam(result.exam)),
    access: result.permissions,
  };
}

/** The current version and permissions of an exam, without its content. */
export async function checkExamVersion(
  id: string,
  expectedUserId: string,
): Promise<{ version: number; permissions: Exam['access'] }> {
  const response = await fetchExam(`/api/exams/${encodeURIComponent(id)}/version`, {
    cache: 'no-store',
    headers: expectedUserId ? { 'x-examcraft-user': expectedUserId } : undefined,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new SaveExamError(result.error ?? 'Không kiểm tra được phiên bản đề', response.status, result.code);
  return { version: result.version, permissions: result.permissions };
}
