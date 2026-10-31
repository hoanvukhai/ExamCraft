-- Who has an exam open and what they are on. Rows are short-lived: a tab that stops reporting is treated as gone.
CREATE TABLE "ExamPresence" (
  "id" TEXT NOT NULL,
  "examId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "focus" TEXT,
  "editing" BOOLEAN NOT NULL DEFAULT false,
  "seenVersion" INTEGER,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExamPresence_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ExamPresence_examId_userId_key" ON "ExamPresence"("examId", "userId");
CREATE INDEX "ExamPresence_examId_lastSeenAt_idx" ON "ExamPresence"("examId", "lastSeenAt");
ALTER TABLE "ExamPresence" ADD CONSTRAINT "ExamPresence_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamPresence" ADD CONSTRAINT "ExamPresence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
