-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('admin', 'scanner');

-- CreateEnum
CREATE TYPE "RegistrationSource" AS ENUM ('form', 'qr_walkin', 'admin_manual');

-- CreateEnum
CREATE TYPE "MessageChannel" AS ENUM ('email', 'sms', 'whatsapp');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('queued', 'sent', 'failed');

-- CreateTable
CREATE TABLE "Edition" (
    "id" SERIAL NOT NULL,
    "number" INTEGER NOT NULL,
    "theme" TEXT NOT NULL,
    "dates" TEXT NOT NULL,
    "venue" TEXT NOT NULL,
    "hasParticipantData" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Edition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ambassador" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "whatsappNumber" TEXT,
    "email" TEXT,
    "photoUrl" TEXT,
    "bio" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ambassador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL,
    "editionId" INTEGER NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "consent" BOOLEAN NOT NULL DEFAULT false,
    "attendanceToken" TEXT NOT NULL,
    "registrationSource" "RegistrationSource" NOT NULL,
    "ambassadorId" TEXT,
    "attendedAt" TIMESTAMP(3),
    "checkedInByAdminId" TEXT,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminProfile" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'scanner',
    "testBypass" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessagingLog" (
    "id" TEXT NOT NULL,
    "channel" "MessageChannel" NOT NULL,
    "recipientPhone" TEXT,
    "recipientEmail" TEXT,
    "participantId" TEXT,
    "subject" TEXT,
    "status" "MessageStatus" NOT NULL DEFAULT 'queued',
    "providerMessageId" TEXT,
    "errorMessage" TEXT,
    "batchId" TEXT,
    "batchLabel" TEXT,
    "sentByAdminId" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessagingLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Edition_number_key" ON "Edition"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Ambassador_slug_key" ON "Ambassador"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Participant_attendanceToken_key" ON "Participant"("attendanceToken");

-- CreateIndex
CREATE INDEX "Participant_editionId_idx" ON "Participant"("editionId");

-- CreateIndex
CREATE INDEX "Participant_ambassadorId_idx" ON "Participant"("ambassadorId");

-- CreateIndex
CREATE INDEX "MessagingLog_participantId_idx" ON "MessagingLog"("participantId");

-- CreateIndex
CREATE INDEX "MessagingLog_batchId_idx" ON "MessagingLog"("batchId");

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "Edition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_ambassadorId_fkey" FOREIGN KEY ("ambassadorId") REFERENCES "Ambassador"("id") ON DELETE SET NULL ON UPDATE CASCADE;
