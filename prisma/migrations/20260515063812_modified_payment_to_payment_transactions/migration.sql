/*
  Warnings:

  - You are about to drop the `Payment` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('INITIAL_PAYMENT', 'ADDITIONAL_PAYMENT', 'REFUND', 'MANUAL_ADJUSTMENT');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PaymentStatus" ADD VALUE 'REFUNDED';
ALTER TYPE "PaymentStatus" ADD VALUE 'PARTIALLY_REFUNDED';

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_bookingId_fkey";

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "paidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "remainingBalance" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "Payment";

-- DropEnum
DROP TYPE "BedType";

-- CreateTable
CREATE TABLE "PaymentTransation" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL,
    "xenditInvoiceId" TEXT,
    "invoiceUrl" TEXT,
    "metadata" JSONB,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "PaymentTransation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTransation_bookingId_key" ON "PaymentTransation"("bookingId");

-- AddForeignKey
ALTER TABLE "PaymentTransation" ADD CONSTRAINT "PaymentTransation_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
