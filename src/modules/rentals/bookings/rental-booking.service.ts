import { eachDayOfInterval, isSameDay } from 'date-fns';
import { Role } from '../../../generated/prisma/enums';
import { normalizeInterval } from '../../../utils/helper';
import { findRentalItemByIdOrFail } from '../items/rental-item.query';
import { RentalItemIdParams } from '../items/rental-item.type';
import { findRentalByIdOrFail } from '../rental.query';
import {
  CreateRentalBooking,
  RescheduleRentalBooking,
} from './rental-booking.type';
import { prisma } from '../../../config/prisma';
import { createUniqueBookingReference } from '../../bookings/booking.query';
import {
  ensureRentalInventory,
  lockRentalInventory,
  releaseRentalInventory,
  reserveRentalInventory,
} from '../inventories/rental-inventory.service';
import {
  createInitialBookingPayment,
  createPaymentTransaction,
} from '../../bookings/payment/payment.query';
import { logBookingAction } from '../../bookings/audit/booking-audit.service';
import { calculateRentalPrice } from '../pricings/rental-pricing.query';
import { findRentalItemBookingOrThrow } from './rental-booking.query';
import { BOOKING_RULES } from '../../bookings/booking.rule';
import { BookingInputType } from '../../bookings/booking.type';

export async function createRentalBookingService(
  userId: string,
  role: Role,
  { itemId, rentalId }: RentalItemIdParams,
  {
    endDate,
    pricingType,
    quantity,
    startDate,
    notes,
    pickupLocation,
    returnLocation,
  }: CreateRentalBooking,
) {
  const isAdmin = role === 'ADMIN';

  const rental = await findRentalByIdOrFail(rentalId);
  const rentalItem = await findRentalItemByIdOrFail(itemId);

  if (rentalItem.rentalId !== rental.id) {
    throw new Error('Rental item does not belong to the specified rental');
  }

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  const interval = normalizeInterval(startDate, endDate);

  const dates = eachDayOfInterval(interval);

  return prisma.$transaction(async (tx) => {
    const reference = await createUniqueBookingReference(tx);

    await ensureRentalInventory(tx, { itemId: rentalItem.id, dates, quantity });

    await lockRentalInventory(tx, { itemId: rentalItem.id, dates });

    const reserveResult = await reserveRentalInventory(tx, {
      itemId: rentalItem.id,
      dates,
      isAdmin,
      userId,
      quantity,
    });

    const totalPrice = calculateRentalPrice({
      rentalItem,
      pricingType,
      quantity,
      startDate: interval.start,
      endDate: interval.end,
    });

    const booking = await tx.booking.create({
      data: {
        reference,
        type: 'RENTAL',
        totalPrice,
        isAdminOverride: reserveResult.hasAdminOverride,
        userId,
        expiresAt,
        bookingStatus: isAdmin ? 'CONFIRMED' : 'PENDING',
        paymentStatus: isAdmin ? 'PAID' : 'PENDING',
        paidAmount: isAdmin ? totalPrice : 0,
        remainingBalance: isAdmin ? 0 : totalPrice,
      },
    });

    await tx.rentalBooking.create({
      data: {
        bookingId: booking.id,
        rentalItemId: rentalItem.id,
        startDate,
        endDate,
        pickupLocation,
        returnLocation,
        pricingType,
        hasOverbooking: reserveResult.hasOverbooking,
        quantity,
        notes,
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

export async function rescheduleRentalItemBookingService(
  bookingId: string,
  userId: string,
  role: Role,
  { startDate, endDate }: RescheduleRentalBooking,
) {
  const isAdmin = role === 'ADMIN';

  const rentalBooking = await findRentalItemBookingOrThrow(bookingId);

  const booking = rentalBooking.booking;

  const item = rentalBooking.item;

  if (booking.bookingStatus !== 'CONFIRMED') {
    throw new Error('Only confirmed boooking can be rescheduled');
  }

  if (booking.rescheduleCount >= BOOKING_RULES.MAX_RESCHEDULES) {
    throw new Error('Maximum reschedule attempts exceeded');
  }

  const oldInterval = normalizeInterval(
    rentalBooking.startDate,
    rentalBooking.endDate,
  );

  const newInterval = normalizeInterval(startDate, endDate);

  if (oldInterval === newInterval) {
    throw new Error('No changes detected');
  }

  const oldDates = eachDayOfInterval(oldInterval);
  const newDates = eachDayOfInterval(newInterval);

  const datesToReserve = newDates.filter(
    (n) => !oldDates.some((o) => isSameDay(o, n)),
  );

  const datesToRelease = oldDates.filter(
    (o) => !newDates.some((n) => isSameDay(n, o)),
  );

  const cutoff = new Date(
    rentalBooking.startDate.getTime() -
      BOOKING_RULES.CUTOFF_HOURS * 60 * 60 * 1000,
  );

  if (new Date() > cutoff) {
    throw new Error(
      `Rescheduling must be done at least ${BOOKING_RULES.CUTOFF_HOURS} hours before the start time`,
    );
  }

  if (rentalBooking.booking.rescheduleCount >= BOOKING_RULES.MAX_RESCHEDULES) {
    throw new Error(`Maximum reschedule reached.`);
  }

  return prisma.$transaction(async (tx) => {
    await lockRentalInventory(tx, { itemId: item.id, dates: datesToRelease });

    await releaseRentalInventory(tx, {
      itemId: item.id,
      dates: datesToRelease,
      quantity: item.quantity,
    });

    await ensureRentalInventory(tx, {
      itemId: item.id,
      dates: datesToReserve,
      quantity: item.quantity,
    });

    await lockRentalInventory(tx, { itemId: item.id, dates: datesToReserve });

    const reserveResult = await reserveRentalInventory(tx, {
      itemId: item.id,
      dates: datesToReserve,
      isAdmin,
      userId,
      quantity: item.quantity,
    });

    const resched = await tx.booking.update({
      where: { id: bookingId },
      data: {
        type: 'RENTAL',
        lastRescheduleDate: new Date(),
        rescheduleCount: { increment: 1 },
        isAdminOverride: reserveResult.hasAdminOverride,
      },
    });

    await tx.rentalBooking.update({
      where: { bookingId },
      data: {
        startDate: newInterval.start,
        endDate: newInterval.end,
      },
    });

    await logBookingAction({
      tx,
      role,
      userId,
      newValue: resched,
      action: 'RESCHEDULED',
      previousValue: booking,
    });

    return resched;
  });
}

export async function cancelRentalBooking({
  bookingId,
  userId,
  role,
}: BookingInputType) {
  const rentalBooking = await findRentalItemBookingOrThrow(bookingId);

  const isAdmin = role === 'ADMIN';

  const booking = rentalBooking.booking;

  if (booking.bookingStatus !== 'CONFIRMED') {
    throw new Error('Only confirmed booking can be cancelled');
  }

  if (rentalBooking.startDate < new Date()) {
    throw new Error('Cannot cancel past bookings');
  }

  const interval = normalizeInterval(
    rentalBooking.startDate,
    rentalBooking.endDate,
  );

  const dates = eachDayOfInterval(interval);

  const cutoff = new Date(
    rentalBooking.startDate.getTime() -
      BOOKING_RULES.CUTOFF_HOURS * 60 * 60 * 1000,
  );

  if (new Date() >= cutoff) {
    throw new Error(
      `Cancellations must be made at least ${BOOKING_RULES.CUTOFF_HOURS} hours before the booking start time.`,
    );
  }

  return prisma.$transaction(async (tx) => {
    await lockRentalInventory(tx, { itemId: rentalBooking.item.id, dates });

    await releaseRentalInventory(tx, {
      itemId: rentalBooking.item.id,
      dates,
      quantity: rentalBooking.quantity,
    });

    const cancelled = await tx.booking.update({
      where: { id: bookingId },
      data: {
        type: 'RENTAL',
        bookingStatus: 'CANCELLED',
        cancelledAt: new Date(),
        isAdminOverride: isAdmin,
      },
    });

    await logBookingAction({
      tx,
      userId,
      role,
      previousValue: booking,
      newValue: cancelled,
      action: 'CANCELLED',
    });

    return cancelled;
  });
}
