import { Router } from 'express';
import {
  getAddresses,
  createAddress,
  deleteAddress,
} from '../controllers/address.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createAddressSchema } from '../validations/address.validation.js';

const router = Router();

router.use(authenticate);

router.get('/', getAddresses);
router.post('/', validate(createAddressSchema), createAddress);
router.delete('/:id', deleteAddress);

export default router;
