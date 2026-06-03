/*
  Warnings:

  - The primary key for the `RentalAmenity` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `rentalItemId` on the `RentalAmenity` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[rentalImageId]` on the table `RentalItem` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `rentalId` to the `RentalAmenity` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "RentalAmenity" DROP CONSTRAINT "RentalAmenity_rentalItemId_fkey";

-- AlterTable
ALTER TABLE "RentalAmenity" DROP CONSTRAINT "RentalAmenity_pkey",
DROP COLUMN "rentalItemId",
ADD COLUMN     "rentalId" TEXT NOT NULL,
ADD CONSTRAINT "RentalAmenity_pkey" PRIMARY KEY ("rentalId", "amenityId");

-- AlterTable
ALTER TABLE "RentalItem" ADD COLUMN     "rentalImageId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "RentalItem_rentalImageId_key" ON "RentalItem"("rentalImageId");

-- AddForeignKey
ALTER TABLE "RentalItem" ADD CONSTRAINT "RentalItem_rentalImageId_fkey" FOREIGN KEY ("rentalImageId") REFERENCES "Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalAmenity" ADD CONSTRAINT "RentalAmenity_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "Rental"("id") ON DELETE CASCADE ON UPDATE CASCADE;
