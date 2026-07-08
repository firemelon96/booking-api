import z from 'zod';
import { AdminAction } from '../../generated/prisma/enums';

export const adminWarningSchema = z.object({
  actionType: z.enum(AdminAction),
  message: z.string(),
  tourId: z.uuid().optional(),
  bookingId: z.string().optional(),
  actorId: z.uuid(),
  metadata: z.any(),
  accommodationId: z.uuid().optional(),
  unitId: z.uuid().optional(),
  rentalId: z.uuid().optional(),
  transferId: z.uuid().optional(),
});
