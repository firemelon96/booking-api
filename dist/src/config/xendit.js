"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const xendit_node_1 = require("xendit-node");
const xendit = new xendit_node_1.Xendit({
    secretKey: process.env.XENDIT_SECRET_KEY || '',
});
exports.default = xendit;
