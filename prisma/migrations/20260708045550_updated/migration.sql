/*
  Warnings:

  - The values [RENTALS] on the enum `ImageType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `AccommodationImage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AccommodationUnitImage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RentalItemImage` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ImageType_new" AS ENUM ('TOUR', 'ITINERARY', 'TRANSFER', 'ACCOMMODATION', 'ACCOMMODATIONUNIT', 'RENTALITEMS', 'RENTAL', 'PROFILE', 'REVIEW');
ALTER TABLE "Image" ALTER COLUMN "type" TYPE "ImageType_new" USING ("type"::text::"ImageType_new");
ALTER TYPE "ImageType" RENAME TO "ImageType_old";
ALTER TYPE "ImageType_new" RENAME TO "ImageType";
DROP TYPE "public"."ImageType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "AccommodationImage" DROP CONSTRAINT "AccommodationImage_accommodationId_fkey";

-- DropForeignKey
ALTER TABLE "AccommodationUnitImage" DROP CONSTRAINT "AccommodationUnitImage_unitId_fkey";

-- DropForeignKey
ALTER TABLE "RentalItemImage" DROP CONSTRAINT "RentalItemImage_imageId_fkey";

-- DropForeignKey
ALTER TABLE "RentalItemImage" DROP CONSTRAINT "RentalItemImage_rentalItemId_fkey";

-- AlterTable
ALTER TABLE "Image" ADD COLUMN     "accommodationId" TEXT,
ADD COLUMN     "rentalItemId" TEXT,
ADD COLUMN     "reviewId" TEXT,
ADD COLUMN     "unitId" TEXT;

-- AlterTable
ALTER TABLE "ServiceLike" ADD COLUMN     "unitId" TEXT;

-- DropTable
DROP TABLE "AccommodationImage";

-- DropTable
DROP TABLE "AccommodationUnitImage";

-- DropTable
DROP TABLE "RentalItemImage";

-- AddForeignKey
ALTER TABLE "ServiceLike" ADD CONSTRAINT "ServiceLike_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "AccommodationUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_rentalItemId_fkey" FOREIGN KEY ("rentalItemId") REFERENCES "RentalItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_accommodationId_fkey" FOREIGN KEY ("accommodationId") REFERENCES "Accommodation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "AccommodationUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;
