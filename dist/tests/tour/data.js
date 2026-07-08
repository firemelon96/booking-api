"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pricing = exports.itinerary = exports.tour = void 0;
exports.tour = {
    name: 'Test tour',
    description: 'Test description',
    type: 'PACKAGE',
    capacityMode: 'MIXED',
    location: 'Puerto',
    inclusions: ['Food', 'Suppliment'],
    exclusions: ['Expenses', 'Money'],
    durationDays: 2,
};
exports.itinerary = [
    {
        dayNumber: 1,
        items: {
            time: 'Test time',
            title: 'Test titel',
            order: 1,
            description: 'test desc',
        },
        title: 'Beach',
    },
    {
        dayNumber: 2,
        items: {
            time: 'Test time 2',
            title: 'Test titel 2',
            order: 1,
            description: 'test desc',
        },
        title: 'Beach 2',
    },
];
exports.pricing = [
    {
        pricingType: 'JOINER',
        minGroupSize: 1,
        maxGroupSize: 12,
        price: 1400,
        pricingModel: 'PER_PERSON',
    },
    {
        pricingType: 'PRIVATE',
        minGroupSize: 1,
        maxGroupSize: 3,
        price: 10400,
        pricingModel: 'PER_GROUP',
    },
    {
        pricingType: 'PRIVATE',
        minGroupSize: 4,
        maxGroupSize: 8,
        price: 12400,
        pricingModel: 'PER_GROUP',
    },
    {
        pricingType: 'PRIVATE',
        minGroupSize: 9,
        maxGroupSize: 12,
        price: 15400,
        pricingModel: 'PER_GROUP',
    },
];
