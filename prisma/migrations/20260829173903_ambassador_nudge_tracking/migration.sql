-- AlterTable
ALTER TABLE "Ambassador" ADD COLUMN     "lastNudgeSentAt" TIMESTAMP(3),
ADD COLUMN     "highestMilestoneCelebrated" INTEGER NOT NULL DEFAULT 0;
