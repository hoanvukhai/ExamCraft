import { NextRequest, NextResponse } from 'next/server';
import { getStudentSubmissions } from '@/lib/cloud-storage';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const submissions = getStudentSubmissions(id);

    return NextResponse.json({
      success: true,
      submissions,
      totalCount: submissions.length,
      averageScore:
        submissions.length > 0
          ? Math.round(
              (submissions.reduce((sum, s) => sum + s.totalScore, 0) / submissions.length) * 100
            ) / 100
          : 0,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi khi tải bảng điểm học sinh' },
      { status: 500 }
    );
  }
}
