/*
  Warnings:

  - You are about to drop the column `rentalImageId` on the `RentalItem` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[rentalId,itemCode]` on the table `RentalItem` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "RentalItem" DROP CONSTRAINT "RentalItem_rentalImageId_fkey";

-- DropIndex
DROP INDEX "RentalItem_itemCode_key";

-- DropIndex
DROP INDEX "RentalItem_rentalImageId_key";

-- AlterTable
ALTER TABLE "RentalItem" DROP COLUMN "rentalImageId";

-- CreateTable
CREATE TABLE "RentalItemImage" (
    "id" TEXT NOT NULL,
    "rentalItemId" TEXT NOT NULL,
    "imageId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RentalItemImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RentalItemImage_rentalItemId_idx" ON "RentalItemImage"("rentalItemId");

-- CreateIndex
CREATE INDEX "RentalItemImage_imageId_idx" ON "RentalItemImage"("imageId");

-- CreateIndex
CREATE INDEX "RentalItem_rentalId_idx" ON "RentalItem"("rentalId");

-- CreateIndex
CREATE UNIQUE INDEX "RentalItem_rentalId_itemCode_key" ON "RentalItem"("rentalId", "itemCode");

-- AddForeignKey
ALTER TABLE "RentalItemImage" ADD CONSTRAINT "RentalItemImage_rentalItemId_fkey" FOREIGN KEY ("rentalItemId") REFERENCES "RentalItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalItemImage" ADD CONSTRAINT "RentalItemImage_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
