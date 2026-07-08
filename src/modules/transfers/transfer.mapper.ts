export function transferMapper(transfer: any) {
  return {
    name: transfer.name,
    slug: transfer.slug,
    description: transfer.description,
    origin: transfer.origin.name,
    destination: transfer.destination.name,
    priceMode: transfer.pricingMode,
    maxPassengers: transfer.maxPassengers,
    price: transfer.basePrice,
    schedules: transfer.hasSchedule
      ? transfer.schedules.map((s: any) => ({
          departureTime: s.departureTime,
          maxPassengers: s.maxPassengers,
          active: s.isActive,
        }))
      : [],
    pricing:
      transfer.pricing.map((p: any) => ({
        type: p.pricingType,
        price: p.price,
        min: p.minPassengers,
        max: p.maxPassengers,
      })) ?? [],
  };
}
