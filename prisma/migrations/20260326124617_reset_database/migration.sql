/*
  Warnings:

  - Added the required column `type` to the `Image` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ImageType" AS ENUM ('TOUR', 'ITINERARY', 'PROFILE');

-- CreateEnum
CREATE TYPE "ImageStatus" AS ENUM ('TEMP', 'ACTIVE');

-- AlterTable
ALTER TABLE "Image" ADD COLUMN     "status" "ImageStatus" NOT NULL DEFAULT 'TEMP',
ADD COLUMN     "type" "ImageType" NOT NULL,
ADD COLUMN     "userId" TEXT;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
