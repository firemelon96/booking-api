import { slugify } from '../../utils/slugify';
import { findTransferOrThrow, throwExistingSlug } from './transfer.query';
import { CreateTransferInput } from './transfer.type';

export async function createdTransferService(data: CreateTransferInput) {
  const slug = slugify(data.name);

  await throwExistingSlug(slug);

  //create the transfer and all the other table required
}

export async function updatedTransferService(transferId: string) {
  await findTransferOrThrow(transferId);

  //create the transfer and all the other table required
}

export async function removedTransferService(transferId: string) {
  await findTransferOrThrow(transferId);
}
