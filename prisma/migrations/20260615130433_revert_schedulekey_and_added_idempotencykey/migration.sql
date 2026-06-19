/*
  Warnings:

  - A unique constraint covering the columns `[idempotencyKey]` on the table `TourBooking` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tourId,date,scheduleKey]` on the table `TourDailyCapacity` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `idempotencyKey` to the `TourBooking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scheduleKey` to the `TourDailyCapacity` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "TourDailyCapacity_tourId_date_scheduleId_key";

-- AlterTable
ALTER TABLE "TourBooking" ADD COLUMN     "idempotencyKey" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "TourDailyCapacity" ADD COLUMN     "scheduleKey" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "TourBooking_idempotencyKey_key" ON "TourBooking"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "TourDailyCapacity_tourId_date_scheduleKey_key" ON "TourDailyCapacity"("tourId", "date", "scheduleKey");
