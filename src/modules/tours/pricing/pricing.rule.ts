import { groupBy } from 'lodash';
import { PricingType } from './pricing.type';
import { CapacityMode } from '../../../generated/prisma/enums';

export function validatePricingRules(
  capacityMode: CapacityMode,
  pricing: PricingType[],
) {
  if (!pricing.length) {
    throw new Error('Pricing is required');
  }

  // capacity validation check
  const pricingType = new Set(pricing.map((p) => p.pricingType));

  if (capacityMode === 'EXCLUSIVE' && pricingType.has('JOINER')) {
    throw new Error('Only private type is valid for exclusive tour');
  }

  if (capacityMode === 'SHARED' && pricingType.has('PRIVATE')) {
    throw new Error('Only joiner type is valid for shared tour');
  }

  if (capacityMode === 'MIXED') {
    if (!pricingType.has('JOINER') || !pricingType.has('PRIVATE')) {
      throw new Error('Must include both joiner and private price.');
    }
  }
  //overlap check
  const grouped = groupBy(pricing, 'pricingType');

  for (const [type, ranges] of Object.entries(grouped)) {
    const sorted = [...ranges].sort((a, b) => a.minGroupSize - b.minGroupSize);

    if (sorted[0].minGroupSize !== 1) {
      throw new Error(`${type} pricing must start from group size 1`);
    }

    for (let i = 0; i < sorted.length; i++) {
      const current = sorted[i];

      //invalid range
      if (current.minGroupSize > current.maxGroupSize) {
        throw new Error(
          `${type}: Invalid range ${current.minGroupSize}=${current.maxGroupSize}`,
        );
      }

      //invalid price
      if (current.price <= 0) {
        throw new Error(`${type}: Price must be greater than 0`);
      }

      if (i === 0) continue;

      const prev = sorted[i - 1];

      //overlap
      if (current.minGroupSize <= prev.maxGroupSize) {
        throw new Error(
          `${type}: Overlap between ${prev.minGroupSize}-${prev.maxGroupSize} and ${current.minGroupSize}-${current.maxGroupSize}`,
        );
      }

      //gap
      if (current.minGroupSize !== prev.maxGroupSize + 1) {
        throw new Error(
          `${type}: Gap between ${prev.maxGroupSize} and ${current.minGroupSize}`,
        );
      }
    }
  }
}
