"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImage = uploadImage;
exports.deleteMultiple = deleteMultiple;
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const upload_service_1 = require("../services/upload.service");
async function uploadImage(req, res) {
    try {
        const files = req.files;
        if (!Array.isArray(files)) {
            throw new Error('Invalid data type');
        }
        const { type } = req.body;
        if (!files || files.length === 0) {
            throw new Error('No files uploaded');
        }
        // const images = files.map((file) => ({
        //   url: file.path,
        //   public_id: file.filename,
        //   type: type ,
        //   status: 'TEMP',
        // }));
        const images = await (0, upload_service_1.uploadImageService)(files, type);
        res.json(images);
    }
    catch (err) {
        res.status(404).json({ error: err.message });
    }
}
async function deleteMultiple(req, res) {
    const { public_ids } = req.body;
    if (!public_ids || public_ids.length === 0) {
        throw new Error('No public_ids');
    }
    await Promise.all(public_ids.map((id) => cloudinary_1.default.uploader.destroy(id)));
    res.status(201).json({ message: 'removed images' });
}
