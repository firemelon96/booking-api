/*
  Warnings:

  - You are about to drop the column `pricingMode` on the `Transfer` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Transfer" DROP COLUMN "pricingMode";

-- DropEnum
DROP TYPE "TransferPricingMode";
