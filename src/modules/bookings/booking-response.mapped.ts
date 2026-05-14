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
