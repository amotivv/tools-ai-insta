-- Add isActive flag to User model
ALTER TABLE "User" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- Add index on Account scope for faster admin lookups
CREATE INDEX "Account_scope_idx" ON "Account"("scope");
