import { Request, Response } from 'express';
import {
  getAllUsers,
  getUserById,
  setProfileImage,
} from '../services/user.service';

export async function getUser(req: Request, res: Response) {
  try {
    const id = req.params.id;
    if (Array.isArray(id)) {
      throw new Error('Invalid id params');
    }

    const user = await getUserById(id);
    res.json(user);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function getUsers(req: Request, res: Response) {
  try {
    const id = req.user?.userId;
    if (!id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const users = await getAllUsers(id);
    res.json(users);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function setProfile(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (Array.isArray(id)) {
      throw new Error('Invalid params');
    }

    const { imageId } = req.body;

    if (userId !== id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await setProfileImage(userId, imageId);

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}
