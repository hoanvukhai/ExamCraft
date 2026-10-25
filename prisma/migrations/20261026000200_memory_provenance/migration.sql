-- Private notes record what they were drawn from, the supporting quote and what is still uncertain.
ALTER TABLE "TeacherAiMemory" ADD COLUMN IF NOT EXISTS "evidence" TEXT;
ALTER TABLE "TeacherAiMemory" ADD COLUMN IF NOT EXISTS "uncertainty" TEXT;
ALTER TABLE "TeacherAiMemory" ADD COLUMN IF NOT EXISTS "sourceRef" JSONB;
