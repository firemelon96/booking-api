import { prisma } from '../../config/prisma';

export async function throwExistingSlug(slug: string) {
  //lookup for the tranfer using slug and trow if exist
  const slugExist = await prisma.transfer.findUnique({
    where: { slug },
  });

  if (slugExist) {
    throw new Error('Transfer already exist');
  }

  return slugExist;
}

export async function findTransferBySlugOrFail(slug: string) {
  const transfer = await prisma.transfer.findUnique({
    where: {
      slug,
    },
    include: {
      destination: true,
      origin: true,
      pricing: true,
      schedules: true,
      images: true,
    },
  });

  if (!transfer) {
    throw new Error('Transfer not found');
  }

  return transfer;
}

export async function findTransferOrThrow(transferId: string) {
  const transfer = await prisma.transfer.findUnique({
    where: {
      id: transferId,
    },
    include: {
      pricing: true,
      schedules: true,
      images: true,
    },
  });

  if (!transfer) {
    throw new Error('Transfer not found');
  }

  return transfer;
}
