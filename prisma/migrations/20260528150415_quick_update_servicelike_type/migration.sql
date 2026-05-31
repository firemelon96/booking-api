/*
  Warnings:

  - A unique constraint covering the columns `[userId,serviceType]` on the table `ServiceLike` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `serviceType` to the `ServiceLike` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "ServiceLike_userId_key";

-- AlterTable
ALTER TABLE "ServiceLike" ADD COLUMN     "serviceType" "BookingType" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ServiceLike_userId_serviceType_key" ON "ServiceLike"("userId", "serviceType");
