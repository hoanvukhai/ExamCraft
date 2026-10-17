import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AttemptStatus, RevealPolicy, LeaderboardMode } from '@prisma/client';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const answers = body.answers || {};

    const attempt = await prisma.attempt.findUnique({
      where: { id },
      include: {
        assignment: true,
        student: { select: { id: true, displayName: true } },
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: 'Không tìm thấy lượt làm bài' }, { status: 404 });
    }

    // TÍNH BẢO VỆ IDEMPOTENT: Nếu đã nộp trước đó thì trả kết quả ngay, không chấm lại
    if (attempt.status === AttemptStatus.SUBMITTED) {
      return NextResponse.json({
        success: true,
        idempotent: true,
        score: attempt.score,
        maxScore: attempt.maxScore,
        submittedAt: attempt.submittedAt,
        message: 'Bài thi đã được ghi nhận trước đó.',
      });
    }

    // Lấy đề thi từ snapshot bất biến
    const snapshot = attempt.assignment.snapshot as any;
    const questions: any[] = snapshot?.questions || [];
    const sections: any[] = snapshot?.sections || [];

    // Map section id -> section config
    const sectionMap = new Map<string, any>(sections.map((s) => [s.id, s]));

    let totalScore = 0;
    let maxScore = 0;
    const gradedAnswers: any[] = [];

    // Hợp nhất câu trả lời từ body và bản nháp đã lưu
    const studentAnswers = {
      ...((attempt.draft as Record<string, any>) || {}),
      ...answers,
    };

    for (const q of questions) {
      const section = sectionMap.get(q.sectionId);
      const studentResponse = studentAnswers[q.id];
      const qType = q.type;

      let isCorrect = false;
      let earnedPoints = 0;
      let questionMaxPoints = Number(q.points || section?.pointsPerQuestion || 0.25);

      if (qType === 'MULTIPLE_CHOICE') {
        const correctChoice = q.payload?.correct || q.payload?.correct_answer;
        isCorrect = String(studentResponse || '').trim().toUpperCase() === String(correctChoice || '').trim().toUpperCase();
        earnedPoints = isCorrect ? questionMaxPoints : 0;
        maxScore += questionMaxPoints;
      } else if (qType === 'TRUE_FALSE_GROUP') {
        // Chấm lũy tiến theo số ý đúng (chuẩn Bộ GD&ĐT)
        const subQuestions: any[] = q.payload?.sub_questions || [];
        const progressiveScoring: number[] = section?.progressiveScoring || [0.0, 0.1, 0.25, 0.5, 1.0];
        questionMaxPoints = progressiveScoring[progressiveScoring.length - 1] || 1.0;
        maxScore += questionMaxPoints;

        let correctSubCount = 0;
        const subAnswers = typeof studentResponse === 'object' && studentResponse !== null ? studentResponse : {};

        subQuestions.forEach((sub: any) => {
          const expected = Boolean(sub.isCorrect);
          const actual = subAnswers[sub.key];
          if (typeof actual === 'boolean' && actual === expected) {
            correctSubCount++;
          }
        });

        isCorrect = correctSubCount === subQuestions.length;
        earnedPoints = progressiveScoring[correctSubCount] ?? 0;
      } else if (qType === 'SHORT_ANSWER') {
        // Trả lời ngắn / điền số: chuẩn hóa dấu phẩy, khoảng trắng
        maxScore += questionMaxPoints;
        const correctVal = String(q.payload?.correct || q.payload?.correct_answer || '').trim();
        const acceptedList: string[] = q.payload?.accepted_answers || [correctVal];

        const normalize = (str: string) => str.trim().replace(/\s+/g, '').replace(/,/g, '.').toLowerCase();
        const normalizedStudent = normalize(String(studentResponse || ''));

        isCorrect = acceptedList.some((ans) => normalize(ans) === normalizedStudent);
        earnedPoints = isCorrect ? questionMaxPoints : 0;
      } else {
        // Tự luận / khác: mặc định chờ chấm tay
        maxScore += questionMaxPoints;
        earnedPoints = 0;
      }

      totalScore += earnedPoints;

      gradedAnswers.push({
        questionKey: q.id,
        response: studentResponse ? JSON.parse(JSON.stringify(studentResponse)) : null,
        isCorrect,
        earned: earnedPoints,
      });
    }

    // Làm tròn 2 chữ số thập phân
    totalScore = Math.round(totalScore * 100) / 100;
    maxScore = Math.round(maxScore * 100) / 100;

    // Cập nhật Attempt và lưu chi tiết AttemptAnswer trong transaction
    await prisma.$transaction(async (tx) => {
      await tx.attempt.update({
        where: { id },
        data: {
          status: AttemptStatus.SUBMITTED,
          score: totalScore,
          maxScore,
          submittedAt: new Date(),
        },
      });

      for (const ga of gradedAnswers) {
        await tx.attemptAnswer.upsert({
          where: {
            attemptId_questionKey: {
              attemptId: id,
              questionKey: ga.questionKey,
            },
          },
          create: {
            attemptId: id,
            questionKey: ga.questionKey,
            response: ga.response,
            isCorrect: ga.isCorrect,
            earned: ga.earned,
          },
          update: {
            response: ga.response,
            isCorrect: ga.isCorrect,
            earned: ga.earned,
          },
        });
      }
    });

    // Tính toán dữ liệu trả về theo chính sách hiển thị của bài giao
    const showResult = attempt.assignment.showResult === RevealPolicy.IMMEDIATE;
    const showSolution = attempt.assignment.showSolution === RevealPolicy.IMMEDIATE;

    // Tính Bảng Xếp Hạng Top & Me nếu được bật
    let leaderboardData: any = null;
    if (attempt.assignment.leaderboard === LeaderboardMode.TOP_AND_ME) {
      const topN = attempt.assignment.leaderboardTopN || 3;

      // Lấy danh sách điểm cao nhất của từng học sinh trong bài giao này
      const allSubmittedAttempts = await prisma.attempt.findMany({
        where: {
          assignmentId: attempt.assignmentId,
          status: AttemptStatus.SUBMITTED,
          score: { not: null },
        },
        include: {
          student: { select: { id: true, displayName: true } },
        },
        orderBy: { score: 'desc' },
      });

      // Nhóm theo từng học sinh để lấy điểm cao nhất
      const studentBestMap = new Map<string, { studentId: string; name: string; score: number }>();
      for (const att of allSubmittedAttempts) {
        const currentBest = studentBestMap.get(att.studentId);
        const scoreVal = Number(att.score);
        if (!currentBest || scoreVal > currentBest.score) {
          studentBestMap.set(att.studentId, {
            studentId: att.studentId,
            name: att.student.displayName,
            score: scoreVal,
          });
        }
      }

      const sortedStudents = Array.from(studentBestMap.values()).sort((a, b) => b.score - a.score);
      const myRank = sortedStudents.findIndex((s) => s.studentId === attempt.studentId) + 1;

      leaderboardData = {
        top: sortedStudents.slice(0, topN).map((s, index) => ({
          rank: index + 1,
          name: attempt.assignment.leaderboardAnonymous ? `Học sinh ${index + 1}` : s.name,
          score: s.score,
        })),
        me: {
          rank: myRank || 1,
          total: sortedStudents.length,
          score: totalScore,
        },
      };
    }

    return NextResponse.json({
      success: true,
      score: showResult ? totalScore : null,
      maxScore: showResult ? maxScore : null,
      submittedAt: new Date().toISOString(),
      studentName: attempt.student.displayName,
      leaderboard: leaderboardData,
      solutions: showSolution
        ? questions.map((q) => ({
            id: q.id,
            correct: q.payload?.correct || q.payload?.correct_answer,
            sub_questions: q.payload?.sub_questions,
            solution: q.solution,
          }))
        : null,
      message: 'Chúc mừng em đã hoàn thành bài thi thành công!',
    });
  } catch (error) {
    console.error('Lỗi POST submit attempt:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi nộp bài thi' }, { status: 500 });
  }
}
