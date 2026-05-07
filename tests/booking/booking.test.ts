import request from 'supertest';
import { createTestApp } from '../test-app';
import { prisma } from '../../src/config/prisma';
import { seedMixedDayTour } from '../../src/seeds/mixed-day';
import { seedShared } from '../../src/seeds/shared';

const app = createTestApp();

describe('Booking flow', () => {
  it('should create a booking', async () => {
    const tour = await prisma.tour.create({
      data: {
        name: 'test tour-2',
        slug: 'test-tour-2',
        description: 'test description',
        location: 'Puerto',
        durationDays: 1,
      },
    });

    const schedule = await prisma.tourScheduleOption.create({
      data: {
        label: 'morning',
        tourId: tour.id,
      },
    });

    const pricing = await prisma.tourPricing.create({
      data: {
        maxGroupSize: 15,
        minGroupSize: 1,
        price: 1240,
        pricingModel: 'PER_PERSON',
        pricingType: 'JOINER',
        tourId: tour.id,
      },
    });

    const res = await request(app).post(`/tours/${tour.id}/booking`).send({
      pricingType: pricing.pricingType,
      participants: 2,
      startDate: '2026-05-10',
      scheduleId: schedule.id,
      notes: 'This is not the note',
    });

    const capacity = await prisma.tourDailyCapacity.findUnique({
      where: {
        tourId_date_scheduleKey: {
          tourId: tour.id,
          date: res.body.startDate,
          scheduleKey: schedule.id || 'NO_SCHEDULE',
        },
      },
    });

    expect(capacity?.date).toBeDefined();
    expect(res.status).toBe(200);
    expect(res.body.participants).toBe(2);
  });

  // it('should not allow overbooking', async () => {
  //   //create tour with capacity of 2
  //   const tour = await seedShared()

  //   await request(app).post(`/tours/${tour.id}/booking`).send({
  //     pricingType: 'JOINER',
  //     participants: 2,
  //     startDate: '2026-05-12',
  //     scheduleId: tour.schedules[0].id,
  //   });

  //   const res = await request(app).post(`/tours/${tour.id}/booking`).send({
  //     pricingType: 'JOINER',
  //     participants: 2,
  //     startDate: '2026-05-12',
  //     scheduleId: tour.schedules[0].id,
  //   });

  //   expect(res.status).toBe(400);
  // });

  // it('should reschedule booking and update capacity', async () => {

  //   const res = await request(app)
  //     .patch('/bookings/bookingId/reschedule')
  //     .send({
  //       startDate: '2026-05-14',
  //     });

  //   expect(res.status).toBe(200);
  //   expect(res.body.startDate).toContain('2026-05-14');
  // });

  // it('should cancel booking and release capacity', async () => {
  //   //create the booking to cancel

  //   const res = await request(app).patch('/bookings/bookingId/cancel');

  //   expect(res.status).toBe(200);
  //   expect(res.body.status).toBe('CANCELLED');
  // });
});
