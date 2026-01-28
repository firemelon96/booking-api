import { Request, Response } from 'express';
import { createBookingSchema } from '../validators/booking.schema';
import { createBooking, listMyBookings } from '../services/boooking.service';

export async function create(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const body = createBookingSchema.parse(req.body.body);

    const booking = await createBooking({
      userId: req.user.userId,
      tourId: body.tourId,
      pricingType: body.pricingType,
      startDate: new Date(body.startDate),
      participants: body.participants,
      endDate: body.endDate ? new Date(body.endDate) : null,
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

export async function me(req: Request, res: Response) {
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
