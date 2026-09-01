import { Router } from 'express';
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller.js';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createCategorySchema,
  updateCategorySchema,
} from '../validations/category.validation.js';

const router = Router();

// Public routes
router.get('/', getAllCategories);
router.get('/:id', getCategoryById);

// Admin protected routes
router.post(
  '/',
  authenticate,
  authorizeRoles('ADMIN'),
  validate(createCategorySchema),
  createCategory
);

router.put(
  '/:id',
  authenticate,
  authorizeRoles('ADMIN'),
  validate(updateCategorySchema),
  updateCategory
);

router.delete(
  '/:id',
  authenticate,
  authorizeRoles('ADMIN'),
  deleteCategory
);

export default router;
