-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "isAdminOverride" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isOverbooked" BOOLEAN NOT NULL DEFAULT false;
