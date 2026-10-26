-- A key an administrator hands to chosen teachers: every recipient has their own row, tied together by a grant id.
ALTER TABLE "UserApiKey" ADD COLUMN IF NOT EXISTS "grantId" TEXT;
ALTER TABLE "UserApiKey" ADD COLUMN IF NOT EXISTS "grantedById" TEXT;
CREATE INDEX IF NOT EXISTS "UserApiKey_grantId_idx" ON "UserApiKey"("grantId");
