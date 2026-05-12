import { Router } from 'express';
import { createAmenity, getAmenities } from './amenity.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireAdmin } from '../../middlewares/role.middleware';

const router = Router();

router.get('/', getAmenities);
router.post('/', authenticate, requireAdmin, createAmenity);
// router.get('/:amenityId');
// TODO: Create the delete, update

export default router;
