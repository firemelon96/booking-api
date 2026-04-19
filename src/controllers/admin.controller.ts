import { Request, Response } from 'express';
import {
  blockDates,
  bulkUpdateCapacity,
  upsertCapacity,
} from '../services/capacity.service';
import { listAllBookings } from '../services/booking.service';

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

export async function getAdminBookingsController(req: Request, res: Response) {
  const bookings = await listAllBookings();
  res.json(bookings);
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
