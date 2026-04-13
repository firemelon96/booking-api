/*
  Warnings:

  - A unique constraint covering the columns `[tourId,date,scheduleId]` on the table `TourDailyCapacity` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "TourDailyCapacity_tourId_date_key";

-- CreateIndex
CREATE UNIQUE INDEX "TourDailyCapacity_tourId_date_scheduleId_key" ON "TourDailyCapacity"("tourId", "date", "scheduleId");
