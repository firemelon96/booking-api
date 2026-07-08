import { eachDayOfInterval } from 'date-fns';
import { normalizeInterval } from '../../../utils/helper';
import {
  BOOKING_RULES,
  validateBookingRules,
  validateCancelRules,
  validateRescheduleRules,
} from '../../bookings/booking.rule';
import { findTourOrFail } from '../tour.query';
import { prisma } from '../../../config/prisma';
import {
  calculateCancellationRefund,
  createUniqueBookingReference,
  findTourBookingOrThrow,
} from '../../bookings/booking.query';
import { checkAvailability } from '../availability/availability.query';
import {
  lockCapacityRows,
  prepareCapacity,
  releaseCapacity,
  reserveCapacity,
} from '../capacity/capacity.query';
import { calculate } from '../pricing/pricing.query';
import { logBookingAction } from '../../bookings/audit/booking-audit.service';
import { CancellationRefundType, Role } from '../../../generated/prisma/enums';
import {
  TourBookingCreateInput,
  TourReschedPayload,
} from './tour-booking-types';
import { BookingInputType } from '../../bookings/booking.type';
import {
  createInitialBookingPayment,
  createPaymentTransaction,
} from '../../bookings/payment/payment.query';

export async function createTourBooking(
  tourId: string,
  userId: string,
  role: Role,
  {
    startDate,
    endDate,
    participants,
    pricingType,
    notes,
    scheduleId,
  }: TourBookingCreateInput,
) {
  const isAdmin = role === 'ADMIN';

  const tour = await findTourOrFail(tourId);

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

  const interval = normalizeInterval(startDate, endDate);

  const dates = eachDayOfInterval(interval);

  validateBookingRules({
    scheduleId: scheduleId ?? null,
    participants,
    durationDays: tour.durationDays ?? undefined,
    schedules: tour.schedules,
    interval,
  });

  const capacity =
    pricingType === 'PRIVATE' ? participants : tour.joinerCapacity;

  return prisma.$transaction(async (tx) => {
    const reference = await createUniqueBookingReference(tx);

    await checkAvailability({ tx, tourId, dates, role, userId });

    await prepareCapacity({
      tx,
      tourId,
      scheduleId,
      capacity,
      dates,
    });

    const rows = await lockCapacityRows(tx, {
      tourId,
      dates,
      scheduleId,
    });

    const { hasAdminOverride, hasOverbooking } = await reserveCapacity({
      tx,
      rows,
      capacityMode: tour.capacityMode,
      participants,
      pricingType,
      isAdmin,
      userId,
    });

    const { totalPrice } = await calculate({
      tx,
      tourId,
      pricingType,
      participants,
    });

    const booking = await tx.booking.create({
      data: {
        reference,
        type: 'TOUR',
        userId,
        totalPrice,
        isAdminOverride: hasAdminOverride,
        expiresAt,
        bookingStatus: isAdmin ? 'CONFIRMED' : 'PENDING',
        paymentStatus: isAdmin ? 'PAID' : 'PENDING',
        paidAmount: isAdmin ? totalPrice : 0,
        remainingBalance: isAdmin ? 0 : totalPrice,
      },
    });

    await tx.tourBooking.create({
      data: {
        bookingId: booking.id,
        tourId,
        pricingType,
        participants,
        startDate,
        endDate,
        notes,
        scheduleId,
        isOverbooked: hasOverbooking,
      },
    });

    let paymentTransaction = null;

    if (role !== 'ADMIN') {
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

export async function rescheduleTourBooking(
  bookingId: string,
  userId: string,
  role: Role,
  { newEndDate, newStartDate, scheduleId }: TourReschedPayload,
) {
  const isAdmin = role === 'ADMIN';

  const tourBooking = await findTourBookingOrThrow({
    bookingId,
    role,
    userId,
  });

  const newInterval = normalizeInterval(newStartDate, newEndDate);

  const { datesToRelease, datesToReserve, oldScheduleId } =
    validateRescheduleRules(tourBooking, newInterval);

  return prisma.$transaction(async (tx) => {
    await checkAvailability({
      tx,
      tourId: tourBooking.tourId,
      dates: datesToReserve,
      role,
      userId,
    });

    await lockCapacityRows(tx, {
      tourId: tourBooking.tourId,
      dates: datesToRelease,
      scheduleId: oldScheduleId,
    });

    await releaseCapacity({
      tx,
      dates: datesToRelease,
      participants: tourBooking.participants,
      scheduleId: oldScheduleId,
      tourId: tourBooking.tourId,
    });

    await prepareCapacity({
      tx,
      scheduleId,
      dates: datesToReserve,
      tourId: tourBooking.tourId,
      capacity: tourBooking.participants,
    });

    const rows = await lockCapacityRows(tx, {
      scheduleId,
      dates: datesToReserve,
      tourId: tourBooking.tourId,
    });

    const { hasAdminOverride, hasOverbooking } = await reserveCapacity({
      tx,
      userId,
      isAdmin,
      rows,
      pricingType: tourBooking.pricingType,
      participants: tourBooking.participants,
      capacityMode: tourBooking.tour.capacityMode,
    });

    const resched = await tx.booking.update({
      where: { id: bookingId },
      data: {
        type: 'TOUR',
        rescheduleCount: { increment: 1 },
        lastRescheduleDate: new Date(),
        isAdminOverride: hasAdminOverride,
      },
    });

    await tx.tourBooking.update({
      where: { bookingId },
      data: {
        startDate: newInterval.start,
        endDate: newInterval.end,
        isOverbooked: hasOverbooking,
        scheduleId,
      },
    });

    await logBookingAction({
      tx,
      userId,
      role,
      previousValue: tourBooking,
      newValue: resched,
      action: 'RESCHEDULED',
    });

    return resched;
  });
}

export async function cancelTourbooking({
  bookingId,
  userId,
  role,
}: BookingInputType) {
  const tourBooking = await findTourBookingOrThrow({
    bookingId,
    userId,
    role,
  });

  validateCancelRules({
    existingBooking: tourBooking.booking,
    tourBooking,
  });

  const interval = normalizeInterval(
    tourBooking.startDate,
    tourBooking.endDate,
  );

  const dates = eachDayOfInterval(interval);

  return prisma.$transaction(async (tx) => {
    const policy = await tx.cancellationPolicy.findUnique({
      where: { tourId: tourBooking.tourId },
    });

    const { refundAmount, refundPercentage, refundType } =
      calculateCancellationRefund({
        bookingDate: tourBooking.createdAt,
        startDate: interval.start,
        totalPrice: Number(tourBooking.booking.totalPrice),
        policy,
      });

    await releaseCapacity({
      tx,
      dates,
      participants: tourBooking.participants,
      tourId: tourBooking.tourId,
      scheduleId: tourBooking.scheduleId,
    });

    const cancelled = await tx.booking.update({
      where: { id: bookingId },
      data: {
        type: 'TOUR',
        bookingStatus: 'CANCELLED',
        refundAmount,
        refundStatus: 'PENDING',
        cancelledAt: new Date(),
        cancellationRefundType: refundType as CancellationRefundType,
        cancellationRefundPercentage: refundPercentage,
        isAdminOverride: role === 'ADMIN',
      },
    });

    await logBookingAction({
      tx,
      userId,
      role,
      newValue: cancelled,
      action: 'CANCELLED',
    });

    return cancelled;
  });
}
