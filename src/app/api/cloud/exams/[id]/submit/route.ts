import { NextRequest, NextResponse } from 'next/server';
import { getCloudExamById, saveStudentSubmission, StudentSubmission } from '@/lib/cloud-storage';
import { gradeStudentExam } from '@/lib/auto-grader';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const exam = getCloudExamById(id);

    if (!exam) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy đề thi này để nộp bài.' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { studentName, studentClass, schoolName, startedAt, durationSeconds, answers } = body;

    if (!studentName || !studentName.trim()) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng nhập họ và tên của học sinh.' },
        { status: 400 }
      );
    }

    // Tự động chấm điểm
    const grading = gradeStudentExam(exam, answers || {});

    // Tạo bản ghi bài nộp
    const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const submission: StudentSubmission = {
      id: submissionId,
      examId: id,
      studentName: studentName.trim(),
      studentClass: (studentClass || 'Tự do').trim(),
      schoolName: (schoolName || exam.metadata.schoolName || '').trim(),
      startedAt: startedAt || new Date().toISOString(),
      submittedAt: new Date().toISOString(),
      durationSeconds: durationSeconds || 0,
      totalScore: grading.totalScore,
      maxScore: grading.maxScore,
      part1Score: grading.part1Score,
      part2Score: grading.part2Score,
      part3Score: grading.part3Score,
      answers: grading.details.map((d) => ({
        questionId: d.questionId,
        questionIndex: d.questionIndex,
        type: d.type,
        studentAnswer: d.studentAnswer,
        isCorrect: d.isCorrect,
        scoreEarned: d.scoreEarned,
        correctAnswer: d.correctAnswer,
      })),
    };

    saveStudentSubmission(submission);

    return NextResponse.json({
      success: true,
      message: 'Nộp bài thành công!',
      submissionId,
      grading,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi khi xử lý nộp bài' },
      { status: 500 }
    );
  }
}
