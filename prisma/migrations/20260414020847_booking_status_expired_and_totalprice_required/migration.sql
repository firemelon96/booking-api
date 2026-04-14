/*
  Warnings:

  - Made the column `totalPrice` on table `Booking` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
ALTER TYPE "BookingStatus" ADD VALUE 'EXPIRED';

-- AlterTable
ALTER TABLE "Booking" ALTER COLUMN "totalPrice" SET NOT NULL;
