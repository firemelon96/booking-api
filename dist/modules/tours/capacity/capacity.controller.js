"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkOverrideCapacity = bulkOverrideCapacity;
exports.modifyCapacity = modifyCapacity;
exports.resetCapacity = resetCapacity;
const capacity_validator_1 = require("./capacity.validator");
const capacity_service_1 = require("./capacity.service");
// export async function overrideCapacity(
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) {
//   const { tourId } = req.params;
//   const payload = overrideCapacitySchema.safeParse(req.body);
//   if (Array.isArray(tourId)) {
//     return res.status(400).json({ error: 'Invalid tourId' });
//   }
//   if (!payload.success) {
//     return res.status(400).json({ error: 'Invalid request body' });
//   }
//   try {
//     await upsertCapacity({
//       tourId,
//       ...payload.data,
//     });
//     res.json({ success: true });
//   } catch (error) {
//     next(error);
//   }
// }
async function bulkOverrideCapacity(req, res, next) {
    const input = {
        ...req.params,
        ...req.body,
    };
    const payload = capacity_validator_1.bulkOverrideCapacitySchema.safeParse(input);
    if (!payload.success) {
        return res.status(400).json({ error: 'Invalid request body' });
    }
    try {
        const result = await (0, capacity_service_1.bulkSetCapacity)(payload.data);
        res.json(result);
    }
    catch (error) {
        next(error);
    }
}
async function modifyCapacity(req, res, next) {
    const { id } = req.params;
    const { capacity } = req.body;
    if (Array.isArray(id)) {
        return res.status(400).json({ error: 'Invalid id' });
    }
    try {
        await (0, capacity_service_1.updateCapacity)({ id, capacity });
        res.json({ success: true });
    }
    catch (error) {
        next(error);
    }
}
async function resetCapacity(req, res, next) {
    const { tourId } = req.params;
    if (Array.isArray(tourId)) {
        return res.status(400).json({ error: 'Invalid id' });
    }
    try {
        await (0, capacity_service_1.deleteCapacity)({ tourId });
        res.json({ success: true });
    }
    catch (error) {
        next(error);
    }
}
