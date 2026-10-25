-- Comments remember the exam version they were written on and can be marked resolved.
ALTER TABLE "ExamComment" ADD COLUMN IF NOT EXISTS "version" INTEGER;
ALTER TABLE "ExamComment" ADD COLUMN IF NOT EXISTS "resolvedAt" TIMESTAMP(3);
ALTER TABLE "ExamComment" ADD COLUMN IF NOT EXISTS "resolvedById" TEXT;
