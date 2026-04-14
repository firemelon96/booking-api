/*
  Warnings:

  - Made the column `scheduleId` on table `TourDailyCapacity` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "TourDailyCapacity" DROP CONSTRAINT "TourDailyCapacity_scheduleId_fkey";

-- AlterTable
ALTER TABLE "TourDailyCapacity" ALTER COLUMN "scheduleId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "TourDailyCapacity" ADD CONSTRAINT "TourDailyCapacity_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "TourScheduleOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
