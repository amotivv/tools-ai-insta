-- DropIndex
DROP INDEX "Account_scope_idx";

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");
