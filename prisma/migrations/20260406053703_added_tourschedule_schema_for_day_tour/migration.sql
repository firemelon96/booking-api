/*
  Warnings:

  - The values [joiner,private] on the enum `PricingType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `isGroupPrice` on the `TourPricing` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `Tour` table without a default value. This is not possible if the table is not empty.
  - Added the required column `location` to the `Tour` table without a default value. This is not possible if the table is not empty.
  - Added the required column `types` to the `Tour` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Tour` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TourType" AS ENUM ('DAY', 'PACKAGE');

-- CreateEnum
CREATE TYPE "TourSchedule" AS ENUM ('MORNING', 'AFTERNOON', 'EVENING', 'WHOLE_DAY');

-- AlterEnum
BEGIN;
CREATE TYPE "PricingType_new" AS ENUM ('JOINER', 'PRIVATE');
ALTER TABLE "TourPricing" ALTER COLUMN "pricingType" TYPE "PricingType_new" USING ("pricingType"::text::"PricingType_new");
ALTER TABLE "Booking" ALTER COLUMN "pricingType" TYPE "PricingType_new" USING ("pricingType"::text::"PricingType_new");
ALTER TYPE "PricingType" RENAME TO "PricingType_old";
ALTER TYPE "PricingType_new" RENAME TO "PricingType";
DROP TYPE "public"."PricingType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "scheduleId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Tour" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "durationDays" INTEGER,
ADD COLUMN     "exclusions" TEXT[],
ADD COLUMN     "highlights" TEXT[],
ADD COLUMN     "inclusions" TEXT[],
ADD COLUMN     "location" TEXT NOT NULL,
ADD COLUMN     "types" "TourType" NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "TourPricing" DROP COLUMN "isGroupPrice",
ALTER COLUMN "price" SET DATA TYPE DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "TourScheduleOption" (
    "id" TEXT NOT NULL,
    "schedule" "TourSchedule" NOT NULL,
    "tourId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TourScheduleOption_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TourScheduleOption" ADD CONSTRAINT "TourScheduleOption_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "TourScheduleOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;
