/*
  Warnings:

  - You are about to drop the column `idempotencyKey` on the `TourBooking` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "TourBooking_idempotencyKey_key";

-- AlterTable
ALTER TABLE "TourBooking" DROP COLUMN "idempotencyKey";
