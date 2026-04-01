"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTours = listTours;
exports.getTourBySlug = getTourBySlug;
exports.updateTour = updateTour;
exports.createFullTourService = createFullTourService;
exports.deleteTour = deleteTour;
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const prisma_1 = require("../config/prisma");
const lodash_groupby_1 = __importDefault(require("lodash.groupby"));
const slugify_1 = require("../utils/slugify");
function rangesOverlap(aMin, aMax, bMin, bMax) {
    return Math.max(aMin, bMin) <= Math.min(aMax, bMax);
}
async function assertNoOverlap(data) {
    const existing = await prisma_1.prisma.tourPricing.findMany({
        where: {
            tourId: data.tourId,
            pricingType: data.pricingType,
        },
        select: { id: true, minGroupSize: true, maxGroupSize: true },
    });
    const conflict = existing.find((p) => rangesOverlap(data.minGroupSize, data.maxGroupSize, p.minGroupSize, p.maxGroupSize));
    if (conflict) {
        throw new Error(`Pricing range overlaps with the existing range ${conflict.minGroupSize}-${conflict.maxGroupSize}`);
    }
}
function validateNoOverlap(pricing) {
    if (!pricing.length) {
        throw new Error('Pricing is required');
    }
    const grouped = (0, lodash_groupby_1.default)(pricing, 'pricingType');
    for (const [type, ranges] of Object.entries(grouped)) {
        const sorted = [...ranges].sort((a, b) => a.minGroupSize - b.minGroupSize);
        if (sorted[0].minGroupSize !== 1) {
            throw new Error(`${type} pricing must start from group size 1`);
        }
        for (let i = 0; i < sorted.length; i++) {
            const current = sorted[i];
            //invalid range
            if (current.minGroupSize > current.maxGroupSize) {
                throw new Error(`${type}: Invalid range ${current.minGroupSize}=${current.maxGroupSize}`);
            }
            //invalid price
            if (current.price <= 0) {
                throw new Error(`${type}: Price must be greater than 0`);
            }
            if (i === 0)
                continue;
            const prev = sorted[i - 1];
            //overlap
            if (current.minGroupSize <= prev.maxGroupSize) {
                throw new Error(`${type}: Overlap between ${prev.minGroupSize}-${prev.maxGroupSize} and ${current.minGroupSize}-${current.maxGroupSize}`);
            }
            //gap
            if (current.minGroupSize !== prev.maxGroupSize + 1) {
                throw new Error(`${type}: Gap between ${prev.maxGroupSize} and ${current.minGroupSize}`);
            }
        }
    }
}
async function listTours() {
    return prisma_1.prisma.tour.findMany({
        orderBy: [{ name: 'asc' }],
        include: { pricing: true, images: true, itineraries: true },
    });
}
async function getTourBySlug(slug) {
    const tour = await prisma_1.prisma.tour.findUnique({
        where: {
            slug,
        },
        include: { pricing: true },
    });
    if (!tour)
        throw new Error('Tour not found');
    return tour;
}
// export async function createTour(input: {
//   name: string;
//   slug?: string;
//   imageIds: string[];
// }) {
//   const slug = input.slug ? input.slug : slugify(input.name);
//   const exists = await prisma.tour.findUnique({ where: { slug } });
//   if (exists) {
//     throw new Error('Slug already exists');
//   }
//   const tour = await prisma.tour.create({
//     data: {
//       name: input.name,
//       slug,
//     },
//   });
//   await prisma.image.updateMany({
//     where: {
//       id: { in: input.imageIds },
//     },
//     data: {
//       tourId: tour.id,
//       status: 'ACTIVE',
//       type: 'TOUR',
//     },
//   });
//   return tour;
// }
async function updateTour(id, input) {
    const existingTour = await prisma_1.prisma.tour.findUnique({ where: { id } });
    if (!existingTour)
        throw new Error('Tour not found');
    const nextSlug = input.slug ?? (input.name ? (0, slugify_1.slugify)(input.name) : undefined);
    if (nextSlug && nextSlug !== existingTour.slug) {
        const slugExists = await prisma_1.prisma.tour.findUnique({
            where: { slug: nextSlug },
        });
        if (slugExists)
            throw new Error('Slug already exists');
    }
    //get current images
    const currentImages = await prisma_1.prisma.image.findMany({ where: { tourId: id } });
    const currentIds = currentImages.map((img) => img.id);
    //find images to delete
    const toDeleteIds = currentIds.filter((id) => !input.existingImageIds.includes(id));
    const toDeleteImages = currentImages.filter((img) => toDeleteIds.includes(img.id));
    //Delete from cloudinary
    await Promise.all(toDeleteImages.map((img) => cloudinary_1.default.uploader.destroy(img.publicId)));
    //delete from the db
    await prisma_1.prisma.image.deleteMany({
        where: {
            id: {
                in: toDeleteIds,
            },
        },
    });
    //assign the new images
    await prisma_1.prisma.image.updateMany({
        where: { id: { in: input.newImageIds } },
        data: {
            tourId: id,
            status: 'ACTIVE',
            type: 'TOUR',
        },
    });
    //update tours
    try {
        return prisma_1.prisma.tour.update({
            where: { id },
            data: {
                name: input.name ?? undefined,
                slug: nextSlug ?? undefined,
            },
            include: { images: true },
        });
    }
    catch (error) {
        await prisma_1.prisma.image.deleteMany({
            where: {
                id: { in: input.newImageIds },
                status: 'TEMP',
            },
        });
    }
}
async function createFullTourService(data) {
    const { name, 
    // description,
    // address,
    // exclusions,
    // inclusions,
    imageIds, itineraries, pricing, } = data;
    const slug = (0, slugify_1.slugify)(name);
    const exists = await prisma_1.prisma.tour.findUnique({ where: { slug } });
    if (exists) {
        throw new Error('Tour already exists');
    }
    validateNoOverlap(pricing);
    return prisma_1.prisma.$transaction(async (tx) => {
        //create tour
        const tour = await tx.tour.create({
            data: {
                name,
                slug,
                // description,
                // address,
                // exclusions,
                // inclusions,
            },
        });
        //create itineraries
        if (itineraries?.length) {
            await tx.itinerary.createMany({
                data: itineraries.map((item) => ({
                    ...item,
                    tourId: tour.id,
                })),
            });
        }
        //Create pricing
        await tx.tourPricing.createMany({
            data: pricing.map((p) => ({
                ...p,
                tourId: tour.id,
            })),
        });
        //assign imageIds
        if (imageIds.length) {
            await tx.image.updateMany({
                where: { id: { in: imageIds } },
                data: {
                    tourId: tour.id,
                    status: 'ACTIVE',
                    type: 'TOUR',
                },
            });
        }
        return tour;
    });
}
async function deleteTour(id) {
    const existing = await prisma_1.prisma.tour.findUnique({
        where: { id },
        include: { images: true },
    });
    if (!existing)
        throw new Error('Tour not found!');
    const deletePromises = existing.images.map((img) => cloudinary_1.default.uploader.destroy(img.publicId));
    await Promise.all(deletePromises);
    return prisma_1.prisma.tour.delete({ where: { id } });
}
