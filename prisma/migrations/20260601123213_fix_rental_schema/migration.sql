/*
  Warnings:

  - You are about to drop the column `hasDailyPricing` on the `Rental` table. All the data in the column will be lost.
  - You are about to drop the column `hasHourlyPricing` on the `Rental` table. All the data in the column will be lost.
  - You are about to drop the column `maxGuests` on the `Rental` table. All the data in the column will be lost.
  - You are about to drop the column `pricingMode` on the `Rental` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `Rental` table. All the data in the column will be lost.
  - The primary key for the `RentalAmenity` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `rentalId` on the `RentalAmenity` table. All the data in the column will be lost.
  - You are about to drop the column `guests` on the `RentalBooking` table. All the data in the column will be lost.
  - You are about to drop the column `rentalId` on the `RentalBooking` table. All the data in the column will be lost.
  - You are about to drop the column `rentalId` on the `RentalInventory` table. All the data in the column will be lost.
  - You are about to drop the column `rentalId` on the `RentalPricing` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[rentalItemId,date]` on the table `RentalInventory` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `ownerId` to the `Rental` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rentalItemId` to the `RentalAmenity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rentalItemId` to the `RentalBooking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rentalItemId` to the `RentalInventory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rentalItemId` to the `RentalPricing` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "RentalAmenity" DROP CONSTRAINT "RentalAmenity_rentalId_fkey";

-- DropForeignKey
ALTER TABLE "RentalBooking" DROP CONSTRAINT "RentalBooking_rentalId_fkey";

-- DropForeignKey
ALTER TABLE "RentalInventory" DROP CONSTRAINT "RentalInventory_rentalId_fkey";

-- DropForeignKey
ALTER TABLE "RentalPricing" DROP CONSTRAINT "RentalPricing_rentalId_fkey";

-- DropIndex
DROP INDEX "RentalInventory_rentalId_date_key";

-- AlterTable
ALTER TABLE "Image" ADD COLUMN     "rentalId" TEXT;

-- AlterTable
ALTER TABLE "Rental" DROP COLUMN "hasDailyPricing",
DROP COLUMN "hasHourlyPricing",
DROP COLUMN "maxGuests",
DROP COLUMN "pricingMode",
DROP COLUMN "quantity",
ADD COLUMN     "ownerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "RentalAmenity" DROP CONSTRAINT "RentalAmenity_pkey",
DROP COLUMN "rentalId",
ADD COLUMN     "rentalItemId" TEXT NOT NULL,
ADD CONSTRAINT "RentalAmenity_pkey" PRIMARY KEY ("rentalItemId", "amenityId");

-- AlterTable
ALTER TABLE "RentalBooking" DROP COLUMN "guests",
DROP COLUMN "rentalId",
ADD COLUMN     "rentalItemId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "RentalInventory" DROP COLUMN "rentalId",
ADD COLUMN     "rentalItemId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "RentalPricing" DROP COLUMN "rentalId",
ADD COLUMN     "rentalItemId" TEXT NOT NULL;

-- DropEnum
DROP TYPE "RentalPricingMode";

-- CreateTable
CREATE TABLE "RentalItem" (
    "id" TEXT NOT NULL,
    "rentalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "itemCode" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentalItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RentalItem_itemCode_key" ON "RentalItem"("itemCode");

-- CreateIndex
CREATE UNIQUE INDEX "RentalInventory_rentalItemId_date_key" ON "RentalInventory"("rentalItemId", "date");

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "Rental"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rental" ADD CONSTRAINT "Rental_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalItem" ADD CONSTRAINT "RentalItem_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "Rental"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalInventory" ADD CONSTRAINT "RentalInventory_rentalItemId_fkey" FOREIGN KEY ("rentalItemId") REFERENCES "RentalItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalPricing" ADD CONSTRAINT "RentalPricing_rentalItemId_fkey" FOREIGN KEY ("rentalItemId") REFERENCES "RentalItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalBooking" ADD CONSTRAINT "RentalBooking_rentalItemId_fkey" FOREIGN KEY ("rentalItemId") REFERENCES "RentalItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalAmenity" ADD CONSTRAINT "RentalAmenity_rentalItemId_fkey" FOREIGN KEY ("rentalItemId") REFERENCES "RentalItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
