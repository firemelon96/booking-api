/*
  Warnings:

  - You are about to drop the column `scheduleKey` on the `TransferInventory` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[transferId,scheduleId,date]` on the table `TransferInventory` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "TransferInventory_transferId_scheduleKey_date_key";

-- AlterTable
ALTER TABLE "TransferInventory" DROP COLUMN "scheduleKey";

-- CreateIndex
CREATE UNIQUE INDEX "TransferInventory_transferId_scheduleId_date_key" ON "TransferInventory"("transferId", "scheduleId", "date");
