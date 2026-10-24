-- CreateEnum
CREATE TYPE "FunderKind" AS ENUM ('fondation', 'agence_publique', 'organisation_internationale', 'ambassade', 'entreprise', 'ong_internationale', 'reseau', 'philanthrope');

-- CreateEnum
CREATE TYPE "FunderStatus" AS ENUM ('a_contacter', 'contacte', 'en_discussion', 'refuse', 'finance');

-- CreateTable
CREATE TABLE "Funder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "FunderKind" NOT NULL,
    "country" TEXT NOT NULL,
    "scope" TEXT,
    "focus" TEXT NOT NULL,
    "relevance" INTEGER NOT NULL DEFAULT 2,
    "why" TEXT,
    "howToApply" TEXT,
    "website" TEXT,
    "applyUrl" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "contactFormUrl" TEXT,
    "linkedinUrl" TEXT,
    "sourceUrl" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "status" "FunderStatus" NOT NULL DEFAULT 'a_contacter',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Funder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Funder_status_idx" ON "Funder"("status");

-- CreateIndex
CREATE INDEX "Funder_kind_idx" ON "Funder"("kind");

