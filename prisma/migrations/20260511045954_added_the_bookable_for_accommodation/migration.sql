-- DropForeignKey
ALTER TABLE "AccommodationBooking" DROP CONSTRAINT "AccommodationBooking_unitId_fkey";

-- AlterTable
ALTER TABLE "Accommodation" ADD COLUMN     "basePrice" DECIMAL(10,2),
ADD COLUMN     "isBookable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxGuests" INTEGER;

-- AlterTable
ALTER TABLE "AccommodationBooking" ALTER COLUMN "unitId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "AccommodationBooking" ADD CONSTRAINT "AccommodationBooking_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "AccommodationUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
