import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import { deleteMultiple, uploadImage } from '../controllers/upload.controller';
import { upload } from '../middlewares/upload.middleware';

const router = Router();

router.post(
  '/',
  authenticate,
  requireAdmin,
  upload.array('images', 5),
  uploadImage,
);

router.delete('/', authenticate, requireAdmin, deleteMultiple);

// router.get('/', authenticate, requireAdmin, listImage)

export default router;
