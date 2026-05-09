import { createTestApp } from '../test-app';
import request from 'supertest';

import { prisma } from '../../src/config/prisma';

const app = createTestApp();

describe('Create tour flow', () => {
  it('should create tour with pricing and itinerary', async () => {
    const payload = {
      name: 'Japan Tour',
      description: 'Description tour',
      durationDays: 1,
      location: 'ppc',

      pricing: [
        {
          pricingType: 'JOINER',
          minGroupSize: 1,
          maxGroupSize: 10,
          price: 1500,
          pricingModel: 'PER_PERSON',
        },
        {
          pricingType: 'PRIVATE',
          minGroupSize: 1,
          maxGroupSize: 5,
          price: 15500,
          pricingModel: 'PER_GROUP',
        },
        {
          pricingType: 'PRIVATE',
          minGroupSize: 6,
          maxGroupSize: 10,
          price: 21500,
          pricingModel: 'PER_GROUP',
        },
      ],

      itinerary: [
        {
          dayNumber: 1,
          title: 'Hotel pickup and travel',
          items: [
            {
              time: '8:00 AM - 9:00 AM',
              title: 'Hotel Pickup',
              description:
                'Our friendly guide will pick you up from your hotel in Puerto Princesa.',
              order: 1,
            },
          ],
        },
      ],
    };

    const res = await request(app).post('/tours').send(payload);

    expect(res.status).toBe(201);

    const tour = await prisma.tour.findUnique({
      where: {
        id: res.body.data.id,
      },
      include: {
        pricing: true,
        itinerary: true,
      },
    });

    expect(tour).toBeTruthy();

    expect(tour?.pricing).toBeTruthy();

    expect(tour?.pricing.length).toBe(3);

    expect(tour?.itinerary).toHaveLength(1);
  });
});
