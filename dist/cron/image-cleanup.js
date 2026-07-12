"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startImageCleanupJob = startImageCleanupJob;
const node_cron_1 = __importDefault(require("node-cron"));
const prisma_1 = require("../config/prisma");
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
function startImageCleanupJob() {
    //run every hour
    node_cron_1.default.schedule('0 * * * *', async () => {
        console.log('Running image cleanup job...');
        try {
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            //find TEMP images older than 1 hour
            const oldTemps = await prisma_1.prisma.image.findMany({
                where: {
                    status: 'TEMP',
                    createdAt: {
                        lt: oneHourAgo,
                    },
                },
            });
            if (oldTemps.length === 0) {
                console.log('No TEMP image to clean');
            }
            //delete from cloudinary
            await Promise.all(oldTemps.map((img) => cloudinary_1.default.uploader.destroy(img.publicId)));
            //delete from DB
            await prisma_1.prisma.image.deleteMany({
                where: {
                    id: { in: oldTemps.map((img) => img.id) },
                },
            });
            console.log('Delete TEMP images');
        }
        catch (error) {
            console.error('Cleanup failed', error);
        }
    });
}
