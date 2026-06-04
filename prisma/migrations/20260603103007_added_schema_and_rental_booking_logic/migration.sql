/*
  Warnings:

  - You are about to drop the column `maxPassengers` on the `Transfer` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "RentalBooking" ADD COLUMN     "hasOverbooking" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Transfer" DROP COLUMN "maxPassengers";
