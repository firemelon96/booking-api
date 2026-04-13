/*
  Warnings:

  - You are about to drop the column `schedule` on the `TourScheduleOption` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Booking_tourId_pricingType_startDate_idx";

-- DropIndex
DROP INDEX "Booking_tourId_startDate_idx";

-- DropIndex
DROP INDEX "Booking_userId_createdAt_idx";

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "expiresAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "TourScheduleOption" DROP COLUMN "schedule";

-- CreateIndex
CREATE INDEX "Booking_tourId_startDate_endDate_idx" ON "Booking"("tourId", "startDate", "endDate");
