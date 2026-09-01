import { Router } from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateProductStock,
  deleteProduct,
} from '../controllers/product.controller.js';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createProductSchema,
  updateProductSchema,
  updateStockSchema,
} from '../validations/product.validation.js';

const router = Router();

// Public routes
router.get('/', getAllProducts);
router.get('/:id', getProductById);

// Admin protected routes
router.post(
  '/',
  authenticate,
  authorizeRoles('ADMIN'),
  validate(createProductSchema),
  createProduct
);

router.put(
  '/:id',
  authenticate,
  authorizeRoles('ADMIN'),
  validate(updateProductSchema),
  updateProduct
);

router.patch(
  '/:id/stock',
  authenticate,
  authorizeRoles('ADMIN'),
  validate(updateStockSchema),
  updateProductStock
);

router.delete(
  '/:id',
  authenticate,
  authorizeRoles('ADMIN'),
  deleteProduct
);

export default router;
