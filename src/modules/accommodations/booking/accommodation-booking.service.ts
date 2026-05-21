import { prisma } from '../../../config/prisma';
import { Role } from '../../../generated/prisma/enums';
import { logBookingAction } from '../../bookings/audit/booking-audit.service';
import { createUniqueBookingReference } from '../../bookings/booking.query';
import {
  createInitialBookingPayment,
  createPaymentTransaction,
  createRescheduleAdjustmentPayment,
} from '../../bookings/payment/payment.query';
import { logAdminWarning } from '../../logs/admin-warning.service';
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
  RescheduleAccommodationPayload,
} from './accommodation-booking.type';
import { getNightCount, getStayDates } from './accommodation-booking.utils';
import { findAccommodationBookingOrThrow } from './accommodation.query';

export async function createAccommodationBookingService(
  accommodationId: string,
  userId: string,
  role: Role,
  data: CreateAccommodationBookingType,
) {
  const {
    checkIn,
    checkOut,
    units,
    adults,
    specialRequests,
    unitId,
    children,
  } = data;

  const isAdmin = role === 'ADMIN';

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
    let reservationResult = {
      hasOverbooking: false,
      adminOverride: false,
    };

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

      const maxUnitGuest =
        selectedUnit.maxAdult + (selectedUnit.maxChildren ?? 0);

      if (guests > maxUnitGuest) {
        if (!isAdmin) {
          throw new Error('Guest count exceeds unit limit');
        }

        reservationResult.adminOverride = true;

        await logAdminWarning({
          tx,
          actionType: 'EXCEED_CAPACITY',
          message: `Admin exceeds maxguest limit on ${dates}`,
          actorId: userId,
          unitId: selectedUnit.id,
          metadata: selectedUnit,
        });
      }

      await ensureUnitInventoryRows(tx, {
        unitId,
        quantity: selectedUnit.quantity,
        dates,
      });

      await lockUnitInventory(tx, {
        unitId,
        dates,
      });

      reservationResult = await reserveUnitInventory(tx, {
        unitId,
        dates,
        units,
        isAdmin,
        userId,
      });
    } else {
      if (guests > (accommodation.maxGuests ?? 0)) {
        if (!isAdmin) {
          throw new Error('Guest count exceeds accommodation limit');
        }

        reservationResult.adminOverride = true;

        await logAdminWarning({
          tx,
          actionType: 'EXCEED_CAPACITY',
          actorId: userId,
          accommodationId: accommodation.id,
          message: `Admin exceeding limit accommodation on ${dates}`,
          metadata: accommodation,
        });
      }

      await ensureAccommodationInventoryRows(tx, { accommodationId, dates });

      await lockAccommodationInventory(tx, { accommodationId, dates });

      reservationResult = await reserveAccommodationInventory(tx, {
        accommodationId,
        dates,
        units,
        userId,
        isAdmin,
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
        isAdminOverride: reservationResult.adminOverride,
        bookingStatus: isAdmin ? 'CONFIRMED' : 'PENDING',
        paymentStatus: isAdmin ? 'PAID' : 'PENDING',
        paidAmount: isAdmin ? totalPrice : 0,
        remainingBalance: isAdmin ? 0 : totalPrice,
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
        isOverbooked: reservationResult.hasOverbooking,
      },
    });

    let paymentTransaction = null;

    if (!isAdmin) {
      paymentTransaction = await createInitialBookingPayment(tx, {
        amount: totalPrice,
        bookingId: booking.id,
        type: 'INITIAL_PAYMENT',
      });
    } else {
      paymentTransaction = await createPaymentTransaction({
        tx,
        type: 'MANUAL_ADJUSTMENT',
        amount: totalPrice,
        paymentStatus: 'PAID',
        bookingId: booking.id,
        description: 'Admin offline booking payment',
      });
    }

    await logBookingAction({
      tx,
      userId,
      role,
      newValue: booking,
      action: 'CREATED',
    });

    return {
      booking,
      payment: paymentTransaction
        ? {
            paymentStatus: paymentTransaction.paymentStatus,

            invoiceUrl: paymentTransaction.invoiceUrl,

            amount: paymentTransaction.amount,
          }
        : null,
    };
  });
}

export async function reschedAccommodationBooking(
  bookingId: string,
  userId: string,
  role: Role,
  payload: RescheduleAccommodationPayload,
) {
  const isAdmin = role === 'ADMIN';
  const { checkIn, checkOut } = payload;

  const accommodationBooking = await findAccommodationBookingOrThrow({
    bookingId,
    role,
    userId,
  });

  const booking = accommodationBooking.booking;
  const accommodationId = accommodationBooking.accommodationId;
  const unitId = accommodationBooking.unitId;

  if (booking.bookingStatus === 'CANCELLED') {
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
        isAdmin,
        userId,
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
        isAdmin,
        userId,
        units: accommodationBooking.units,
      });
    }

    const newTotalPrice = await calculateAccommodationPricing(tx, {
      accommodation: accommodationBooking.accommodation,
      unit: accommodationBooking.unit,
      dates: newDates,
      units: accommodationBooking.units,
    });

    const oldPrice = Number(booking.totalPrice);
    const priceDifference = newTotalPrice - oldPrice;

    if (priceDifference < 0) {
      throw new Error('Automatic refund on reschedule is not yet upported');
    }

    let bookingStatus = booking.bookingStatus;

    if (priceDifference > 0) {
      bookingStatus = 'PENDING';
    }

    const updateBooking = await tx.booking.update({
      where: {
        id: bookingId,
      },
      data: {
        type: 'ACCOMMODATION',
        rescheduleCount: { increment: 1 },
        lastRescheduleDate: new Date(),
        isAdminOverride: role === 'ADMIN',
        remainingBalance: Number(booking.remainingBalance) + priceDifference,
        totalPrice: newTotalPrice,
        bookingStatus,
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

    let paymentTransaction = null;

    if (priceDifference > 0) {
      paymentTransaction = await createRescheduleAdjustmentPayment({
        tx,
        amount: priceDifference,
        bookingId,
        customer: {
          givenName: booking.user ?? 'Guest',
          email: booking.user.email,
        },
      });
    }

    await logBookingAction({
      tx,
      userId,
      role,
      previousValue: accommodationBooking,
      newValue: updateBooking,
      action: 'RESCHEDULED',
    });

    return {
      booking: updateBooking,
      pricing: {
        oldPrice,
        newTotalPrice,
        priceDifference,
        requireAdditionalPayment: priceDifference > 0,
      },
      payment: paymentTransaction
        ? {
            amount: priceDifference,

            invoiceUrl: paymentTransaction.invoiceUrl,

            paymentStatus: paymentTransaction.paymentStatus,
          }
        : null,
    };
  });
}
