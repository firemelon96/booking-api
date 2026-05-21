import { eachDayOfInterval } from 'date-fns';
import { normalizeInterval } from '../../../utils/helper';
import {
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
  const interval = normalizeInterval(startDate, endDate);
  const tour = await findTourOrFail(tourId);

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

  validateBookingRules({
    scheduleId: scheduleId ?? null,
    participants,
    durationDays: tour.durationDays ?? undefined,
    schedules: tour.schedules,
    interval,
  });

  const dates = eachDayOfInterval(interval);

  return prisma.$transaction(async (tx) => {
    const reference = await createUniqueBookingReference(tx);

    await checkAvailability({ tx, tourId, dates, role, userId });

    if (role === 'USER') {
      await lockCapacityRows(tx, {
        tourId,
        dates,
        scheduleKey: scheduleId ?? 'NO_SCHEDULE',
      });
    }

    const capacityContext = await prepareCapacity({
      tx,
      tourId,
      scheduleId: scheduleId ?? null,
      joinerCapacity: tour.joinerCapacity,
      dates,
    });

    const { hasOverbooking, hasConflict } = await reserveCapacity({
      tx,
      capacityMode: tour.capacityMode,
      dates,
      participants,
      ctx: capacityContext,
      pricingType,
      role,
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
        totalPrice: totalPrice,
        isAdminOverride: role === 'ADMIN',
        expiresAt,
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
  payload: TourReschedPayload,
) {
  const { newStartDate, newEndDate, scheduleId } = payload;
  const tourBooking = await findTourBookingOrThrow({
    bookingId,
    role,
    userId,
  });

  const newInterval = normalizeInterval(newStartDate, newEndDate);

  const { datesToRelease, datesToReserve } = validateRescheduleRules(
    tourBooking,
    newInterval,
  );

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
      scheduleKey: scheduleId ?? 'NO_SCHEDULE',
    });

    await releaseCapacity({
      tx,
      dates: datesToRelease,
      participants: tourBooking.participants,
      scheduleId,
      tourId: tourBooking.tourId,
    });

    const capacityContext = await prepareCapacity({
      tx,
      tourId: tourBooking.tourId,
      scheduleId: scheduleId ?? null,
      joinerCapacity: tourBooking.tour.joinerCapacity ?? 0,
      dates: datesToReserve,
    });

    await lockCapacityRows(tx, {
      tourId: tourBooking.tourId,
      dates: datesToReserve,
      scheduleKey: scheduleId ?? 'NO_SCHEDULE',
    });

    const { hasOverbooking } = await reserveCapacity({
      tx,
      capacityMode: tourBooking.tour.capacityMode,
      dates: datesToReserve,
      participants: tourBooking.participants,
      ctx: capacityContext,
      pricingType: tourBooking.pricingType,
      role,
      userId,
    });

    const resched = await tx.booking.update({
      where: { id: bookingId },
      data: {
        type: 'TOUR',
        rescheduleCount: { increment: 1 },
        lastRescheduleDate: new Date(),
        isAdminOverride: role === 'ADMIN',
      },
    });

    await tx.tourBooking.update({
      where: { bookingId },
      data: {
        startDate: newInterval.start,
        endDate: newInterval.end,
        isOverbooked: hasOverbooking,
        scheduleId: scheduleId ?? null,
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

    if (!policy) {
      throw new Error('Policy not found');
    }

    const { refundAmount, refundPercentage, refundType } =
      calculateCancellationRefund({
        bookingDate: tourBooking.createdAt,
        tourStartDate: interval.start,
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
        canceledAt: new Date(),
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
