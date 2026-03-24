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
  return await prisma.user.findMany({ where: { NOT: { id } } });
}
