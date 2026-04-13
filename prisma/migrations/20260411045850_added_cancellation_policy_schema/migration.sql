-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REFUNDED');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "canceledAt" TIMESTAMP(3),
ADD COLUMN     "refundAmount" DOUBLE PRECISION,
ADD COLUMN     "refundStatus" "RefundStatus";

-- CreateTable
CREATE TABLE "CancellationPolicy" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "freeCancellationHours" INTEGER NOT NULL,
    "partialRefundHours" INTEGER NOT NULL,
    "refundPercentage" INTEGER NOT NULL,
    "tourId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CancellationPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CancellationPolicy_tourId_key" ON "CancellationPolicy"("tourId");

-- AddForeignKey
ALTER TABLE "CancellationPolicy" ADD CONSTRAINT "CancellationPolicy_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;
