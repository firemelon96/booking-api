import { CapacityMode, TourType } from '../../generated/prisma/browser';
import { CreateTourType } from '../../validators/tour.schema';
import { validateNoOverlap } from './pricing/pricing.rule';

export function validateTourRules(input: CreateTourType) {
  const { type, durationDays, itinerary, pricing, capacityMode } = input;

  const pricingType = new Set(pricing.map((p) => p.pricingType));

  if (type === 'DAY') {
    if (durationDays && durationDays > 1) {
      throw new Error('Invalid duration');
    }

    if (itinerary.length > 1) {
      throw new Error('Invalid itinerary for day tour');
    }
  }

  if (type === 'PACKAGE') {
    if (durationDays && durationDays <= 1) {
      throw new Error('Invalid duration');
    }

    if (itinerary.length !== durationDays) {
      throw new Error('Itinerary must match duration');
    }
  }

  if (capacityMode === 'EXCLUSIVE' && pricingType.has('JOINER')) {
    throw new Error('Exclusive tour invalid pricing type');
  }

  if (capacityMode === 'SHARED' && pricingType.has('PRIVATE')) {
    throw new Error('Invalid shared pricing type');
  }

  if (capacityMode === 'MIXED') {
    if (!pricingType.has('JOINER') || !pricingType.has('PRIVATE')) {
      throw new Error('Must include both pricing types');
    }
  }

  validateNoOverlap(pricing);

  if (!itinerary.length && pricing.length > 0) {
    throw new Error('Itinerary required when pricing exists');
  }

  if (itinerary.length && pricing.length === 0) {
    throw new Error('Pricing required when itinerary exists');
  }
}

export function validateBaseTourRules(input: {
  type: TourType;
  durationDays?: number;
  capacityMode: CapacityMode;
}) {
  const { type, durationDays, capacityMode } = input;

  if (type === 'DAY' && durationDays && durationDays > 1) {
    throw new Error('Invalid duration for day tour');
  }

  if (type === 'PACKAGE' && durationDays && durationDays <= 1) {
    throw new Error('Invalid duration for package tour');
  }

  if (!['EXCLUSIVE', 'SHARED', 'MIXED'].includes(capacityMode)) {
    throw new Error('Invalid capacity mode');
  }
}
