import { NextRequest, NextResponse } from 'next/server';
import { getCloudExamById, deleteCloudExam } from '@/lib/cloud-storage';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const exam = getCloudExamById(id);

    if (!exam) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy đề thi này trên hệ thống đám mây.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, exam });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi khi tải đề thi từ Cloud' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const deleted = deleteCloudExam(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Đề thi không tồn tại hoặc đã bị xóa.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Đã xóa đề thi khỏi đám mây.' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi khi xóa đề thi' },
      { status: 500 }
    );
  }
}
