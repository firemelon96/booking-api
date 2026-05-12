/*
  Warnings:

  - You are about to drop the column `unitId` on the `AccommodationInventory` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[accommodationId,date]` on the table `AccommodationInventory` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `accommodationId` to the `AccommodationInventory` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "AccommodationInventory" DROP CONSTRAINT "AccommodationInventory_unitId_fkey";

-- DropIndex
DROP INDEX "AccommodationInventory_unitId_date_key";

-- AlterTable
ALTER TABLE "Accommodation" ADD COLUMN     "hasUnits" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "AccommodationInventory" DROP COLUMN "unitId",
ADD COLUMN     "accommodationId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "AccommodationUnitInventory" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "availableUnits" INTEGER NOT NULL,
    "bookedUnits" INTEGER NOT NULL DEFAULT 1,
    "overridePrice" DECIMAL(10,2),
    "isClosed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AccommodationUnitInventory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccommodationUnitInventory_unitId_date_key" ON "AccommodationUnitInventory"("unitId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "AccommodationInventory_accommodationId_date_key" ON "AccommodationInventory"("accommodationId", "date");

-- AddForeignKey
ALTER TABLE "AccommodationInventory" ADD CONSTRAINT "AccommodationInventory_accommodationId_fkey" FOREIGN KEY ("accommodationId") REFERENCES "Accommodation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccommodationUnitInventory" ADD CONSTRAINT "AccommodationUnitInventory_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "AccommodationUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
