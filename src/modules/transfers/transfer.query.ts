import { prisma } from '../../config/prisma';
import { Prisma } from '../../generated/prisma/client';
import { TransferFilterInput } from './transfer.type';

type SortOrder = 'asc' | 'desc';

const ALLOWED_SORT_FIELDS = [
  'createdAt',
  'name',
  'type',
  'pricingMode',
] as const;

type SortField = (typeof ALLOWED_SORT_FIELDS)[number];

export function parseSort(sort?: string): {
  field: SortField;
  order: SortOrder;
} {
  const [rawField, rawOrder] = sort?.split(':') ?? [];

  const field = ALLOWED_SORT_FIELDS.includes(rawField as SortField)
    ? (rawField as SortField)
    : 'createdAt';

  const order: SortOrder = rawOrder === 'asc' ? 'asc' : 'desc';

  return { field, order };
}

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

export function buildTransferWhere({
  pricingMode,
  search,
  type,
}: TransferFilterInput): Prisma.TransferWhereInput {
  return {
    ...(type && { type }),
    ...(pricingMode && { pricingMode }),
    ...(search && {
      OR: [
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
        },
        {
          destination: {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
      ],
    }),
  };
}
