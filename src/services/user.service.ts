import cloudinary from '../config/cloudinary';
import { prisma } from '../config/prisma';
import { Role } from '../generated/prisma/enums';

export async function getUserById(id: string) {
  return await prisma.user.findUnique({
    where: { id },
  });
}

export async function deleteUser(id: string) {
  return await prisma.user.delete({
    where: { id },
  });
}

export async function updateUserRole(id: string, role: Role) {
  return await prisma.user.update({
    where: { id },
    data: { role },
  });
}

export async function getAllUsers(id: string) {
  return await prisma.user.findMany({
    where: { NOT: { id } },
    include: { image: true },
  });
}

export async function setProfileImage(userId: string, imageId: string) {
  const existing = await prisma.image.findFirst({
    where: {
      userId,
      type: 'PROFILE',
      status: 'ACTIVE',
    },
  });

  if (existing) {
    await cloudinary.uploader.destroy(existing.publicId);
    await prisma.image.delete({ where: { id: existing.id } });
  }

  return prisma.image.update({
    where: { id: imageId },
    data: {
      userId,
      type: 'PROFILE',
      status: 'ACTIVE',
    },
  });
}
