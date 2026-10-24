-- Preserve existing user preferences; complete migration history for fresh installs.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "selectedAiModel" TEXT DEFAULT 'gemini-3.5-flash';
