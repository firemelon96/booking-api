export function mapTourBooking(booking: any) {
  return {
    id: booking.id,
    reference: booking.reference,
    type: booking.type,
    bookingStatus: booking.bookingStatus,
    paymentStatus: booking.paymentStatus,
    totalPrice: booking.totalPrice,
    payment: booking.payment,
    details: {
      name: booking.tourBooking?.tour.name,
      participants: booking.tourBooking?.participants,
      pricingType: booking.tourBooking?.pricingType,
      startDate: booking.tourBooking?.startDate,
      endDate: booking.tourBooking?.endDate,
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
      name: `${booking.accommodationBooking?.accommodation.name} ${booking.accommodationBooking?.accommodation.hasUnits ? booking.accommodationBooking?.unit.name : ''}`,
      request: booking.accommodationBooking?.specialRequest,
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
      name: booking.transferBooking?.transfer.name,
      travelDate: booking.transferBooking?.date,
      passengers: booking.transferBooking?.passengers,
      pricingType: booking.transferBooking?.pricingType,
      pickupLocation: booking.transferBooking?.pickupLocation,
      dropoffLocation: booking.transferBooking?.dropoffLocation,
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
      name: booking.rentalBooking?.item.name,
      pickupLocation: booking.rentalBooking?.pickupLocation,
      returnLocation: booking.rentalBooking?.returnLocation,
      notes: booking.rentalBooking?.notes,
      quantity: booking.rentalBooking?.quantity,
    },
  };
}
