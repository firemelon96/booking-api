import { Request, Response } from 'express';
import cloudinary from '../config/cloudinary';

export async function uploadImage(req: Request, res: Response) {
  try {
    const files = req.files;

    if (!Array.isArray(files)) {
      throw new Error('Invalid data type');
    }

    if (!files || files.length === 0) {
      throw new Error('No files uploaded');
    }

    // const uploadUrl = await upload(file);
    // console.log(files);
    const images = files.map((file) => ({
      url: file.path,
      public_id: file.filename,
    }));

    res.json(images);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
}

export async function deleteMultiple(req: Request, res: Response) {
  const { public_ids } = req.body;

  if (!public_ids || public_ids.length === 0) {
    throw new Error('No public_ids');
  }

  await Promise.all(
    public_ids.map((id: string) => cloudinary.uploader.destroy(id)),
  );

  res.status(201).json({ message: 'removed images' });
}
