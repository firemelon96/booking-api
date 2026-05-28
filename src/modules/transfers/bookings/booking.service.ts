import { prisma } from '../../../config/prisma';
import { Role } from '../../../generated/prisma/enums';
import { createUniqueBookingReference } from '../../bookings/booking.query';
import { logAdminWarning } from '../../logs/admin-warning.service';
import {
  ensureTransferInventory,
  lockTransferInventory,
  reserveTransferInventory,
} from '../inventories/inventory.service';
import { findTransferOrThrow } from '../transfer.query';
import { TransferBookingInput } from './booking.type';

export async function createTransferBookingService(
  transferId: string,
  userId: string,
  role: Role,
  data: TransferBookingInput,
) {
  const isAdmin = role === 'ADMIN';

  const transfer = await findTransferOrThrow(transferId);

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  if (data.travelDate < new Date()) {
    throw new Error('Invalid date selected');
  }

  let selectedSchedule = null;

  if (data.pricingType === 'JOINER') {
    if (!data.scheduleId) {
      throw new Error('Schedule is required for joiner booking.');
    }

    selectedSchedule = transfer.schedules.find(
      (schedule) => schedule.id === data.scheduleId,
    );

    if (!selectedSchedule) {
      throw new Error('Transfer schedule not found');
    }
  }

  const selectedPricing = transfer.pricing.find(
    (pricing) => pricing.pricingType === data.pricingType,
  );

  if (!selectedPricing) {
    throw new Error('Transfer pricing not found');
  }

  const maxPassengers =
    transfer.maxPassengers ?? selectedPricing.maxPassengers ?? null;

  return prisma.$transaction(async (tx) => {
    const reference = await createUniqueBookingReference(tx);

    if (maxPassengers && data.passengers > maxPassengers) {
      if (!isAdmin) {
        throw new Error('Passenger limit exceeds');
      }

      await logAdminWarning({
        tx,
        actionType: 'EXCEED_CAPACITY',
        message: `Admin exceeds maximum passenger seat`,
        actorId: userId,
        transferId: transfer.id,
        metadata: {
          passengers: data.passengers,
          maxPassengers,
        },
      });
    }

    let totalPrice = 0;

    if (data.pricingType === 'JOINER') {
      totalPrice = Number(selectedPricing.price) * data.passengers;
    } else {
      totalPrice = Number(selectedPricing.price);
    }

    await ensureTransferInventory(tx, {
      transferId: transfer.id,
      travelDate: data.travelDate,
      maxPassengers,
      scheduleId: data.scheduleId,
    });

    await lockTransferInventory(tx, {
      transferId: transfer.id,
      travelDate: data.travelDate,
    });

    const reservationResult = await reserveTransferInventory(tx, {
      transferId,
    });
  });
}
