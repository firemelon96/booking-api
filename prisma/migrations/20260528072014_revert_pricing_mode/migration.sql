/*
  Warnings:

  - Added the required column `pricingMode` to the `Transfer` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TransferPricingMode" AS ENUM ('SHARED', 'EXCLUSIVE');

-- AlterTable
ALTER TABLE "Transfer" ADD COLUMN     "pricingMode" "TransferPricingMode" NOT NULL;
