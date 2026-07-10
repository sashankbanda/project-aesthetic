-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "training" JSONB;

-- AlterTable
ALTER TABLE "PushSubscription" ADD COLUMN     "reminderHour" INTEGER NOT NULL DEFAULT 18;

-- CreateTable
CREATE TABLE "ActivityEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "localId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "seconds" INTEGER NOT NULL,
    "at" TEXT NOT NULL,

    CONSTRAINT "ActivityEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActivityEntry_userId_date_idx" ON "ActivityEntry"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityEntry_userId_localId_key" ON "ActivityEntry"("userId", "localId");

-- AddForeignKey
ALTER TABLE "ActivityEntry" ADD CONSTRAINT "ActivityEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
