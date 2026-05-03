import { Itinerary } from '../../../generated/prisma/client';
import { CapacityMode, TourType } from '../../../generated/prisma/enums';
import { PricingType } from '../pricing/pricing.type';
import { CreateTourType } from '../tour.type';
import { ItineraryType } from './itinerary.type';

export function validateItineraryRules(
  type: TourType,
  itinerary: ItineraryType,
  duration: number,
) {
  if (!itinerary) {
    throw new Error('Itinerary is required');
  }

  if (type === 'DAY') {
    if (itinerary.length > 1) {
      throw new Error('Invalid number of itinerary for day tour');
    }
  }

  if (type === 'PACKAGE') {
    if (itinerary.length <= 1) {
      throw new Error('Invalid number of itinerary for package tour');
    }

    if (itinerary.length !== duration) {
      throw new Error('Cannot exceed the duration');
    }
  }
}
