-- AlterTable
ALTER TABLE "PaymentTransation" ADD COLUMN     "description" TEXT,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ALTER COLUMN "paidAt" DROP NOT NULL;
