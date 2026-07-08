"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const prisma_1 = require("../src/config/prisma");
dotenv_1.default.config({ path: '.env.test' });
beforeAll(async () => {
    await prisma_1.prisma.$connect();
});
beforeEach(async () => {
    // await prisma.session.deleteMany();
    // await prisma.account.deleteMany();
    // await prisma.emailVerificationToken.deleteMany();
    // await prisma.passwordResetToken.deleteMany();
    // await prisma.user.deleteMany();
    await prisma_1.prisma.booking.deleteMany();
    // await prisma.tourDailyCapacity.deleteMany();
    // await prisma.tourAvailability.deleteMany();
    await prisma_1.prisma.itinerary.deleteMany();
    await prisma_1.prisma.tourPricing.deleteMany();
    await prisma_1.prisma.tour.deleteMany();
    await prisma_1.prisma.tourDailyCapacity.deleteMany();
    await prisma_1.prisma.tourAvailability.deleteMany();
    await prisma_1.prisma.tourScheduleOption.deleteMany();
});
afterAll(async () => {
    await prisma_1.prisma.$disconnect();
});
