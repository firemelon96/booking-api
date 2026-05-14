/*
  Warnings:

  - You are about to drop the column `adults` on the `AccommodationBooking` table. All the data in the column will be lost.
  - You are about to drop the column `bookingStatus` on the `AccommodationBooking` table. All the data in the column will be lost.
  - You are about to drop the column `children` on the `AccommodationBooking` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `AccommodationBooking` table. All the data in the column will be lost.
  - You are about to drop the column `paymentStatus` on the `AccommodationBooking` table. All the data in the column will be lost.
  - You are about to drop the column `totalPrice` on the `AccommodationBooking` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `AccommodationBooking` table. All the data in the column will be lost.
  - You are about to drop the column `canceledAt` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `endDate` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `isOverbooked` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `participants` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `pricingType` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `scheduleId` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `tourId` on the `Booking` table. All the data in the column will be lost.
  - You are about to alter the column `totalPrice` on the `Booking` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.
  - You are about to alter the column `refundAmount` on the `Booking` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.
  - A unique constraint covering the columns `[bookingId]` on the table `AccommodationBooking` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[reference]` on the table `Booking` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `bookingId` to the `AccommodationBooking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `guests` to the `AccommodationBooking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reference` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Made the column `totalPrice` on table `Booking` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `ownerId` to the `Tour` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "AccommodationBooking" DROP CONSTRAINT "AccommodationBooking_userId_fkey";

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_scheduleId_fkey";

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_tourId_fkey";

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_userId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_accommodationId_fkey";

-- DropIndex
DROP INDEX "Booking_tourId_startDate_endDate_idx";

-- AlterTable
ALTER TABLE "AccommodationBooking" DROP COLUMN "adults",
DROP COLUMN "bookingStatus",
DROP COLUMN "children",
DROP COLUMN "expiresAt",
DROP COLUMN "paymentStatus",
DROP COLUMN "totalPrice",
DROP COLUMN "userId",
ADD COLUMN     "bookingId" TEXT NOT NULL,
ADD COLUMN     "guests" INTEGER NOT NULL,
ALTER COLUMN "units" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "canceledAt",
DROP COLUMN "endDate",
DROP COLUMN "isOverbooked",
DROP COLUMN "notes",
DROP COLUMN "participants",
DROP COLUMN "pricingType",
DROP COLUMN "scheduleId",
DROP COLUMN "startDate",
DROP COLUMN "status",
DROP COLUMN "tourId",
ADD COLUMN     "bookingStatus" "BookingStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "cancellationReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "reference" TEXT NOT NULL,
ADD COLUMN     "type" "BookingType" NOT NULL,
ALTER COLUMN "totalPrice" SET NOT NULL,
ALTER COLUMN "totalPrice" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "refundAmount" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "Tour" ADD COLUMN     "ownerId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "TourBooking" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,
    "pricingType" "PricingType" NOT NULL,
    "participants" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "notes" TEXT,
    "scheduleId" TEXT,
    "isOverbooked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TourBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TourBooking_bookingId_key" ON "TourBooking"("bookingId");

-- CreateIndex
CREATE INDEX "TourBooking_tourId_startDate_endDate_idx" ON "TourBooking"("tourId", "startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "AccommodationBooking_bookingId_key" ON "AccommodationBooking"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_reference_key" ON "Booking"("reference");

-- AddForeignKey
ALTER TABLE "Tour" ADD CONSTRAINT "Tour_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourBooking" ADD CONSTRAINT "TourBooking_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourBooking" ADD CONSTRAINT "TourBooking_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccommodationBooking" ADD CONSTRAINT "AccommodationBooking_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
