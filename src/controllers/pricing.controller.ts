import { Request, Response } from 'express';
import { calculatePricingSchema } from '../validators/pricing.schema';
import { calculateTotalPrice } from '../services/pricing.service';

export async function calculatePricing(req: Request, res: Response) {
  try {
    const data = calculatePricingSchema.parse(req.body);

    const result = await calculateTotalPrice({
      tourId: data.tourId,
      pricingType: data.pricingType,
      participants: data.participants,
    });

    res.json({
      totalPrice: result.totalPrice,
      currency: result.currency,
      matched: {
        id: result.matchedPricing.id,
        PricingType: result.matchedPricing.pricingType,
        minGroupSize: result.matchedPricing.minGroupSize,
        maxGroupSize: result.matchedPricing.maxGroupSize,
        price: result.matchedPricing.price,
        isGroupPrice: result.matchedPricing.isGroupPrice,
      },
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}
