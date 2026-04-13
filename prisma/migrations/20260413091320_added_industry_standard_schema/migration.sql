/*
  Warnings:

  - You are about to drop the column `types` on the `Tour` table. All the data in the column will be lost.
  - You are about to drop the column `isGroupPrice` on the `TourPricing` table. All the data in the column will be lost.
  - Added the required column `createdAt` to the `TourPricing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pricingModel` to the `TourPricing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `label` to the `TourScheduleOption` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CapacityMode" AS ENUM ('EXCLUSIVE', 'SHARED');

-- CreateEnum
CREATE TYPE "PricingModel" AS ENUM ('PER_PERSON', 'PER_GROUP');

-- AlterTable
ALTER TABLE "Tour" DROP COLUMN "types",
ADD COLUMN     "capacityMode" "CapacityMode" NOT NULL DEFAULT 'SHARED',
ADD COLUMN     "type" "TourType" NOT NULL DEFAULT 'DAY';

-- AlterTable
ALTER TABLE "TourPricing" DROP COLUMN "isGroupPrice",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "pricingModel" "PricingModel" NOT NULL,
ALTER COLUMN "minGroupSize" DROP NOT NULL,
ALTER COLUMN "maxGroupSize" DROP NOT NULL;

-- AlterTable
ALTER TABLE "TourScheduleOption" ADD COLUMN     "capacity" INTEGER,
ADD COLUMN     "endTime" TEXT,
ADD COLUMN     "label" TEXT NOT NULL,
ADD COLUMN     "startTIme" TEXT;

-- AddForeignKey
ALTER TABLE "TourDailyCapacity" ADD CONSTRAINT "TourDailyCapacity_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "TourScheduleOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;
