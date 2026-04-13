/*
  Warnings:

  - Made the column `minGroupSize` on table `TourPricing` required. This step will fail if there are existing NULL values in that column.
  - Made the column `maxGroupSize` on table `TourPricing` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "TourPricing" ALTER COLUMN "minGroupSize" SET NOT NULL,
ALTER COLUMN "maxGroupSize" SET NOT NULL;
