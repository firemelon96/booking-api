"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPayment = createPayment;
const payment_service_1 = require("./payment.service");
const payment_validator_1 = require("./payment.validator");
async function createPayment(req, res, next) {
    if (!req.user) {
        throw new Error('Unauthorized');
    }
    const input = {
        bookingId: req.params.bookingId,
        userId: req.user.userId,
    };
    const payload = payment_validator_1.createPaymentSchema.safeParse(input);
    if (!payload.success) {
        throw new Error('Invalide fields');
    }
    try {
        const payment = await (0, payment_service_1.createPaymentIntent)(payload.data);
        return res.json({ invoiceUrl: payment.invoiceUrl });
    }
    catch (error) {
        next(error);
    }
}
