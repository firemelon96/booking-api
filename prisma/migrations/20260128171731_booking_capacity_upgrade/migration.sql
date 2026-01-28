/*
  Warnings:

  - Added the required column `participants` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pricingType` to the `Booking` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "participants" INTEGER NOT NULL,
ADD COLUMN     "pricingType" "PricingType" NOT NULL;

-- AlterTable
ALTER TABLE "Tour" ADD COLUMN     "joinerCapacity" INTEGER NOT NULL DEFAULT 12;

-- CreateIndex
CREATE INDEX "Booking_tourId_pricingType_startDate_idx" ON "Booking"("tourId", "pricingType", "startDate");
