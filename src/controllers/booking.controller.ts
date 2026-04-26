import { Request, Response } from 'express';
import {
  createBookingSchema,
  getMyBookingsParams,
  rescheduleBookingSchema,
} from '../validators/booking.schema';
import {
  createNewBooking,
  getBookingById,
  listMyBookings,
  rescheduleBooking,
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
  const isAdmin = req.user?.role === 'ADMIN';

  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const fields = getMyBookingsParams.safeParse(req.query);

    if (!fields.success) {
      return res.status(400).json({ error: 'Invalid fields' });
    }

    const bookings = await listMyBookings({
      ...fields.data,
      userId: req.user.userId,
      startDate: fields.data.startDate
        ? new Date(fields.data.startDate)
        : undefined,
      endDate: fields.data.endDate ? new Date(fields.data.endDate) : undefined,
      page: Number(fields.data.page),
      limit: Number(fields.data.limit),
    });
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

export async function reschedule(req: Request, res: Response) {
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

    const updatedBooking = await rescheduleBooking({
      ...body,
      userId,
      bookingId,
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
