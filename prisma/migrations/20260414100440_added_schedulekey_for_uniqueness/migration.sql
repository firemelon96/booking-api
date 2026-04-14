/*
  Warnings:

  - A unique constraint covering the columns `[tourId,date,scheduleKey]` on the table `TourDailyCapacity` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `scheduleKey` to the `TourDailyCapacity` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "TourDailyCapacity" DROP CONSTRAINT "TourDailyCapacity_scheduleId_fkey";

-- DropIndex
DROP INDEX "TourDailyCapacity_tourId_date_scheduleId_key";

-- AlterTable
ALTER TABLE "TourDailyCapacity" ADD COLUMN     "scheduleKey" TEXT NOT NULL,
ALTER COLUMN "scheduleId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "TourDailyCapacity_tourId_date_scheduleKey_key" ON "TourDailyCapacity"("tourId", "date", "scheduleKey");

-- AddForeignKey
ALTER TABLE "TourDailyCapacity" ADD CONSTRAINT "TourDailyCapacity_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "TourScheduleOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;
