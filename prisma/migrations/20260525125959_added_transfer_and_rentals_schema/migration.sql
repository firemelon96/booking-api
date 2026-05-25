-- CreateEnum
CREATE TYPE "TransferType" AS ENUM ('AIRPORT', 'VAN', 'BOAT', 'FERRY', 'PRIVATE_CAR');

-- CreateEnum
CREATE TYPE "TransferPricingMode" AS ENUM ('SHARED', 'PRIVATE', 'MIXED');

-- CreateEnum
CREATE TYPE "TransferLocationType" AS ENUM ('AIRPORT', 'PORT', 'TERMINAL', 'HOTEL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "RentalType" AS ENUM ('MORTORBIKE', 'SCOOTER', 'CAR', 'VAN', 'BICYCLE', 'KAYAK', 'CAMPING_GEAR', 'BOAT', 'OTHER');

-- CreateEnum
CREATE TYPE "RentalPricingMode" AS ENUM ('FIXED', 'FLEXIBLE');

-- CreateEnum
CREATE TYPE "RentalPricingType" AS ENUM ('HOURLY', 'DAILY', 'WEEKLY');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BookingType" ADD VALUE 'TRANSFER';
ALTER TYPE "BookingType" ADD VALUE 'RENTAL';

-- CreateTable
CREATE TABLE "Transfer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "type" "TransferType" NOT NULL,
    "originId" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "pricingMode" "TransferPricingMode" NOT NULL,
    "basePrice" DECIMAL(12,2) NOT NULL,
    "maxPassengers" INTEGER NOT NULL,
    "hasSchedule" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransferLocation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TransferLocationType" NOT NULL,
    "address" TEXT,
    "latitude" DECIMAL(65,30),
    "longitude" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransferLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransferSchedule" (
    "id" TEXT NOT NULL,
    "transferId" TEXT NOT NULL,
    "departureTime" TEXT NOT NULL,
    "maxPassengers" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransferSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransferInventory" (
    "id" TEXT NOT NULL,
    "transferId" TEXT NOT NULL,
    "scheduleId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "availableSeats" INTEGER NOT NULL,
    "bookedSeats" INTEGER NOT NULL DEFAULT 0,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransferInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransferPricing" (
    "id" TEXT NOT NULL,
    "transferId" TEXT NOT NULL,
    "pricingType" "PricingType" NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "minPassengers" INTEGER,
    "maxPassengers" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransferPricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransferBooking" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "transferId" TEXT NOT NULL,
    "scheduleId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "passengers" INTEGER NOT NULL,
    "pricingType" "PricingType" NOT NULL,
    "pickupLocation" TEXT,
    "dropoffLocation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Rental" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "type" "RentalType" NOT NULL,
    "pricingMode" "RentalPricingMode" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "maxGuests" INTEGER,
    "hasHourlyPricing" BOOLEAN NOT NULL DEFAULT false,
    "hasDailyPricing" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rental_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalInventory" (
    "id" TEXT NOT NULL,
    "rentalId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "availableUnits" INTEGER NOT NULL,
    "bookedUnits" INTEGER NOT NULL DEFAULT 0,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RentalInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalPricing" (
    "id" TEXT NOT NULL,
    "rentalId" TEXT NOT NULL,
    "pricingType" "RentalPricingType" NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RentalPricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalBooking" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "rentalId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "guests" INTEGER,
    "pricingType" "RentalPricingType" NOT NULL,
    "pickupLocation" TEXT,
    "returnLocation" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentalBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalAmenity" (
    "rentalId" TEXT NOT NULL,
    "amenityId" TEXT NOT NULL,

    CONSTRAINT "RentalAmenity_pkey" PRIMARY KEY ("rentalId","amenityId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Transfer_slug_key" ON "Transfer"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "TransferInventory_transferId_scheduleId_date_key" ON "TransferInventory"("transferId", "scheduleId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "TransferBooking_bookingId_key" ON "TransferBooking"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "Rental_slug_key" ON "Rental"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "RentalInventory_rentalId_date_key" ON "RentalInventory"("rentalId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "RentalBooking_bookingId_key" ON "RentalBooking"("bookingId");

-- AddForeignKey
ALTER TABLE "TourBooking" ADD CONSTRAINT "TourBooking_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "TourScheduleOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_originId_fkey" FOREIGN KEY ("originId") REFERENCES "TransferLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "TransferLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferSchedule" ADD CONSTRAINT "TransferSchedule_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "Transfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferInventory" ADD CONSTRAINT "TransferInventory_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "Transfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferInventory" ADD CONSTRAINT "TransferInventory_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "TransferSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferPricing" ADD CONSTRAINT "TransferPricing_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "Transfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferBooking" ADD CONSTRAINT "TransferBooking_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferBooking" ADD CONSTRAINT "TransferBooking_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "Transfer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferBooking" ADD CONSTRAINT "TransferBooking_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "TransferSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalInventory" ADD CONSTRAINT "RentalInventory_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "Rental"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalPricing" ADD CONSTRAINT "RentalPricing_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "Rental"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalBooking" ADD CONSTRAINT "RentalBooking_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalBooking" ADD CONSTRAINT "RentalBooking_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "Rental"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalAmenity" ADD CONSTRAINT "RentalAmenity_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "Rental"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalAmenity" ADD CONSTRAINT "RentalAmenity_amenityId_fkey" FOREIGN KEY ("amenityId") REFERENCES "Amenity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
