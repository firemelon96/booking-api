import { Request, Response } from 'express';
import {
  createBookingSchema,
  rescheduleBookingSchema,
} from '../validators/booking.schema';
import {
  createBooking,
  createNewBooking,
  getBookingById,
  listAllBookings,
  listMyBookings,
  rescheduleExistingBooking,
} from '../services/booking.service';

export async function create(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const body = createBookingSchema.parse(req.body);

    const booking = await createNewBooking({
      ...body,
      userId,
    });

    res.status(201).json(booking);
  } catch (err: any) {
    const msg = String(err?.message || 'Error');

    if (msg.includes('not available')) {
      return res.status(409).json({ error: msg });
    }
    return res.status(400).json({ error: msg });
  }
}

export async function myBookings(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const bookings = await listMyBookings(req.user.userId);
    return res.json(bookings);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
}

export async function adminGetBookings(req: Request, res: Response) {
  try {
    const bookings = await listAllBookings();
    return res.json(bookings);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
}

export async function getBookingDetails(req: Request, res: Response) {
  try {
    const { bookingId } = req.params;

    if (Array.isArray(bookingId) || !bookingId) {
      return res.status(400).json({ error: 'Invalid booking ID' });
    }

    const booking = await getBookingById(bookingId);
    return res.json(booking);
  } catch (err: any) {
    return res.status(404).json({ error: err.message });
  }
}

export async function rescheduleBooking(req: Request, res: Response) {
  try {
    const { bookingId } = req.params;
    const userId = req.user?.userId;

    if (Array.isArray(bookingId) || !bookingId) {
      return res.status(400).json({ error: 'Invalid booking ID' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const body = rescheduleBookingSchema.parse(req.body);

    const updatedBooking = await rescheduleExistingBooking({
      bookingId,
      userId,
      newStartDate: new Date(body.newStartDate),
      newEndDate: body.newEndDate ? new Date(body.newEndDate) : null,
      newScheduleId: body.newScheduleId || null,
      reason: body.reason ?? null,
    });

    return res.json(updatedBooking);
  } catch (err: any) {
    const msg = String(err?.message || 'Error');

    if (msg.includes('not available')) {
      return res.status(409).json({ error: msg });
    }
    return res.status(400).json({ error: msg });
  }
}
