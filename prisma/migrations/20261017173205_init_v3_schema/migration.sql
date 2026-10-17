-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'TEACHER');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MULTIPLE_CHOICE', 'TRUE_FALSE_GROUP', 'SHORT_ANSWER', 'ESSAY', 'FILL_BLANK', 'MATCHING', 'ORDERING');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('NHAN_BIET', 'THONG_HIEU', 'VAN_DUNG', 'VAN_DUNG_CAO');

-- CreateEnum
CREATE TYPE "QuestionStatus" AS ENUM ('DRAFT', 'VERIFIED');

-- CreateEnum
CREATE TYPE "VerifiedBy" AS ENUM ('NONE', 'HUMAN', 'AI_CONSENSUS', 'MATH_ENGINE');

-- CreateEnum
CREATE TYPE "AssignmentMode" AS ENUM ('HOMEWORK', 'CLASSWORK', 'EXAM');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "IdentityMode" AS ENUM ('PICK_FROM_LIST', 'FREE_NAME', 'PERSONAL_LINK');

-- CreateEnum
CREATE TYPE "RevealPolicy" AS ENUM ('IMMEDIATE', 'AFTER_CLOSE', 'NEVER');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AiKeyStatus" AS ENUM ('ACTIVE', 'COOLDOWN', 'DEAD');

-- CreateEnum
CREATE TYPE "LeaderboardMode" AS ENUM ('OFF', 'TOP_AND_ME');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PRIVATE', 'SHARED');

-- CreateEnum
CREATE TYPE "SourceKind" AS ENUM ('AI_GENERATED', 'TEACHER_WRITTEN', 'IMPORTED_FILE', 'IMPORTED_WEB', 'LICENSED_DATASET', 'FORKED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'TEACHER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "aiDailyLimit" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Passage" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "source" TEXT,
    "figures" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Passage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "originId" TEXT,
    "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
    "sourceKind" "SourceKind" NOT NULL DEFAULT 'TEACHER_WRITTEN',
    "sourceUrl" TEXT,
    "shareable" BOOLEAN NOT NULL DEFAULT true,
    "subject" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
    "type" "QuestionType" NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "topics" TEXT[],
    "tags" TEXT[],
    "passageId" TEXT,
    "content" TEXT NOT NULL,
    "figures" JSONB,
    "payload" JSONB NOT NULL,
    "solution" TEXT NOT NULL,
    "points" DECIMAL(5,2),
    "status" "QuestionStatus" NOT NULL DEFAULT 'DRAFT',
    "verifiedBy" "VerifiedBy" NOT NULL DEFAULT 'NONE',
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT,
    "licenseNote" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionRevision" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamTemplate" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "gradeFrom" INTEGER NOT NULL,
    "gradeTo" INTEGER NOT NULL,
    "sections" JSONB NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exam" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "templateId" TEXT,
    "title" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
    "durationMinutes" INTEGER,
    "metadata" JSONB NOT NULL,
    "sections" JSONB NOT NULL,
    "variantCount" INTEGER NOT NULL DEFAULT 1,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamQuestion" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "pointsOverride" DECIMAL(5,2),

    CONSTRAINT "ExamQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShareLink" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "showAnswers" BOOLEAN NOT NULL DEFAULT false,
    "allowCopy" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShareLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "note" TEXT,
    "publicCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "personalToken" TEXT,
    "pinHash" TEXT,
    "isGuest" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "groupId" TEXT,
    "title" TEXT NOT NULL,
    "mode" "AssignmentMode" NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'DRAFT',
    "identityMode" "IdentityMode" NOT NULL DEFAULT 'PICK_FROM_LIST',
    "publicId" TEXT NOT NULL,
    "joinCode" TEXT,
    "snapshot" JSONB NOT NULL,
    "opensAt" TIMESTAMP(3),
    "closesAt" TIMESTAMP(3),
    "durationMinutes" INTEGER,
    "maxAttempts" INTEGER NOT NULL DEFAULT 1,
    "shuffleQuestions" BOOLEAN NOT NULL DEFAULT false,
    "shuffleChoices" BOOLEAN NOT NULL DEFAULT false,
    "showResult" "RevealPolicy" NOT NULL DEFAULT 'IMMEDIATE',
    "showSolution" "RevealPolicy" NOT NULL DEFAULT 'AFTER_CLOSE',
    "requirePin" BOOLEAN NOT NULL DEFAULT false,
    "leaderboard" "LeaderboardMode" NOT NULL DEFAULT 'OFF',
    "leaderboardTopN" INTEGER NOT NULL DEFAULT 3,
    "leaderboardReveal" "RevealPolicy" NOT NULL DEFAULT 'IMMEDIATE',
    "leaderboardAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attempt" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "attemptNo" INTEGER NOT NULL,
    "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deadlineAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "variantSeed" INTEGER NOT NULL,
    "layout" JSONB NOT NULL,
    "draft" JSONB,
    "score" DECIMAL(6,2),
    "maxScore" DECIMAL(6,2),
    "needsGrading" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttemptAnswer" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionKey" TEXT NOT NULL,
    "response" JSONB NOT NULL,
    "isCorrect" BOOLEAN,
    "earned" DECIMAL(5,2),
    "manualScore" DECIMAL(5,2),
    "comment" TEXT,

    CONSTRAINT "AttemptAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiKeyState" (
    "alias" TEXT NOT NULL,
    "status" "AiKeyStatus" NOT NULL DEFAULT 'ACTIVE',
    "cooldownUntil" TIMESTAMP(3),
    "dailyCount" INTEGER NOT NULL DEFAULT 0,
    "dailyResetAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "lastError" TEXT,

    CONSTRAINT "AiKeyState_pkey" PRIMARY KEY ("alias")
);

-- CreateTable
CREATE TABLE "AiUsageLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "keyAlias" TEXT,
    "endpoint" TEXT NOT NULL,
    "model" TEXT,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "httpStatus" INTEGER,
    "latencyMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiUsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "meta" JSONB,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_token_idx" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Passage_ownerId_idx" ON "Passage"("ownerId");

-- CreateIndex
CREATE INDEX "Question_ownerId_subject_grade_idx" ON "Question"("ownerId", "subject", "grade");

-- CreateIndex
CREATE INDEX "Question_ownerId_type_difficulty_idx" ON "Question"("ownerId", "type", "difficulty");

-- CreateIndex
CREATE INDEX "Question_visibility_subject_grade_idx" ON "Question"("visibility", "subject", "grade");

-- CreateIndex
CREATE INDEX "Question_authorId_idx" ON "Question"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionRevision_questionId_version_key" ON "QuestionRevision"("questionId", "version");

-- CreateIndex
CREATE INDEX "Exam_ownerId_updatedAt_idx" ON "Exam"("ownerId", "updatedAt");

-- CreateIndex
CREATE INDEX "ExamQuestion_questionId_idx" ON "ExamQuestion"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamQuestion_examId_position_key" ON "ExamQuestion"("examId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "ShareLink_token_key" ON "ShareLink"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Group_publicCode_key" ON "Group"("publicCode");

-- CreateIndex
CREATE UNIQUE INDEX "Group_ownerId_name_key" ON "Group"("ownerId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Student_personalToken_key" ON "Student"("personalToken");

-- CreateIndex
CREATE UNIQUE INDEX "Student_groupId_displayName_key" ON "Student"("groupId", "displayName");

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_publicId_key" ON "Assignment"("publicId");

-- CreateIndex
CREATE INDEX "Assignment_ownerId_status_idx" ON "Assignment"("ownerId", "status");

-- CreateIndex
CREATE INDEX "Assignment_groupId_idx" ON "Assignment"("groupId");

-- CreateIndex
CREATE INDEX "Attempt_assignmentId_status_idx" ON "Attempt"("assignmentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Attempt_assignmentId_studentId_attemptNo_key" ON "Attempt"("assignmentId", "studentId", "attemptNo");

-- CreateIndex
CREATE UNIQUE INDEX "AttemptAnswer_attemptId_questionKey_key" ON "AttemptAnswer"("attemptId", "questionKey");

-- CreateIndex
CREATE INDEX "AiUsageLog_userId_createdAt_idx" ON "AiUsageLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Passage" ADD CONSTRAINT "Passage_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_originId_fkey" FOREIGN KEY ("originId") REFERENCES "Question"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_passageId_fkey" FOREIGN KEY ("passageId") REFERENCES "Passage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionRevision" ADD CONSTRAINT "QuestionRevision_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamTemplate" ADD CONSTRAINT "ExamTemplate_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ExamTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamQuestion" ADD CONSTRAINT "ExamQuestion_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamQuestion" ADD CONSTRAINT "ExamQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareLink" ADD CONSTRAINT "ShareLink_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttemptAnswer" ADD CONSTRAINT "AttemptAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiUsageLog" ADD CONSTRAINT "AiUsageLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
