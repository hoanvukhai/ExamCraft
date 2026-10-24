-- Reconcile tables previously added outside migration history.
-- Existing installations already have these objects; fresh installations need them.
-- No existing rows or columns are replaced.
CREATE TABLE IF NOT EXISTS "Folder" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "color" TEXT DEFAULT '#1a73e8',
  "parentId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Folder_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "TeacherAiMemory" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "subject" TEXT NOT NULL DEFAULT 'all',
  "category" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "insight" TEXT NOT NULL,
  "sampleQuestion" JSONB,
  "sourceAction" TEXT NOT NULL DEFAULT 'AI_ANALYSIS',
  "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TeacherAiMemory_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "UserApiKey" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "label" TEXT NOT NULL DEFAULT 'Khóa chính',
  "keyEncrypted" TEXT NOT NULL,
  "keyIv" TEXT NOT NULL,
  "keyTag" TEXT NOT NULL,
  "keyMasked" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastUsedAt" TIMESTAMP(3),
  "errorCount" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "UserApiKey_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "Exam" ADD COLUMN IF NOT EXISTS "folderId" TEXT;
ALTER TABLE "Exam" ADD COLUMN IF NOT EXISTS "isStarred" BOOLEAN NOT NULL DEFAULT false;
CREATE UNIQUE INDEX IF NOT EXISTS "Folder_ownerId_parentId_name_key" ON "Folder"("ownerId", "parentId", "name");
CREATE INDEX IF NOT EXISTS "Folder_ownerId_idx" ON "Folder"("ownerId");
CREATE INDEX IF NOT EXISTS "Exam_ownerId_folderId_idx" ON "Exam"("ownerId", "folderId");
CREATE INDEX IF NOT EXISTS "TeacherAiMemory_userId_subject_idx" ON "TeacherAiMemory"("userId", "subject");
CREATE INDEX IF NOT EXISTS "TeacherAiMemory_userId_isActive_idx" ON "TeacherAiMemory"("userId", "isActive");
CREATE INDEX IF NOT EXISTS "UserApiKey_userId_idx" ON "UserApiKey"("userId");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Folder_ownerId_fkey' AND conrelid = '"Folder"'::regclass) THEN
    ALTER TABLE "Folder" ADD CONSTRAINT "Folder_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Folder_parentId_fkey' AND conrelid = '"Folder"'::regclass) THEN
    ALTER TABLE "Folder" ADD CONSTRAINT "Folder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Exam_folderId_fkey' AND conrelid = '"Exam"'::regclass) THEN
    ALTER TABLE "Exam" ADD CONSTRAINT "Exam_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TeacherAiMemory_userId_fkey' AND conrelid = '"TeacherAiMemory"'::regclass) THEN
    ALTER TABLE "TeacherAiMemory" ADD CONSTRAINT "TeacherAiMemory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UserApiKey_userId_fkey' AND conrelid = '"UserApiKey"'::regclass) THEN
    ALTER TABLE "UserApiKey" ADD CONSTRAINT "UserApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
