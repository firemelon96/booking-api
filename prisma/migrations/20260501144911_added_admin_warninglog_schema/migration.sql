-- CreateEnum
CREATE TYPE "AdminAction" AS ENUM ('OVERBOOKING', 'FORCED_PRIVATE');

-- CreateTable
CREATE TABLE "AdminWarningLog" (
    "id" TEXT NOT NULL,
    "actionType" "AdminAction" NOT NULL,
    "message" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,
    "bookingId" TEXT,
    "actorId" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminWarningLog_pkey" PRIMARY KEY ("id")
);
