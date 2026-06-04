import cloudinary from '../../config/cloudinary';
import { prisma } from '../../config/prisma';
import { slugify } from '../../utils/slugify';
import { assignTransferImages } from './images/image.service';
import { validateTransferPricing } from './pricings/pricing.rule';
import { createTransferPricing } from './pricings/pricing.service';
import { addSchedules } from './schedules/schedule.service';
import { transferMapper } from './transfer.mapper';
import {
  findTransferBySlugOrFail,
  findTransferOrThrow,
  throwExistingSlug,
} from './transfer.query';
import {
  CreateTransferInput,
  TransferQueryInput,
  UpdateBaseTransferInput,
} from './transfer.type';

export async function getAllTransferService({
  page = 1,
  search,
  sort = 'createdAt:desc',
  limit = 30,
  pricingMode,
  type,
}: TransferQueryInput) {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(30, limit);
  const skip = (safePage - 1) * safeLimit;

  const [sortField, sortOrder] = sort?.split(':');

  const orderBy = {
    [sortField || 'createdAt']: sortOrder === 'asc' ? 'asc' : 'desc',
  };

  const where: any = {};

  if (type) where.type = type;
  if (pricingMode) where.pricingMode = pricingMode;

  if (search) {
    where.OR = [
      {
        name: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        description: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        origin: {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        destination: {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
      },
    ];
  }

  const [data, total] = await prisma.$transaction([
    prisma.transfer.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy,
      include: {
        origin: {
          select: {
            name: true,
          },
        },
        destination: {
          select: {
            name: true,
          },
        },
        amenities: {
          include: {
            amenity: {
              select: {
                name: true,
              },
            },
          },
        },
        schedules: {
          select: {
            id: true,
            departureTime: true,
            maxPassengers: true,
          },
        },
        pricing: {
          select: {
            maxPassengers: true,
            minPassengers: true,
            price: true,
            pricingType: true,
          },
        },
      },
    }),
    prisma.transfer.count({ where }),
  ]);

  return {
    data: data.map((t) => ({
      id: t.id,
      transferName: t.name,
      slug: t.slug,
      type: t.type,
      origin: t.origin.name,
      destination: t.destination.name,
      hasSchedule: t.hasSchedule,
      amenities: t.amenities.map((a) => a.amenity.name),
      schedules: t.schedules.map((s) => ({
        id: s.id,
        departureTime: s.departureTime,
        maxPassengers: s.maxPassengers,
      })),
      pricing: t.pricing.map((p) => ({
        min: p.minPassengers,
        max: p.maxPassengers,
        price: p.price,
        type: p.pricingType,
      })),
    })),
    meta: {
      total,
      page: safePage,
      pageSize: safeLimit,
      pageCount: Math.ceil(total / safeLimit),
    },
  };
}

export async function getTransferBySlugService(slug: string) {
  const transfer = await findTransferBySlugOrFail(slug);

  return transferMapper(transfer);
}

export async function createdTransferService(
  ownerId: string,
  data: CreateTransferInput,
) {
  const slug = slugify(data.name);

  await throwExistingSlug(slug);

  const {
    imageIds = [],
    amenityIds = [],
    schedules = [],
    pricing = [],
    ...transferData
  } = data;

  if (transferData.hasSchedule && !schedules.length) {
    throw new Error('Schedule is required');
  }

  if (!transferData.hasSchedule && schedules.length) {
    throw new Error('This transfer does not require schedule');
  }

  //location
  if (transferData.originId === transferData.destinationId) {
    throw new Error('Cannot have the same location');
  }

  validateTransferPricing(transferData.pricingMode, pricing);

  return prisma.$transaction(async (tx) => {
    const transfer = await tx.transfer.create({
      data: {
        ownerId,
        slug,
        ...transferData,
      },
    });

    await createTransferPricing(tx, transfer.id, pricing);

    if (transferData.hasSchedule) {
      await addSchedules(tx, transfer.id, schedules);
    }

    await assignTransferImages(tx, transfer.id, imageIds);

    if (amenityIds.length > 0) {
      await tx.transferAmenity.createMany({
        data: amenityIds.map((amenityId) => ({
          transferId: transfer.id,
          amenityId,
        })),
      });
    }

    return transfer;
  });
}

export async function updatedTransferService(
  transferId: string,
  data: UpdateBaseTransferInput,
) {
  const existingTransfer = await findTransferOrThrow(transferId);

  let slug = existingTransfer.slug;

  if (data.name && data.name !== existingTransfer.name) {
    slug = slugify(data.name);

    const slugExist = await prisma.transfer.findUnique({
      where: {
        slug,
      },
    });

    if (slugExist) {
      throw new Error('Slug already exist');
    }
  }

  return prisma.transfer.update({
    where: {
      id: existingTransfer.id,
    },
    data: {
      ...data,
      slug,
    },
  });
}

export async function removedTransferService(transferId: string) {
  const existing = await findTransferOrThrow(transferId);

  //delete images tied to this transfer
  const deletePromise = existing.images.map((img) =>
    cloudinary.uploader.destroy(img.publicId),
  );

  await Promise.all(deletePromise);

  return prisma.transfer.delete({
    where: {
      id: transferId,
    },
  });
}
