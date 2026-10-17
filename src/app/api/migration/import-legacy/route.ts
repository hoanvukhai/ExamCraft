import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { QuestionType, Difficulty, Visibility, SourceKind } from '@prisma/client';

const LegacyImportSchema = z.object({
  exams: z.array(z.any()).default([]),
  questions: z.array(z.any()).default([]),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const parsed = LegacyImportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Định dạng dữ liệu sao lưu cũ không hợp lệ' },
        { status: 400 }
      );
    }

    const { exams, questions } = parsed.data;
    let importedExamsCount = 0;
    let importedQuestionsCount = 0;

    // 1. Nhập danh sách câu hỏi độc lập (nếu có)
    for (const q of questions) {
      if (!q.content) continue;

      const qType = Object.values(QuestionType).includes(q.type?.toUpperCase())
        ? (q.type.toUpperCase() as QuestionType)
        : QuestionType.MULTIPLE_CHOICE;

      const qDiff = Object.values(Difficulty).includes(q.difficulty?.toUpperCase())
        ? (q.difficulty.toUpperCase() as Difficulty)
        : Difficulty.THONG_HIEU;

      await prisma.$transaction(async (tx) => {
        const createdQ = await tx.question.create({
          data: {
            ownerId: user.id,
            authorId: user.id,
            subject: q.subject || 'toan',
            grade: typeof q.grade === 'number' ? q.grade : 12,
            type: qType,
            difficulty: qDiff,
            content: q.content,
            figures: q.figures ? JSON.parse(JSON.stringify(q.figures)) : undefined,
            payload: {
              choices: q.choices,
              sub_questions: q.sub_questions,
              correct: q.correct_answer || q.correctAnswer,
            },
            solution: q.step_by_step_solution || q.solution || '',
            topics: Array.isArray(q.topics) ? q.topics : [],
            tags: Array.isArray(q.tags) ? q.tags : [],
            visibility: Visibility.PRIVATE,
            sourceKind: SourceKind.IMPORTED_FILE,
            source: 'Nhập từ bản cũ IndexedDB',
            version: 1,
          },
        });

        await tx.questionRevision.create({
          data: {
            questionId: createdQ.id,
            version: 1,
            snapshot: JSON.parse(JSON.stringify(createdQ)),
            note: 'Khởi tạo từ bản nhập cũ (IndexedDB Migration)',
          },
        });
      });

      importedQuestionsCount++;
    }

    // 2. Nhập danh sách đề thi kèm câu hỏi bên trong
    for (const ex of exams) {
      if (!ex.title && !ex.metadata?.title) continue;

      const title = ex.title || ex.metadata?.title || 'Đề thi nhập từ bản cũ';
      const subject = ex.subject || ex.metadata?.subject || 'toan';
      const grade = ex.grade || ex.metadata?.grade || 12;
      const duration = ex.durationMinutes || ex.metadata?.durationMinutes || 90;
      const sections = ex.sections || [
        {
          id: 'part_1',
          name: 'Phần thi',
          type: 'MULTIPLE_CHOICE',
          questionCount: Array.isArray(ex.questions) ? ex.questions.length : 0,
          totalPoints: 10.0,
        },
      ];

      await prisma.$transaction(async (tx) => {
        const createdExam = await tx.exam.create({
          data: {
            ownerId: user.id,
            title,
            subject,
            grade,
            durationMinutes: duration,
            metadata: ex.metadata || {},
            sections,
            variantCount: ex.variantCount || 1,
          },
        });

        if (Array.isArray(ex.questions)) {
          let pos = 1;
          for (const q of ex.questions) {
            if (!q.content) continue;

            const qType = Object.values(QuestionType).includes(q.type?.toUpperCase())
              ? (q.type.toUpperCase() as QuestionType)
              : QuestionType.MULTIPLE_CHOICE;

            const qDiff = Object.values(Difficulty).includes(q.difficulty?.toUpperCase())
              ? (q.difficulty.toUpperCase() as Difficulty)
              : Difficulty.THONG_HIEU;

            const createdQ = await tx.question.create({
              data: {
                ownerId: user.id,
                authorId: user.id,
                subject,
                grade,
                type: qType,
                difficulty: qDiff,
                content: q.content,
                figures: q.figures ? JSON.parse(JSON.stringify(q.figures)) : undefined,
                payload: {
                  choices: q.choices,
                  sub_questions: q.sub_questions,
                  correct: q.correct_answer || q.correctAnswer,
                },
                solution: q.step_by_step_solution || q.solution || '',
                topics: Array.isArray(q.topics) ? q.topics : [],
                tags: Array.isArray(q.tags) ? q.tags : [],
                visibility: Visibility.PRIVATE,
                sourceKind: SourceKind.IMPORTED_FILE,
                source: `Đề thi: ${title}`,
                version: 1,
              },
            });

            await tx.questionRevision.create({
              data: {
                questionId: createdQ.id,
                version: 1,
                snapshot: JSON.parse(JSON.stringify(createdQ)),
                note: `Nhập cùng đề thi "${title}" từ IndexedDB`,
              },
            });

            await tx.examQuestion.create({
              data: {
                examId: createdExam.id,
                questionId: createdQ.id,
                sectionId: q.sectionId || 'part_1',
                position: pos++,
              },
            });

            importedQuestionsCount++;
          }
        }

        importedExamsCount++;
      });
    }

    return NextResponse.json({
      success: true,
      importedExamsCount,
      importedQuestionsCount,
      message: `Đã nhập thành công ${importedExamsCount} đề thi và ${importedQuestionsCount} câu hỏi vào tài khoản của bạn!`,
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }
    console.error('Lỗi POST /api/migration/import-legacy:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi nhập dữ liệu cũ' }, { status: 500 });
  }
}
