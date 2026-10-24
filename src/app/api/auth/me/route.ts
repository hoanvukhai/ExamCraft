import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { apiErrorResponse } from '@/lib/api-error';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    return NextResponse.json({ user });
  } catch (error) {
    return apiErrorResponse(error, 'Không kiểm tra được phiên đăng nhập.');
  }
}
