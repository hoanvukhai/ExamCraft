import { NextRequest, NextResponse } from 'next/server';
import { getCloudExams, saveCloudExam } from '@/lib/cloud-storage';
import { Exam } from '@/types/exam';

export async function GET() {
  try {
    const examsObj = getCloudExams();
    const examsList = Object.values(examsObj).sort(
      (a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
    );

    return NextResponse.json({
      success: true,
      exams: examsList.map((e) => ({
        id: e.id,
        title: e.metadata.title,
        subject: e.metadata.subject,
        grade: e.metadata.grade,
        questionsCount: e.questions.length,
        durationMinutes: e.metadata.durationMinutes,
        updatedAt: e.updatedAt,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi khi tải danh sách đề thi từ Cloud' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: Exam = await req.json();
    if (!body || !body.questions || !body.metadata) {
      return NextResponse.json({ success: false, error: 'Dữ liệu đề thi không hợp lệ' }, { status: 400 });
    }

    const saved = saveCloudExam(body);
    return NextResponse.json({
      success: true,
      message: 'Đã lưu đề thi thành công lên Đám mây!',
      exam: saved,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi khi lưu đề thi lên Cloud' },
      { status: 500 }
    );
  }
}
