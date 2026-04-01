"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserById = getUserById;
exports.deleteUser = deleteUser;
exports.updateUserRole = updateUserRole;
exports.getAllUsers = getAllUsers;
exports.setProfileImage = setProfileImage;
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const prisma_1 = require("../config/prisma");
async function getUserById(id) {
    return await prisma_1.prisma.user.findUnique({
        where: { id },
    });
}
async function deleteUser(id) {
    return await prisma_1.prisma.user.delete({
        where: { id },
    });
}
async function updateUserRole(id, role) {
    return await prisma_1.prisma.user.update({
        where: { id },
        data: { role },
    });
}
async function getAllUsers(id) {
    return await prisma_1.prisma.user.findMany({
        where: { NOT: { id } },
        include: {
            profileImage: true,
        },
    });
}
async function setProfileImage(userId, imageId) {
    const existing = await prisma_1.prisma.image.findFirst({
        where: {
            userProfile: { id: userId },
            type: 'PROFILE',
            status: 'ACTIVE',
        },
    });
    if (existing) {
        await cloudinary_1.default.uploader.destroy(existing.publicId);
        await prisma_1.prisma.image.delete({ where: { id: existing.id } });
    }
    return prisma_1.prisma.image.update({
        where: { id: imageId },
        data: {
            userProfile: { connect: { id: userId } },
            type: 'PROFILE',
            status: 'ACTIVE',
        },
    });
}
