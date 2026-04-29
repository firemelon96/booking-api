import { Request, Response } from 'express';
import {
  blockDates,
  bulkUpdateCapacity,
  upsertCapacity,
} from '../services/capacity.service';
import { listAllBookings } from '../services/booking.service';
import {
  getAllBookingsParamsSchema,
  getAllTourParamsSchema,
} from '../validators/admin.schema';
// import { adminListAllTours } from '../services/tours/tour.service';

export async function setCapacityController(req: Request, res: Response) {
  const { tourId, date, scheduleId, capacity } = req.body;

  const result = await upsertCapacity({
    tourId,
    date,
    scheduleId,
    capacity,
  });

  res.json(result);
}

export async function bulkCapacityController(req: Request, res: Response) {
  const { tourId, startDate, endDate, capacity } = req.body;

  const result = await bulkUpdateCapacity({
    tourId,
    startDate,
    endDate,
    capacity,
  });

  res.json(result);
}

export async function blockDatesController(req: Request, res: Response) {
  const { tourId, startDate, endDate, scheduleId } = req.body;
  const result = await blockDates({
    startDate,
    endDate,
    tourId,
    scheduleId,
  });

  res.json(result);
}

export async function getAdminBookingsController(req: Request, res: Response) {
  const fields = getAllBookingsParamsSchema.safeParse(req.query);

  if (!fields.success) return res.status(403).json({ error: 'Invalid fields' });

  const bookings = await listAllBookings({
    ...fields.data,
    page: Number(fields.data?.page),
    limit: Number(fields.data?.limit),
    startDate: fields.data?.startDate
      ? new Date(fields.data.startDate)
      : undefined,
    endDate: fields.data?.endDate ? new Date(fields.data.endDate) : undefined,
  });
  res.json(bookings);
}
