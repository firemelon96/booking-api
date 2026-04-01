"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPayment = createPayment;
const prisma_1 = require("../config/prisma");
const xendit_1 = __importDefault(require("../config/xendit"));
async function createPayment(req, res) {
    try {
        const { bookingId } = req.body;
        const booking = await prisma_1.prisma.booking.findUnique({
            where: { id: bookingId },
            include: { tour: true },
        });
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        const invoice = await xendit_1.default.Invoice.createInvoice({
            data: {
                externalId: booking.id,
                amount: booking.totalPrice,
                description: `Payment for booking ${booking.id} - ${booking.tour.name}`,
                invoiceDuration: 3600, // 1 hour,
                currency: 'PHP',
                successRedirectUrl: `${process.env.FRONTEND_URL}/payment-success?bookingId=${booking.id}`,
                failureRedirectUrl: `${process.env.FRONTEND_URL}/payment-failure?bookingId=${booking.id}`,
            },
        });
        if (!invoice.id || !invoice.invoiceUrl) {
            return res
                .status(500)
                .json({ error: 'Failed to create payment invoice' });
        }
        await prisma_1.prisma.payment.create({
            data: {
                bookingId: booking.id,
                xenditInvoiceId: invoice.id,
                invoiceUrl: invoice.invoiceUrl,
            },
        });
        return res.json({ invoiceUrl: invoice.invoiceUrl });
    }
    catch (err) {
        console.error('Error creating payment intent:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}
