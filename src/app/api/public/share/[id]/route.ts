import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { fromDatabaseExam } from '@/lib/exam-document';
import { sanitizeSnapshotForStudent, solutionForQuestion } from '@/lib/public-exam';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: token } = await params;
    const link = await prisma.shareLink.findUnique({ where: { token }, include: { exam: { include: { items: { include: { question: { include: { passage: true } } }, orderBy: { position: 'asc' } } } } } });
    if (!link || link.revokedAt || (link.expiresAt && link.expiresAt <= new Date()) || link.exam.deletedAt || link.exam.items.some(item => item.question.deletedAt || !item.question.shareable || item.question.ownerId !== link.exam.ownerId)) {
      return NextResponse.json({ success: false, error: 'Liên kết không tồn tại, đã hết hạn hoặc đã được thu hồi.' }, { status: 404 });
    }
    const exam = link.exam;
    const document = fromDatabaseExam(exam);
    const raw = { ...document, id: exam.id, title: exam.title, subject: exam.subject, grade: exam.grade,
      durationMinutes: exam.durationMinutes ?? document.metadata.durationMinutes,
      sections: (document as { sections?: unknown }).sections ?? exam.sections,
    };
    const safe = sanitizeSnapshotForStudent(raw);
    const questions = safe.questions.map((q, index) => ({ ...q, type: String(q.type).toLowerCase(), difficulty: String(q.difficulty).toLowerCase(),
      ...(link.showAnswers ? { correct_answer: solutionForQuestion(raw.questions[index]).correct, sub_questions: solutionForQuestion(raw.questions[index]).sub_questions, step_by_step_solution: solutionForQuestion(raw.questions[index]).solution, matchingPairs: solutionForQuestion(raw.questions[index]).matchingPairs, correctOrder: solutionForQuestion(raw.questions[index]).correctOrder } : {}),
    }));
    const user = link.allowCopy ? await getCurrentUser() : null;
    return NextResponse.json({ success: true, exam: { ...safe, questions }, permissions: { showAnswers: link.showAnswers, allowCopy: link.allowCopy && Boolean(user && !user.mustChangePassword) } }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Load share failed', error);
    return NextResponse.json({ success: false, error: 'Chưa thể tải đề chia sẻ' }, { status: 500 });
  }
}
