import { prisma } from '../../../config/prisma';
import { BookingStatus, PaymentStatus } from '../../../generated/prisma/enums';
import { logBookingAction } from '../../bookings/audit/booking-audit.service';
import {
  createUniqueBookingReference,
  findBookingOrThrow,
} from '../../bookings/booking.query';
import { findAccommodationOrFail } from '../accommodation.query';
import {
  lockAccommodationInventory,
  lockUnitInventory,
} from '../inventory/inventory-lock.service';
import {
  releaseAccommodationInventory,
  releaseUnitInventory,
} from '../inventory/inventory-release.service';
import {
  calculateAccommodationPricing,
  ensureAccommodationInventoryRows,
  ensureUnitInventoryRows,
  reserveAccommodationInventory,
  reserveUnitInventory,
} from '../inventory/inventory.service';
import {
  CreateAccommodationBookingType,
  RescheduleAccommodationBookingType,
} from './accommodation-booking.type';
import { getNightCount, getStayDates } from './accommodation-booking.utils';
import { findAccommodationBookingOrThrow } from './accommodation.query';

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
    throw new Error('This accommodation does not have units');
  }

  const dates = getStayDates({ checkIn, checkOut });

  const nights = getNightCount({ checkIn, checkOut });

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  const guests = children ? adults + children : adults;

  return prisma.$transaction(async (tx) => {
    const reference = await createUniqueBookingReference(tx);

    let selectedUnit;

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
      if (guests > (accommodation.maxGuests ?? 0)) {
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

    const booking = await tx.booking.create({
      data: {
        reference,
        type: 'ACCOMMODATION',
        userId,
        totalPrice,
        expiresAt,
      },
    });

    await tx.accommodationBooking.create({
      data: {
        bookingId: booking.id,
        accommodationId: accommodation.id,
        unitId: selectedUnit?.id ?? null,
        checkIn,
        checkOut,
        nights,
        guests,
        units,
        specialRequests,
      },
    });

    await logBookingAction({
      tx,
      userId,
      role: 'USER', //pass the role and allow overbooking for admin
      newValue: booking,
      action: 'CREATED',
    });

    return booking;
  });
}

export async function reschedAccommodationBooking({
  bookingId,
  checkIn,
  checkOut,
  role,
  userId,
}: RescheduleAccommodationBookingType) {
  const accommodationBooking = await findAccommodationBookingOrThrow({
    bookingId,
    role,
    userId,
  });

  const accommodationId = accommodationBooking.accommodationId;
  const unitId = accommodationBooking.unitId;

  if (accommodationBooking.booking.bookingStatus === 'CANCELLED') {
    throw new Error('Cannot reschedule cancelled booking');
  }

  const oldDates = getStayDates({
    checkIn: accommodationBooking.checkIn,
    checkOut: accommodationBooking.checkOut,
  });

  const newDates = getStayDates({ checkIn, checkOut });

  return prisma.$transaction(async (tx) => {
    if (unitId) {
      await lockUnitInventory(tx, {
        unitId,
        dates: oldDates,
      });

      await releaseUnitInventory(tx, {
        unitId,
        dates: oldDates,
        units: accommodationBooking.units,
      });

      await ensureUnitInventoryRows(tx, {
        unitId,
        dates: newDates,
        quantity: accommodationBooking.unit?.quantity ?? 1,
      });

      await lockUnitInventory(tx, {
        unitId,
        dates: newDates,
      });

      await reserveUnitInventory(tx, {
        unitId,
        dates: newDates,
        units: accommodationBooking.units,
      });
    } else {
      await lockAccommodationInventory(tx, {
        accommodationId,
        dates: oldDates,
      });

      await releaseAccommodationInventory(tx, {
        accommodationId,
        dates: oldDates,
        units: accommodationBooking.units,
      });

      await ensureAccommodationInventoryRows(tx, {
        accommodationId,
        dates: newDates,
      });

      await lockAccommodationInventory(tx, {
        accommodationId,
        dates: newDates,
      });

      await reserveAccommodationInventory(tx, {
        accommodationId,
        dates: newDates,
        units: accommodationBooking.units,
      });
    }

    // const totalPrice = await calculateAccommodationPricing(tx, {
    //   accommodation: accommodationBooking.accommodation,
    //   unit: accommodationBooking.unit,
    //   dates: newDates,
    //   units: accommodationBooking.units,
    // });

    const updatedBooking = await tx.booking.update({
      where: { id: bookingId },
      data: {
        type: 'ACCOMMODATION',
        rescheduleCount: { increment: 1 },
        lastRescheduleDate: new Date(),
        isAdminOverride: role === 'ADMIN',
      },
    });

    await tx.accommodationBooking.update({
      where: { bookingId },
      data: {
        checkIn,
        checkOut,
        nights: getNightCount({ checkIn, checkOut }),
      },
    });

    await logBookingAction({
      tx,
      userId,
      role,
      previousValue: accommodationBooking,
      newValue: updatedBooking,
      action: 'RESCHEDULED',
    });

    return updatedBooking;
  });
}
