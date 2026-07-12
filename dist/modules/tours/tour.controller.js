"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllTours = getAllTours;
exports.getTourDetail = getTourDetail;
exports.addTour = addTour;
exports.editBaseTour = editBaseTour;
exports.removeTour = removeTour;
const tour_validator_1 = require("./tour.validator");
const tour_service_1 = require("./tour.service");
async function getAllTours(req, res, next) {
    const payload = tour_validator_1.tourParamsSchema.safeParse(req.query);
    if (!payload.success) {
        throw new Error('Invalid fields');
    }
    try {
        const tours = await (0, tour_service_1.listTours)(payload.data);
        res.json(tours);
    }
    catch (error) {
        next(error);
    }
}
async function getTourDetail(req, res, next) {
    const { slug } = req.params;
    if (Array.isArray(slug))
        throw new Error('Invalid params');
    try {
        const tour = await (0, tour_service_1.getTourBySlug)(slug);
        res.json(tour);
    }
    catch (error) {
        next(error);
    }
}
async function addTour(req, res, next) {
    const input = {
        ownerId: req.user?.userId,
        ...req.body,
    };
    const payload = tour_validator_1.createFullTourSchema.safeParse(input);
    if (!payload.success) {
        throw new Error('Invalid fields');
    }
    try {
        const created = await (0, tour_service_1.createFullTour)(payload.data);
        res.status(201).json(created);
    }
    catch (error) {
        next(error);
    }
}
async function editBaseTour(req, res, next) {
    const { id } = req.params;
    const payload = tour_validator_1.updatePartialTourSchema.safeParse(req.body);
    if (!payload.success) {
        throw new Error('Invalid fields');
    }
    if (Array.isArray(id)) {
        throw new Error('Invalid params');
    }
    try {
        const edited = await (0, tour_service_1.updateBaseTour)(id, payload.data);
        res.json(edited);
    }
    catch (error) {
        next(error);
    }
}
async function removeTour(req, res, next) {
    const { id } = req.params;
    if (Array.isArray(id)) {
        throw new Error('Invalid params');
    }
    try {
        await (0, tour_service_1.deleteTour)(id);
        res.json({ message: 'Tour deleted successfully' });
    }
    catch (error) {
        next(error);
    }
}
