import { Request, Response, NextFunction } from 'express';
import {
  bookingIdParams,
  bookingQuerySchema,
  bookingSchema,
  reschedulBookingSchema,
} from './booking.validators';
import {
  cancelbooked,
  detailedBooking,
  getAllBookingsService,
  getBookingByReference,
  rescheduleBooking,
} from './booking.service';
import { createTourBooking } from '../tours/booking/tour-booking.service';
import { createTourBookingSchema } from '../tours/booking/tour-booking-validator';

export async function listAllBookings(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    throw new Error('Unauthorized');
  }

  const payload = bookingQuerySchema.safeParse(req.query);

  if (!payload.success) {
    throw new Error('Invalid fields');
  }

  try {
    const results = await getAllBookingsService(
      req.user.userId,
      req.user.role,
      payload.data,
    );

    res.json(results);
  } catch (error) {
    next(error);
  }
}

export async function adminCreateBooking(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    throw new Error('Unauthorized');
  }

  const { tourId, ...rest } = req.body;

  if (!tourId) {
    throw new Error('Tour id must be provided');
  }

  //should accept both tour and accoms
  const payload = createTourBookingSchema.safeParse(rest);

  if (!payload.success) {
    throw new Error('Invalid fields');
  }

  try {
    const booking = await createTourBooking(
      tourId,
      req.user.userId,
      req.user.role,
      payload.data,
    );

    res.json(booking);
  } catch (error) {
    next(error);
  }
}

export async function reschedBooking(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    throw new Error('Unauthorized');
  }

  const params = bookingIdParams.safeParse(req.params);

  if (!params.success) {
    throw new Error('Invalid params');
  }

  const payload = reschedulBookingSchema.safeParse(req.body);

  if (!payload.success) {
    throw new Error('Invalid fields');
  }

  try {
    const booking = await rescheduleBooking(
      params.data.bookingId,
      req.user.userId,
      req.user.role,
      payload.data,
    );

    res.json(booking);
  } catch (error) {
    next(error);
  }
}

export async function cancelBooking(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    throw new Error('Unauthorized');
  }

  const input = {
    bookingId: req.params.bookingId,
    userId: req.user.userId,
    role: req.user.role,
  };

  const payload = bookingSchema.safeParse(input);

  if (!payload.success) {
    throw new Error('Invalid fields');
  }

  try {
    await cancelbooked(payload.data);

    return res.json({ success: true, message: 'Cancelled successfully.' });
  } catch (error) {
    next(error);
  }
}

export async function bookingDetail(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    throw new Error('Unauthorized');
  }

  const input = {
    ...req.params,
    userId: req.user.userId,
    role: req.user.role,
  };

  const payload = bookingSchema.safeParse(input);

  if (!payload.success) {
    throw new Error('Invalid fields');
  }

  try {
    const booking = await detailedBooking(payload.data);

    return res.json(booking);
  } catch (error) {
    next(error);
  }
}

export async function referenceBooking(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { reference } = req.body;

  if (!reference) {
    throw new Error('provide reference');
  }

  try {
    const bookingReference = await getBookingByReference(reference);
    res.json(bookingReference);
  } catch (error) {
    next(error);
  }
}
