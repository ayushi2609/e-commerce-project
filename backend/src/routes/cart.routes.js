import { Router } from 'express';
import {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
} from '../controllers/cart.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  addToCartSchema,
  updateCartItemSchema,
} from '../validations/cart.validation.js';

const router = Router();

// Protect all cart routes
router.use(authenticate);

router.get('/', getCart);
router.post('/items', validate(addToCartSchema), addItem);
router.put('/items/:id', validate(updateCartItemSchema), updateItem);
router.delete('/items/:id', removeItem);
router.delete('/', clearCart);

export default router;
