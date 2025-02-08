-- CreateTable
CREATE TABLE "UserPreferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "modelType" TEXT NOT NULL DEFAULT 'flux-schnell',
    "safetyCheckerEnabled" BOOLEAN NOT NULL DEFAULT true,
    "inferenceSteps" INTEGER NOT NULL DEFAULT 2,
    "guidanceScale" DECIMAL(3,1) NOT NULL DEFAULT 5.5,
    "aspectRatio" TEXT NOT NULL DEFAULT '1:1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserPreferences_userId_key" ON "UserPreferences"("userId");

-- AddForeignKey
ALTER TABLE "UserPreferences" ADD CONSTRAINT "UserPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
