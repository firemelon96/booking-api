/*
  Warnings:

  - You are about to drop the column `booked` on the `TourDailyCapacity` table. All the data in the column will be lost.
  - You are about to drop the column `capacity` on the `TourDailyCapacity` table. All the data in the column will be lost.
  - You are about to drop the column `scheduleKey` on the `TourDailyCapacity` table. All the data in the column will be lost.
  - You are about to drop the column `capacity` on the `TourScheduleOption` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tourId,date,scheduleId]` on the table `TourDailyCapacity` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `availableSlots` to the `TourDailyCapacity` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "TourDailyCapacity_tourId_date_scheduleKey_key";

-- AlterTable
ALTER TABLE "ServiceLike" ADD COLUMN     "rentalItemId" TEXT;

-- AlterTable
ALTER TABLE "Tour" ADD COLUMN     "hasSchedule" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "TourDailyCapacity" DROP COLUMN "booked",
DROP COLUMN "capacity",
DROP COLUMN "scheduleKey",
ADD COLUMN     "availableSlots" INTEGER NOT NULL,
ADD COLUMN     "bookedSlots" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "TourScheduleOption" DROP COLUMN "capacity",
ADD COLUMN     "maxParticipants" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "TourDailyCapacity_tourId_date_scheduleId_key" ON "TourDailyCapacity"("tourId", "date", "scheduleId");

-- AddForeignKey
ALTER TABLE "ServiceLike" ADD CONSTRAINT "ServiceLike_rentalItemId_fkey" FOREIGN KEY ("rentalItemId") REFERENCES "RentalItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
