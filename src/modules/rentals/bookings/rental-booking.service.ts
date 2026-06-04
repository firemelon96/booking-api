import { eachDayOfInterval } from 'date-fns';
import { Role } from '../../../generated/prisma/enums';
import { normalizeInterval } from '../../../utils/helper';
import { findRentalItemByIdOrFail } from '../items/rental-item.query';
import { RentalItemIdParams } from '../items/rental-item.type';
import { findRentalByIdOrFail } from '../rental.query';
import { CreateRentalBooking } from './rental-booking.type';
import { prisma } from '../../../config/prisma';
import { createUniqueBookingReference } from '../../bookings/booking.query';
import {
  ensureRentalInventory,
  lockRentalInventory,
  reserveRentalInventory,
} from '../inventories/rental-inventory.service';
import {
  createInitialBookingPayment,
  createPaymentTransaction,
} from '../../bookings/payment/payment.query';
import { logBookingAction } from '../../bookings/audit/booking-audit.service';
import { calculateRentalPrice } from '../pricings/rental-pricing.query';

export async function createRentalBookingService(
  userId: string,
  role: Role,
  { itemId, rentalId }: RentalItemIdParams,
  {
    endDate,
    pricingType,
    quantity,
    startDate,
    notes,
    pickupLocation,
    returnLocation,
  }: CreateRentalBooking,
) {
  const isAdmin = role === 'ADMIN';

  const rental = await findRentalByIdOrFail(rentalId);
  const rentalItem = await findRentalItemByIdOrFail(itemId);

  if (rentalItem.rentalId !== rental.id) {
    throw new Error('Rental item does not belong to the specified rental');
  }

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  const interval = normalizeInterval(startDate, endDate);

  const dates = eachDayOfInterval(interval);

  return prisma.$transaction(async (tx) => {
    const reference = await createUniqueBookingReference(tx);

    await ensureRentalInventory(tx, { itemId: rentalItem.id, dates, quantity });

    await lockRentalInventory(tx, { itemId: rentalItem.id, dates });

    const reserveResult = await reserveRentalInventory(tx, {
      itemId: rentalItem.id,
      dates,
      isAdmin,
      userId,
      quantity,
    });

    const totalPrice = calculateRentalPrice({
      rentalItem,
      pricingType,
      quantity,
      startDate: interval.start,
      endDate: interval.end,
    });

    const booking = await tx.booking.create({
      data: {
        reference,
        type: 'RENTAL',
        totalPrice,
        isAdminOverride: reserveResult.hasAdminOverride,
        userId,
        expiresAt,
        bookingStatus: isAdmin ? 'CONFIRMED' : 'PENDING',
        paymentStatus: isAdmin ? 'PAID' : 'PENDING',
        paidAmount: isAdmin ? totalPrice : 0,
        remainingBalance: isAdmin ? 0 : totalPrice,
      },
    });

    await tx.rentalBooking.create({
      data: {
        bookingId: booking.id,
        rentalItemId: rentalItem.id,
        startDate,
        endDate,
        pickupLocation,
        returnLocation,
        pricingType,
        hasOverbooking: reserveResult.hasOverbooking,
        quantity,
      },
    });

    let paymentTransaction = null;

    if (!isAdmin) {
      paymentTransaction = await createInitialBookingPayment(tx, {
        amount: totalPrice,
        bookingId: booking.id,
        type: 'INITIAL_PAYMENT',
      });
    } else {
      paymentTransaction = await createPaymentTransaction({
        tx,
        type: 'MANUAL_ADJUSTMENT',
        amount: totalPrice,
        paymentStatus: 'PAID',
        bookingId: booking.id,
        description: 'Admin offline booking payment',
      });
    }

    await logBookingAction({
      tx,
      userId,
      role,
      newValue: booking,
      action: 'CREATED',
    });

    return {
      booking,
      payment: paymentTransaction
        ? {
            paymentStatus: paymentTransaction.paymentStatus,
            invoiceUrl: paymentTransaction.invoiceUrl,
            amount: paymentTransaction.amount,
          }
        : null,
    };
  });
}
