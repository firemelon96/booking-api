/*
  Warnings:

  - You are about to drop the column `exclusions` on the `Tour` table. All the data in the column will be lost.
  - You are about to drop the column `inclusions` on the `Tour` table. All the data in the column will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ImageType" ADD VALUE 'TRANSFER';
ALTER TYPE "ImageType" ADD VALUE 'ACCOMMODATION';
ALTER TYPE "ImageType" ADD VALUE 'RENTALS';

-- AlterTable
ALTER TABLE "Image" ADD COLUMN     "transferId" TEXT;

-- AlterTable
ALTER TABLE "Tour" DROP COLUMN "exclusions",
DROP COLUMN "inclusions";

-- CreateTable
CREATE TABLE "TourInclusion" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "tourId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TourInclusion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TourExclusion" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "tourId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TourExclusion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransferAmenity" (
    "transferId" TEXT NOT NULL,
    "amenityId" TEXT NOT NULL,

    CONSTRAINT "TransferAmenity_pkey" PRIMARY KEY ("transferId","amenityId")
);

-- CreateIndex
CREATE INDEX "TourInclusion_tourId_idx" ON "TourInclusion"("tourId");

-- CreateIndex
CREATE INDEX "TourExclusion_tourId_idx" ON "TourExclusion"("tourId");

-- AddForeignKey
ALTER TABLE "TourInclusion" ADD CONSTRAINT "TourInclusion_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourExclusion" ADD CONSTRAINT "TourExclusion_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "Transfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferAmenity" ADD CONSTRAINT "TransferAmenity_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "Transfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferAmenity" ADD CONSTRAINT "TransferAmenity_amenityId_fkey" FOREIGN KEY ("amenityId") REFERENCES "Amenity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
