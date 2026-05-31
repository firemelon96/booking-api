export function mapTourBooking(booking: any) {
  return {
    id: booking.id,
    reference: booking.reference,
    type: booking.type,
    bookingStatus: booking.bookingStatus,
    paymentStatus: booking.paymentStatus,
    totalPrice: booking.totalPrice,
    createdAt: booking.createdAt,
    payment: booking.payment,
    details: {
      participants: booking.tourBooking?.participants,
      pricingType: booking.tourBooking?.pricingType,
      startDate: booking.tourBooking?.startDate,
      endDate: booking.tourBooking?.endDate,
      tour: booking.tourBooking?.tour,
    },
  };
}

export function mapAccommodationBooking(booking: any) {
  return {
    id: booking.id,
    reference: booking.reference,
    type: booking.type,
    bookingStatus: booking.bookingStatus,
    paymentStatus: booking.paymentStatus,
    totalPrice: booking.totalPrice,
    createdAt: booking.createdAt,
    payment: booking.payment,
    details: {
      checkIn: booking.accommodationBooking?.checkIn,
      checkOut: booking.accommodationBooking?.checkOut,
      nights: booking.accommodationBooking?.nights,
      guests: booking.accommodationBooking?.guests,
      units: booking.accommodationBooking?.units,
      accommodation: booking.accommodationBooking?.accommodation,
      unit: booking.accommodationBooking?.unit,
    },
  };
}

export async function mapTransferBooking(booking: any) {
  return {
    id: booking.id,
    reference: booking.reference,
    type: booking.type,
    bookingStatus: booking.bookingStatus,
    paymentStatus: booking.paymentStatus,
    totalPrice: booking.totalPrice,
    createdAt: booking.createdAt,
    payment: booking.payment,
    details: {
      date: booking.transferBooking?.date,
      passengers: booking.transferBooking?.passengers,
      pricingType: booking.transferBooking?.pricingType,
      pickupLocation: booking.transferBooking?.pickupLocation,
      dropoffLocation: booking.transferBooking?.dropoffLocation,
      transfer: booking.transferBooking?.transfer,
      scheduleId: booking.transferBooking?.scheduleId,
    },
  };
}

export async function mapRentalBooking(booking: any) {
  return {
    id: booking.id,
    reference: booking.reference,
    type: booking.type,
    bookingStatus: booking.bookingStatus,
    paymentStatus: booking.paymentStatus,
    totalPrice: booking.totalPrice,
    createdAt: booking.createdAt,
    payment: booking.payment,
    details: {
      startDate: booking.rentalBooking?.startDate,
      endDate: booking.rentalBooking?.endDate,
      guests: booking.rentalBooking?.guests,
      rental: booking.rentalBooking?.rental,
    },
  };
}
