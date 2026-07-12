"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTours = listTours;
exports.getTourBySlug = getTourBySlug;
exports.createFullTour = createFullTour;
exports.updateBaseTour = updateBaseTour;
exports.deleteTour = deleteTour;
const cloudinary_1 = __importDefault(require("../../config/cloudinary"));
const prisma_1 = require("../../config/prisma");
const slugify_1 = require("../../utils/slugify");
const tour_rules_1 = require("./tour.rules");
const tour_query_1 = require("./tour.query");
const pricing_service_1 = require("./pricing/pricing.service");
const itinerary_service_1 = require("./itinerary/itinerary.service");
const images_service_1 = require("./images/images.service");
const itinerary_rule_1 = require("./itinerary/itinerary.rule");
const pricing_rule_1 = require("./pricing/pricing.rule");
async function listTours({ page = 1, limit = 10, search, sort = 'createdAt:desc', capacityMode, duration, type, }) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(30, limit);
    const skip = (safePage - 1) * safeLimit;
    const [sortField, sortOrder] = sort?.split(':');
    const orderBy = {
        [sortField || 'createdAt']: sortOrder === 'asc' ? 'asc' : 'desc',
    };
    const where = {
        ...(capacityMode && { capacityMode }),
        ...(duration && { durationDays: duration }),
        ...(type && { type }),
        ...(search && {
            OR: [
                {
                    name: {
                        contains: search,
                        mode: 'insensitive',
                    },
                },
                {
                    location: {
                        contains: search,
                        mode: 'insensitive',
                    },
                },
                {
                    slug: {
                        contains: search,
                        mode: 'insensitive',
                    },
                },
            ],
        }),
    };
    const [data, total] = await prisma_1.prisma.$transaction([
        prisma_1.prisma.tour.findMany({
            where,
            skip,
            take: safeLimit,
            orderBy,
            include: {
                _count: {
                    select: {
                        likes: true,
                    },
                },
                pricing: {
                    select: {
                        price: true,
                        pricingModel: true,
                        maxGroupSize: true,
                        minGroupSize: true,
                        pricingType: true,
                    },
                },
                schedules: {
                    select: {
                        id: true,
                        label: true,
                        startTIme: true,
                        endTime: true,
                    },
                },
                exclusions: {
                    select: {
                        title: true,
                        description: true,
                    },
                },
                inclusions: {
                    select: {
                        title: true,
                        description: true,
                    },
                },
                itinerary: {
                    select: {
                        days: {
                            select: {
                                dayNumber: true,
                                title: true,
                                items: true,
                            },
                        },
                    },
                },
                images: {
                    select: {
                        isFeatured: true,
                        publicId: true,
                    },
                },
            },
        }),
        prisma_1.prisma.tour.count({ where }),
    ]);
    return {
        data: data.map((t) => ({
            id: t.id,
            tourName: t.name,
            slug: t.slug,
            location: t.location,
            duration: t.durationDays,
            mode: t.capacityMode,
            tourType: t.type,
            pricing: t.pricing.map((p) => ({
                price: p.price,
                mode: p.pricingModel,
                type: p.pricingType,
                min: p.minGroupSize,
                max: p.maxGroupSize,
            })),
            schedules: t.schedules.map((s) => ({
                id: s.id,
                start: s.startTIme,
                end: s.endTime,
                label: s.label,
            })),
            inclusions: t.inclusions.map((i) => ({
                title: i.title,
                description: i.description,
            })),
            exclusions: t.exclusions.map((e) => ({
                title: e.title,
                description: e.description,
            })),
            itinerary: t.itinerary?.days.map((d) => ({
                day: d.dayNumber,
                title: d.title,
                items: d.items.map((i) => ({
                    title: i.title,
                    time: i.time,
                    description: i.description,
                    order: i.order,
                })),
            })),
            numberOfLikes: t._count,
        })),
        meta: {
            total,
            page: safePage,
            pageSize: safeLimit,
            pageCount: Math.ceil(total / safeLimit),
        },
    };
}
async function getTourBySlug(slug) {
    const tour = await prisma_1.prisma.tour.findUnique({
        where: {
            slug,
        },
        select: {
            id: true,
            name: true,
            description: true,
            slug: true,
            capacityMode: true,
            durationDays: true,
            type: true,
            timezone: true,
            location: true,
            itinerary: {
                select: {
                    days: {
                        select: {
                            dayNumber: true,
                            title: true,
                            items: {
                                select: {
                                    title: true,
                                    time: true,
                                    description: true,
                                    order: true,
                                },
                            },
                        },
                    },
                },
            },
            inclusions: {
                select: {
                    title: true,
                    description: true,
                    sortOrder: true,
                },
            },
            exclusions: {
                select: {
                    title: true,
                    description: true,
                    sortOrder: true,
                },
            },
            schedules: {
                select: {
                    label: true,
                    startTIme: true,
                    endTime: true,
                    maxParticipants: true,
                },
            },
            pricing: {
                select: {
                    pricingType: true,
                    pricingModel: true,
                    minGroupSize: true,
                    maxGroupSize: true,
                    price: true,
                },
            },
        },
    });
    if (!tour)
        throw new Error('Tour slug not found');
    return tour;
}
async function createFullTour({ inclusions, exclusions, schedules, ...data }) {
    (0, itinerary_rule_1.validateItineraryRules)(data.type, data.itinerary, data.durationDays);
    (0, pricing_rule_1.validatePricingRules)(data.capacityMode, data.pricing);
    const slug = (0, slugify_1.slugify)(data.name);
    await (0, tour_query_1.existingTourSlug)(slug);
    if (data.hasSchedule && !schedules.length) {
        throw new Error('Schedules is required');
    }
    if (!data.hasSchedule && schedules.length > 0) {
        throw new Error('Schedule is not required');
    }
    return prisma_1.prisma.$transaction(async (tx) => {
        //create tour
        const tour = await tx.tour.create({
            data: {
                ownerId: data.ownerId,
                slug,
                description: data.description,
                location: data.location,
                name: data.name,
                durationDays: data.durationDays,
                capacityMode: data.capacityMode,
                type: data.type,
                joinerCapacity: data.joinerCapacity,
            },
        });
        if (inclusions.length > 0) {
            await tx.tourInclusion.createMany({
                data: inclusions.map((item) => ({
                    ...item,
                    tourId: tour.id,
                })),
            });
        }
        if (exclusions.length > 0) {
            await tx.tourExclusion.createMany({
                data: exclusions.map((item) => ({
                    ...item,
                    tourId: tour.id,
                })),
                skipDuplicates: true,
            });
        }
        if (schedules.length > 0) {
            await tx.tourScheduleOption.createMany({
                data: schedules.map((schedule) => ({
                    tourId: tour.id,
                    ...schedule,
                })),
            });
        }
        //create itineraries
        await (0, itinerary_service_1.createItinerary)(tx, tour.id, data.itinerary);
        //Create pricing
        await (0, pricing_service_1.createPricing)(tx, tour.id, data.pricing);
        //assign imageIds
        await (0, images_service_1.attachImages)(tx, tour.id, data.imageIds);
        return tour;
    });
}
async function updateBaseTour(id, { schedules, ...data }) {
    const existing = await (0, tour_query_1.findTourOrFail)(id);
    if (existing.hasSchedule && !schedules?.length) {
        throw new Error('Schedule is required');
    }
    let slug = existing.slug;
    if (data.name && data.name !== existing.name) {
        slug = (0, slugify_1.slugify)(data.name);
        const slugExists = await prisma_1.prisma.tour.findUnique({
            where: { slug },
        });
        if (slugExists)
            throw new Error('Slug already exists');
    }
    const baseValidationInput = {
        type: data.type ?? existing.type,
        durationDays: data.durationDays ?? existing.durationDays ?? undefined,
        capacityMode: data.capacityMode ?? existing.capacityMode,
    };
    (0, tour_rules_1.validateBaseTourRules)(baseValidationInput);
    return prisma_1.prisma.$transaction(async (tx) => {
        const tour = await tx.tour.update({
            where: { id },
            data: {
                ...data,
                slug,
            },
        });
        if (schedules && schedules.length > 0) {
            await tx.tourScheduleOption.deleteMany({
                where: { tourId: tour.id },
            });
            await tx.tourScheduleOption.createMany({
                data: schedules.map((schedule) => ({
                    tourId: tour.id,
                    label: schedule.label,
                    startTime: schedule.startTime,
                    endTime: schedule.endTime,
                    maxParticipants: schedule.maxParticipants,
                })),
            });
        }
    });
}
async function deleteTour(id) {
    const existing = await (0, tour_query_1.findTourOrFail)(id);
    const deletePromises = existing.images.map((img) => cloudinary_1.default.uploader.destroy(img.publicId));
    await Promise.all(deletePromises);
    return prisma_1.prisma.tour.delete({ where: { id: existing.id } });
}
