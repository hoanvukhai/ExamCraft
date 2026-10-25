-- Each AI operation records which prompt and which knowledge data it used, next to the model and result.
ALTER TABLE "AiUsageLog" ADD COLUMN IF NOT EXISTS "promptVersion" TEXT;
ALTER TABLE "AiUsageLog" ADD COLUMN IF NOT EXISTS "dataVersion" TEXT;
