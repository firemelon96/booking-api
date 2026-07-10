"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.xenditWebhook = xenditWebhook;
const xendit_service_1 = require("./xendit.service");
async function xenditWebhook(req, res, next) {
    const body = req.body; //TODO get the xendit body type from dashboard
    const signature = req.headers['x-callback-token'];
    if (!body || !signature) {
        throw new Error('Invalid fields');
    }
    try {
        await (0, xendit_service_1.xenditPayment)(signature, body.id, body.status);
        return res.json({ message: 'Webhook processed successfully' });
    }
    catch (error) {
        next(error);
    }
}
