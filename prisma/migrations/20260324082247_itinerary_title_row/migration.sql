/*
  Warnings:

  - Added the required column `title` to the `Itinerary` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Itinerary" ADD COLUMN     "title" TEXT NOT NULL;
