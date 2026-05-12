import { prisma } from '../../../config/prisma';
import { BookingStatus, PaymentStatus } from '../../../generated/prisma/enums';
import { findAccommodationOrFail } from '../accommodation.query';
import {
  calculateAccommodationPricing,
  ensureAccommodationInventoryRows,
  ensureUnitInventoryRows,
  reserveAccommodationInventory,
  reserveUnitInventory,
} from '../inventory/inventory.service';
import { CreateAccommodationBookingType } from './accommodation-booking.type';
import { getNightCount, getStayDates } from './accommodation-booking.utils';

export async function createBookingService(
  data: CreateAccommodationBookingType,
) {
  const {
    checkIn,
    checkOut,
    accommodationId,
    userId,
    units,
    adults,
    specialRequests,
    unitId,
    children,
  } = data;

  const accommodation = await findAccommodationOrFail(accommodationId);

  if (accommodation.hasUnits && !unitId) {
    throw new Error('Unit is required');
  }

  if (!accommodation.hasUnits && unitId) {
    throw new Error('This accommodation does not support units');
  }

  const dates = getStayDates({ checkIn, checkOut });

  const nights = getNightCount({ checkIn, checkOut });

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  return prisma.$transaction(async (tx) => {
    let selectedUnit = null;

    if (unitId) {
      selectedUnit = await tx.accommodationUnit.findFirst({
        where: {
          id: unitId,
          accommodationId,
        },
      });

      if (!selectedUnit) {
        throw new Error('Unit not found');
      }

      if (
        adults > selectedUnit.maxAdult ||
        (children && children > (selectedUnit.maxChildren ?? 0))
      ) {
        throw new Error('Guest count exceeds unit limit');
      }

      await ensureUnitInventoryRows(tx, {
        unitId,
        quantity: selectedUnit.quantity,
        dates,
      });

      await reserveUnitInventory(tx, { unitId, dates, units });
    } else {
      if (adults > (accommodation.maxGuests ?? 0)) {
        throw new Error('Guest count exceeds accommodation limit');
      }

      await ensureAccommodationInventoryRows(tx, { accommodationId, dates });

      await reserveAccommodationInventory(tx, {
        accommodationId,
        dates,
        units,
      });
    }

    const totalPrice = await calculateAccommodationPricing(tx, {
      accommodation,
      unit: selectedUnit,
      dates,
      units,
    });

    const booking = await tx.accommodationBooking.create({
      data: {
        accommodationId,
        unitId: selectedUnit?.id ?? null,
        userId,
        checkIn,
        checkOut,
        nights,
        adults,
        children: children ?? 0,
        units,
        totalPrice,
        expiresAt,
        specialRequests,
        bookingStatus: BookingStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
      },
    });

    return booking;
  });
}
