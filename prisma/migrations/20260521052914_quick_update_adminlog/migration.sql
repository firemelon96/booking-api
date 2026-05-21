-- AlterTable
ALTER TABLE "AdminWarningLog" ADD COLUMN     "accommodationId" TEXT,
ALTER COLUMN "tourId" DROP NOT NULL;
