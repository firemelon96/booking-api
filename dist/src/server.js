"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const image_cleanup_1 = require("./cron/image-cleanup");
app_1.default.listen(env_1.env.PORT, () => {
    console.log(`Server running on Port ${env_1.env.PORT}`);
});
(0, image_cleanup_1.startImageCleanupJob)();
// expirePendingBooking();
