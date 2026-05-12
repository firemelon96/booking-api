/*
  Warnings:

  - A unique constraint covering the columns `[accommodationId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `accommodationId` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BookingType" AS ENUM ('TOUR', 'ACCOMMODATION');

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "accommodationId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_accommodationId_key" ON "Payment"("accommodationId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_accommodationId_fkey" FOREIGN KEY ("accommodationId") REFERENCES "AccommodationBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
