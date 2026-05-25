import { prisma } from '../../config/prisma';

export async function throwExistingSlug(slug: string) {
  //lookup for the tranfer using slug and trow if exist
  if (slug) throw new Error('Exist');

  return slug;
}

export async function findTransferOrThrow(transferId: string) {}
