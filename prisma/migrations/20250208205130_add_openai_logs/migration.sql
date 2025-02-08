-- CreateEnum
CREATE TYPE "LogType" AS ENUM ('SUBJECTS', 'STYLES', 'PROMPTS');

-- CreateTable
CREATE TABLE "OpenAILog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "LogType" NOT NULL,
    "input" TEXT NOT NULL,
    "output" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "promptTokens" INTEGER NOT NULL,
    "completionTokens" INTEGER NOT NULL,
    "totalTokens" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpenAILog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OpenAILog_userId_idx" ON "OpenAILog"("userId");

-- CreateIndex
CREATE INDEX "OpenAILog_timestamp_idx" ON "OpenAILog"("timestamp");

-- AddForeignKey
ALTER TABLE "OpenAILog" ADD CONSTRAINT "OpenAILog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
