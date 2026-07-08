import { groupBy } from 'lodash';
import { TransferPricingMode } from '../../../generated/prisma/enums';
import { TransferPricingInput } from './pricing.type';

export function validateTransferPricing(
  mode: TransferPricingMode,
  pricing: TransferPricingInput[],
) {
  if (!pricing.length) {
    throw new Error('Pricing is required');
  }

  const pricingSet = new Set(pricing.map((p) => p.pricingType));

  if (mode === 'EXCLUSIVE' && pricingSet.has('JOINER')) {
    throw new Error('Joiner pricing is not valid');
  }

  if (mode === 'SHARED' && pricingSet.has('PRIVATE')) {
    throw new Error('Private pricing is not valid');
  }

  const grouped = groupBy(pricing, 'pricingType');

  for (const [type, ranges] of Object.entries(grouped)) {
    const sorted = [...ranges].sort(
      (a, b) => a.minPassengers - b.minPassengers,
    );

    if (sorted[0].minPassengers !== 1) {
      throw new Error(`${type} pricing must start from 1`);
    }

    for (let i = 0; i < sorted.length; i++) {
      const current = sorted[i];

      if (current.minPassengers > current.maxPassengers) {
        throw new Error(
          `${type}: Invalid range ${current.minPassengers}=${current.maxPassengers}`,
        );
      }

      if (current.price <= 0) {
        throw new Error(`${type}: Price must be greater than 0`);
      }

      if (i === 0) continue;

      const prev = sorted[i - 1];

      if (current.minPassengers <= prev.maxPassengers) {
        throw new Error(
          `${type}: Overlap between ${prev.minPassengers}-${prev.maxPassengers} and ${current.minPassengers}-${current.maxPassengers}`,
        );
      }

      if (current.minPassengers !== prev.maxPassengers + 1) {
        throw new Error(
          `${type}: Gap between ${prev.maxPassengers} and ${current.minPassengers}`,
        );
      }
    }
  }
}
