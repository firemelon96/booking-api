/*
  Warnings:

  - You are about to drop the `TourLike` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "TourLike" DROP CONSTRAINT "TourLike_tourId_fkey";

-- DropForeignKey
ALTER TABLE "TourLike" DROP CONSTRAINT "TourLike_userId_fkey";

-- DropTable
DROP TABLE "TourLike";

-- CreateTable
CREATE TABLE "ServiceLike" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tourId" TEXT,
    "transferId" TEXT,
    "accommodationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceLike_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServiceLike_userId_key" ON "ServiceLike"("userId");

-- AddForeignKey
ALTER TABLE "ServiceLike" ADD CONSTRAINT "ServiceLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceLike" ADD CONSTRAINT "ServiceLike_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceLike" ADD CONSTRAINT "ServiceLike_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "Transfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceLike" ADD CONSTRAINT "ServiceLike_accommodationId_fkey" FOREIGN KEY ("accommodationId") REFERENCES "Accommodation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
