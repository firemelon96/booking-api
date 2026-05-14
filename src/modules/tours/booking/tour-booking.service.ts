import { eachDayOfInterval } from 'date-fns';
import { normalizeInterval } from '../../../utils/helper';
import {
  validateBookingRules,
  validateRescheduleRules,
} from '../../bookings/booking.rule';
import {
  BookingCreateInput,
  BookingReschedInput,
} from '../../bookings/booking.type';
import { findTourOrFail } from '../tour.query';
import { prisma } from '../../../config/prisma';
import {
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

export async function createBooking({
  startDate,
  endDate,
  participants,
  pricingType,
  tourId,
  notes,
  scheduleId,
  userId,
  role,
}: BookingCreateInput) {
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

    await logBookingAction({
      tx,
      userId,
      role,
      newValue: booking,
      action: 'CREATED',
    });

    return { booking, hasConflict };
  });
}

export async function rescheduleTourBooking({
  bookingId,
  newEndDate,
  newStartDate,
  scheduleId,
  userId,
  role,
}: BookingReschedInput) {
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
