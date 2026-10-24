CREATE TYPE "ExamCollaboratorRole" AS ENUM ('VIEWER', 'COMMENTER', 'EDITOR');
CREATE TABLE "ExamCollaborator" (
  "id" TEXT NOT NULL, "examId" TEXT NOT NULL, "userId" TEXT NOT NULL,
  "role" "ExamCollaboratorRole" NOT NULL DEFAULT 'VIEWER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, "revokedAt" TIMESTAMP(3),
  CONSTRAINT "ExamCollaborator_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ExamRevision" (
  "id" TEXT NOT NULL, "examId" TEXT NOT NULL, "version" INTEGER NOT NULL,
  "actorId" TEXT, "snapshot" JSONB NOT NULL, "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExamRevision_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ExamComment" (
  "id" TEXT NOT NULL, "examId" TEXT NOT NULL, "authorId" TEXT,
  "body" TEXT NOT NULL, "questionId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExamComment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ExamCollaborator_examId_userId_key" ON "ExamCollaborator"("examId", "userId");
CREATE INDEX "ExamCollaborator_userId_revokedAt_idx" ON "ExamCollaborator"("userId", "revokedAt");
CREATE UNIQUE INDEX "ExamRevision_examId_version_key" ON "ExamRevision"("examId", "version");
CREATE INDEX "ExamComment_examId_createdAt_idx" ON "ExamComment"("examId", "createdAt");
ALTER TABLE "ExamCollaborator" ADD CONSTRAINT "ExamCollaborator_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamCollaborator" ADD CONSTRAINT "ExamCollaborator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamRevision" ADD CONSTRAINT "ExamRevision_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamRevision" ADD CONSTRAINT "ExamRevision_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExamComment" ADD CONSTRAINT "ExamComment_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamComment" ADD CONSTRAINT "ExamComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
