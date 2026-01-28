"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = create;
exports.me = me;
const booking_schema_1 = require("../validators/booking.schema");
const boooking_service_1 = require("../services/boooking.service");
async function create(req, res) {
    try {
        if (!req.user?.userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const body = booking_schema_1.createBookingSchema.parse(req.body);
        const booking = await (0, boooking_service_1.createBooking)({
            userId: req.user.userId,
            tourId: body.tourId,
            pricingType: body.pricingType,
            startDate: new Date(body.startDate),
            participants: body.participants,
            endDate: body.endDate ? new Date(body.endDate) : null,
        });
        res.status(201).json(booking);
    }
    catch (err) {
        const msg = String(err?.message || 'Error');
        if (msg.includes('not available')) {
            return res.status(409).json({ error: msg });
        }
        return res.status(400).json({ error: msg });
    }
}
async function me(req, res) {
    try {
        if (!req.user?.userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const bookings = await (0, boooking_service_1.listMyBookings)(req.user.userId);
        return res.json(bookings);
    }
    catch (err) {
        return res.status(400).json({ error: err.message });
    }
}
