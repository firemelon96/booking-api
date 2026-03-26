import { prisma } from '../config/prisma';
import { ImageType } from '../generated/prisma/enums';

export async function uploadImageService(
  files: Express.Multer.File[],
  type: ImageType,
) {
  return Promise.all(
    files.map((file) =>
      prisma.image.create({
        data: {
          url: file.path,
          publicId: file.filename,
          type: type || 'TOUR',
          status: 'TEMP',
        },
      }),
    ),
  );
}
