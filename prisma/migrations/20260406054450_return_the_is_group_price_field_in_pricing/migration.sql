-- AlterTable
ALTER TABLE "Tour" ALTER COLUMN "types" SET DEFAULT 'DAY';

-- AlterTable
ALTER TABLE "TourPricing" ADD COLUMN     "isGroupPrice" BOOLEAN NOT NULL DEFAULT false;
