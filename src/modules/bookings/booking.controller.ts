import { Request, Response, NextFunction } from 'express';
import {
  bookingDetailsSchema,
  bookingQuerySchema,
  cancelBookingSchema,
  createBookingSchema,
  reschedulBookingSchema,
} from './booking.validators';
import {
  cancelbooked,
  detailedBooking,
  getAllBookings,
  getBookingByReference,
  rescheduleBooking,
} from './booking.service';
import { createBooking } from '../tours/booking/tour-booking.service';

export async function listAllBookings(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    throw new Error('Unauthorized');
  }

  const input = {
    userId: req.user.userId,
    role: req.user.role,
    ...req.query,
  };

  const payload = bookingQuerySchema.safeParse(input);

  if (!payload.success) {
    throw new Error('Invalid fields');
  }

  try {
    const results = await getAllBookings(payload.data);

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

  const inputs = {
    ...req.body,
    role: req.user.role,
    userId: req.user.userId,
  };

  const payload = createBookingSchema.safeParse(inputs);

  if (!payload.success) {
    throw new Error('Invalid fields');
  }

  try {
    const booking = await createBooking(payload.data);

    res.json(booking);
  } catch (error) {
    next(error);
  }
}

export async function userCreateBooking(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    throw new Error('Unauthorized');
  }

  const inputs = {
    ...req.body,
    userId: req.user.userId,
    tourId: req.params.tourId,
    role: req.user.role,
  };

  const payload = createBookingSchema.safeParse(inputs);

  if (!payload.success) {
    throw new Error('Invalid fields');
  }

  try {
    const booking = await createBooking(payload.data);

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

  const inputs = {
    ...req.params,
    ...req.body,
    userId: req.user.userId,
    role: req.user.role,
  };

  const payload = reschedulBookingSchema.safeParse(inputs);

  if (!payload.success) {
    throw new Error('Invalid fields');
  }

  try {
    const booking = await rescheduleBooking(payload.data);

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

  const payload = cancelBookingSchema.safeParse(input);

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

  const payload = bookingDetailsSchema.safeParse(input);

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
    throw new Error('Provide the booking reference');
  }

  try {
    const bookingReference = await getBookingByReference(reference);
    res.json(bookingReference);
  } catch (error) {
    next(error);
  }
}
