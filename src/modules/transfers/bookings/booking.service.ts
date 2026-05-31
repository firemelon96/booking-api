import { startOfDay } from 'date-fns';
import { prisma } from '../../../config/prisma';
import { Role } from '../../../generated/prisma/enums';
import { createUniqueBookingReference } from '../../bookings/booking.query';
import { logAdminWarning } from '../../logs/admin-warning.service';
import {
  ensureTransferInventory,
  lockTransferInventory,
  releaseTransferInventory,
  reserveTransferInventory,
} from '../inventories/inventory.service';
import { findTransferOrThrow } from '../transfer.query';
import {
  RescheduleTransferBookingInput,
  TransferBookingInput,
} from './booking.type';
import {
  createInitialBookingPayment,
  createPaymentTransaction,
} from '../../bookings/payment/payment.query';
import { logBookingAction } from '../../bookings/audit/booking-audit.service';
import { findTransferBookingOrThrow } from './booking.query';
import { BOOKING_RULES } from '../../../constant/constant';
import { release } from 'node:os';
import { BookingInputType } from '../../bookings/booking.type';

export async function createTransferBookingService(
  transferId: string,
  userId: string,
  role: Role,
  {
    passengers,
    pricingType,
    travelDate,
    dropoffLocation,
    pickupLocation,
    scheduleId,
  }: TransferBookingInput,
) {
  const isAdmin = role === 'ADMIN';

  const transfer = await findTransferOrThrow(transferId);

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  const date = startOfDay(travelDate);

  if (date < new Date()) {
    throw new Error('Invalid date selected');
  }

  let selectedSchedule = null;

  if (pricingType === 'JOINER') {
    if (!scheduleId) {
      throw new Error('Schedule is required for joiner booking.');
    }

    selectedSchedule = transfer.schedules.find(
      (schedule) => schedule.id === scheduleId,
    );

    if (!selectedSchedule) {
      throw new Error('Transfer schedule not found');
    }
  }

  const selectedPricing = transfer.pricing.find(
    (pricing) => pricing.pricingType === pricingType,
  );

  if (!selectedPricing) {
    throw new Error('Transfer pricing not found');
  }

  const maxPassengers =
    transfer.maxPassengers ?? selectedPricing.maxPassengers ?? null;

  return prisma.$transaction(async (tx) => {
    const reference = await createUniqueBookingReference(tx);

    if (maxPassengers && passengers > maxPassengers) {
      if (!isAdmin) {
        throw new Error('Passenger limit exceeds');
      }

      await logAdminWarning({
        tx,
        actionType: 'EXCEED_CAPACITY',
        message: `Admin exceeds maximum passenger seat`,
        actorId: userId,
        transferId: transfer.id,
        metadata: {
          passengers,
          maxPassengers,
        },
      });
    }

    let totalPrice = 0;

    if (pricingType === 'JOINER') {
      totalPrice = Number(selectedPricing.price) * passengers;
    } else {
      totalPrice = Number(selectedPricing.price);
    }

    await ensureTransferInventory(tx, {
      transferId: transfer.id,
      travelDate,
      maxPassengers,
      scheduleId,
    });

    await lockTransferInventory(tx, {
      transferId: transfer.id,
      travelDate,
    });

    const reservationResult = await reserveTransferInventory(tx, {
      transferId,
      travelDate,
      isAdmin,
      passengers,
      pricingType,
      userId,
      scheduleId,
    });

    //create booking
    const booking = await tx.booking.create({
      data: {
        reference,
        type: 'TRANSFER',
        totalPrice,
        isAdminOverride: reservationResult.hasAdminOverride,
        userId,
        expiresAt,
        bookingStatus: isAdmin ? 'CONFIRMED' : 'PENDING',
        paymentStatus: isAdmin ? 'PAID' : 'PENDING',
        paidAmount: isAdmin ? totalPrice : 0,
        remainingBalance: isAdmin ? 0 : totalPrice,
      },
    });

    //domain booking
    await tx.transferBooking.create({
      data: {
        bookingId: booking.id,
        transferId: transfer.id,
        date,
        passengers,
        pricingType,
        pickupLocation,
        dropoffLocation,
        scheduleId: scheduleId ?? null,
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

export async function rescheduleTransferBooking(
  bookingId: string,
  userId: string,
  role: Role,
  { travelDate, scheduleId }: RescheduleTransferBookingInput,
) {
  const isAdmin = role === 'ADMIN';

  const transferBooking = await findTransferBookingOrThrow({
    bookingId,
    userId,
    role,
  });

  const booking = transferBooking.booking;

  if (booking.bookingStatus !== 'CONFIRMED') {
    throw new Error('Only confirmed bookings can be rescheduled');
  }

  if (booking.rescheduleCount > BOOKING_RULES.MAX_RESCHEDULES) {
    throw new Error('Maximum reschedule attempts exceeded');
  }

  const oldTravelDate = transferBooking.date;

  const newTravelDate = startOfDay(travelDate);

  if (newTravelDate < new Date()) {
    throw new Error('Invalid date selected');
  }

  return prisma.$transaction(async (tx) => {
    await lockTransferInventory(tx, {
      transferId: transferBooking.transferId,
      travelDate: oldTravelDate,
      scheduleId,
    });

    await releaseTransferInventory(tx, {
      transferId: transferBooking.transferId,
      scheduleId,
      travelDate: oldTravelDate,
      passengers: transferBooking.passengers,
      pricingType: transferBooking.pricingType,
    });

    await ensureTransferInventory(tx, {
      transferId: transferBooking.transferId,
      travelDate: newTravelDate,
      maxPassengers: transferBooking.passengers,
      scheduleId,
    });

    await lockTransferInventory(tx, {
      transferId: transferBooking.transferId,
      travelDate: newTravelDate,
      scheduleId,
    });

    const reservationResult = await reserveTransferInventory(tx, {
      transferId: transferBooking.transferId,
      travelDate: newTravelDate,
      isAdmin,
      passengers: transferBooking.passengers,
      pricingType: transferBooking.pricingType,
      userId,
      scheduleId,
    });

    const resched = await tx.booking.update({
      where: { id: bookingId },
      data: {
        type: 'TRANSFER',
        rescheduleCount: { increment: 1 },
        lastRescheduleDate: new Date(),
        isAdminOverride: reservationResult.hasAdminOverride,
        bookingStatus: isAdmin ? 'CONFIRMED' : 'PENDING',
      },
    });

    await tx.transferBooking.update({
      where: { bookingId },
      data: {
        date: newTravelDate,
        scheduleId: scheduleId ?? null,
      },
    });

    await logBookingAction({
      tx,
      userId,
      role,
      previousValue: booking,
      newValue: resched,
      action: 'RESCHEDULED',
    });

    return resched;
  });
}

export async function cancelTransferBooking({
  bookingId,
  userId,
  role,
}: BookingInputType) {
  const isAdmin = role === 'ADMIN';

  const transferBooking = await findTransferBookingOrThrow({
    bookingId,
    userId,
    role,
  });

  const booking = transferBooking.booking;

  if (booking.bookingStatus !== 'CONFIRMED') {
    throw new Error('Only confirmed bookings can be cancelled');
  }

  if (transferBooking.date < new Date()) {
    throw new Error('Cannot cancel past bookings');
  }

  const cutoff = new Date(
    transferBooking.date.getTime() -
      BOOKING_RULES.RESCHEDULE_CUTOFF_HOURS * 60 * 60 * 1000,
  );

  if (new Date() > cutoff) {
    throw new Error(
      `Cancellations must be made at least ${BOOKING_RULES.RESCHEDULE_CUTOFF_HOURS} hours before the booking start time.`,
    );
  }

  return prisma.$transaction(async (tx) => {
    //cancellation policy for transfer can be implemented here if needed in the future

    await lockTransferInventory(tx, {
      transferId: transferBooking.transferId,
      travelDate: transferBooking.date,
      scheduleId: transferBooking.scheduleId,
    });

    await releaseTransferInventory(tx, {
      transferId: transferBooking.transferId,
      scheduleId: transferBooking.scheduleId,
      travelDate: transferBooking.date,
      passengers: transferBooking.passengers,
      pricingType: transferBooking.pricingType,
    });

    const cancelledBooking = await tx.booking.update({
      where: { id: bookingId },
      data: {
        type: 'TRANSFER',
        bookingStatus: 'CANCELLED',
        cancellationDate: new Date(),
      },
    });

    await logBookingAction({
      tx,
      userId,
      role,
      previousValue: booking,
      newValue: cancelledBooking,
      action: 'CANCELLED',
    });

    return cancelledBooking;
  });
}
