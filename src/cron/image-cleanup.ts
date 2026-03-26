import cron from 'node-cron';
import { prisma } from '../config/prisma';
import cloudinary from '../config/cloudinary';

export function startImageCleanupJob() {
  //run every hour
  cron.schedule('0 * * * *', async () => {
    console.log('Running image cleanup job...');

    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      //find TEMP images older than 1 hour
      const oldTemps = await prisma.image.findMany({
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
      await Promise.all(
        oldTemps.map((img) => cloudinary.uploader.destroy(img.publicId)),
      );

      //delete from DB
      await prisma.image.deleteMany({
        where: {
          id: { in: oldTemps.map((img) => img.id) },
        },
      });

      console.log('Delete TEMP images');
    } catch (error) {
      console.error('Cleanup failed', error);
    }
  });
}
