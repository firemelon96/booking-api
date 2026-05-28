/*
  Warnings:

  - A unique constraint covering the columns `[transferId,scheduleKey,date]` on the table `TransferInventory` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `scheduleKey` to the `TransferInventory` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "TransferInventory_transferId_scheduleId_date_key";

-- AlterTable
ALTER TABLE "TransferInventory" ADD COLUMN     "scheduleKey" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "TransferInventory_transferId_scheduleKey_date_key" ON "TransferInventory"("transferId", "scheduleKey", "date");
