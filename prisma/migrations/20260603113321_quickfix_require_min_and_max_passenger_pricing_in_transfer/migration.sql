/*
  Warnings:

  - Made the column `minPassengers` on table `TransferPricing` required. This step will fail if there are existing NULL values in that column.
  - Made the column `maxPassengers` on table `TransferPricing` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "TransferPricing" ALTER COLUMN "minPassengers" SET NOT NULL,
ALTER COLUMN "maxPassengers" SET NOT NULL;
