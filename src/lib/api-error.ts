import { NextResponse } from 'next/server';
import { unstable_rethrow } from 'next/navigation';
import { DocumentValidationError } from './exam-document';

export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) { super(message); }
}

export function apiErrorResponse(error: unknown, fallback: string) {
  unstable_rethrow(error);
  if (error instanceof ApiError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  if (error instanceof DocumentValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
  const message = error instanceof Error ? error.message : '';
  if (message === 'API_KEY_INPUT_INVALID' || message === 'API_KEY_INPUT_CONFLICT') return NextResponse.json({ error: 'Khóa tạm không hợp lệ hoặc các trường khóa không trùng nhau' }, { status: 400 });
  if (message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Vui lòng đăng nhập' }, { status: 401 });
  if (message === 'MUST_CHANGE_PASSWORD') return NextResponse.json({ error: 'Vui lòng đổi mật khẩu trước khi tiếp tục', code: message }, { status: 403 });
  if (error instanceof SyntaxError) return NextResponse.json({ error: 'Dữ liệu gửi lên không phải JSON hợp lệ' }, { status: 400 });
  console.error(fallback, { type: error instanceof Error ? error.name : 'UnknownError' });
  return NextResponse.json({ error: fallback }, { status: 500 });
}
