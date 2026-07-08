/*
  Warnings:

  - You are about to drop the column `availableSlots` on the `TourDailyCapacity` table. All the data in the column will be lost.
  - Changed the type of `type` on the `Booking` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `serviceType` on the `ServiceLike` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `capacitySlots` to the `TourDailyCapacity` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('TOUR', 'ACCOMMODATION', 'TRANSFER', 'RENTAL');

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "type",
ADD COLUMN     "type" "ServiceType" NOT NULL;

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "accommodationId" TEXT,
ADD COLUMN     "imageIds" TEXT[],
ADD COLUMN     "rentalItemId" TEXT,
ADD COLUMN     "transferId" TEXT,
ADD COLUMN     "unitId" TEXT,
ALTER COLUMN "tourId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ServiceLike" DROP COLUMN "serviceType",
ADD COLUMN     "serviceType" "ServiceType" NOT NULL;

-- AlterTable
ALTER TABLE "TourDailyCapacity" DROP COLUMN "availableSlots",
ADD COLUMN     "capacitySlots" INTEGER NOT NULL;

-- DropEnum
DROP TYPE "BookingType";

-- CreateIndex
CREATE UNIQUE INDEX "ServiceLike_userId_serviceType_key" ON "ServiceLike"("userId", "serviceType");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "Transfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_accommodationId_fkey" FOREIGN KEY ("accommodationId") REFERENCES "Accommodation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "AccommodationUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_rentalItemId_fkey" FOREIGN KEY ("rentalItemId") REFERENCES "RentalItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
