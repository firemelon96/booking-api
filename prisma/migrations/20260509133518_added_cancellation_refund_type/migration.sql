/*
  Warnings:

  - You are about to drop the column `freeCancellationHours` on the `CancellationPolicy` table. All the data in the column will be lost.
  - You are about to drop the column `refundPercentage` on the `CancellationPolicy` table. All the data in the column will be lost.
  - Added the required column `fullRefundHours` to the `CancellationPolicy` table without a default value. This is not possible if the table is not empty.
  - Added the required column `partialRefundPercentage` to the `CancellationPolicy` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CancellationRefundType" AS ENUM ('FULL', 'PARTIAL', 'NONE');

-- AlterEnum
ALTER TYPE "AdminAction" ADD VALUE 'FORCED_JOINER';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "cancellationRefundType" "CancellationRefundType";

-- AlterTable
ALTER TABLE "CancellationPolicy" DROP COLUMN "freeCancellationHours",
DROP COLUMN "refundPercentage",
ADD COLUMN     "fullRefundHours" INTEGER NOT NULL,
ADD COLUMN     "partialRefundPercentage" INTEGER NOT NULL,
ALTER COLUMN "description" DROP NOT NULL;
