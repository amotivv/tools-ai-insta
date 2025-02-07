-- CreateTable
CREATE TABLE "SharedFeed" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "images" TEXT[],
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SharedFeed_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SharedFeed_userId_idx" ON "SharedFeed"("userId");

-- AddForeignKey
ALTER TABLE "SharedFeed" ADD CONSTRAINT "SharedFeed_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
