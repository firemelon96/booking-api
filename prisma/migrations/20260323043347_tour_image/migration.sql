/*
  Warnings:

  - You are about to drop the column `images` on the `Tour` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Tour" DROP COLUMN "images",
ADD COLUMN     "imageId" TEXT,
ADD COLUMN     "imageUrl" TEXT;
