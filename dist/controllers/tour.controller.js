"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.list = list;
exports.getBySlug = getBySlug;
exports.create = create;
exports.update = update;
exports.remove = remove;
const tour_schema_1 = require("../validators/tour.schema");
const tour_service_1 = require("../services/tour.service");
async function list(req, res) {
    try {
        const tours = await (0, tour_service_1.listTours)();
        res.json(tours);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
}
async function getBySlug(req, res) {
    try {
        const slug = req.params.slug;
        if (Array.isArray(slug)) {
            return res.status(400).json({ error: 'Invalid slug' });
        }
        const tour = await (0, tour_service_1.getTourBySlug)(slug);
        res.json(tour);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
}
async function create(req, res) {
    try {
        const data = tour_schema_1.createTourSchema.parse(req.body);
        const tour = await (0, tour_service_1.createTour)(data);
        res.status(201).json(tour);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
}
async function update(req, res) {
    try {
        const id = req.params.id;
        if (Array.isArray(id)) {
            throw new Error('Invalid id params');
        }
        const data = tour_schema_1.updateTourSchema.parse(req.body);
        const tour = await (0, tour_service_1.updateTour)(id, data);
        res.json(tour);
    }
    catch (err) {
        const msg = err.message || 'Error';
        res.status(msg.includes('not found') ? 404 : 400).json({ error: msg });
    }
}
async function remove(req, res) {
    try {
        const id = req.params.id;
        if (Array.isArray(id)) {
            throw new Error('Invalid id params');
        }
        await (0, tour_service_1.deleteTour)(id);
        res.status(204).send();
    }
    catch (err) {
        res.status(404).json({ error: err.message });
    }
}
