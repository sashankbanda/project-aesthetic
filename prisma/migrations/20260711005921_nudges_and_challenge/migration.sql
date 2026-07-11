-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "challenge" JSONB;

-- AlterTable
ALTER TABLE "PushSubscription" ADD COLUMN     "nudges" BOOLEAN NOT NULL DEFAULT true;
