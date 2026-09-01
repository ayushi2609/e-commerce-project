import { Router } from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrdersAdmin,
  updateOrderStatusAdmin,
} from '../controllers/order.controller.js';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createOrderSchema,
  updateOrderStatusSchema,
} from '../validations/order.validation.js';

const router = Router();

router.use(authenticate);

// Customer order routes
router.post('/', validate(createOrderSchema), createOrder);
router.get('/my-orders', getMyOrders);
router.get('/:id', getOrderById);
router.post('/:id/cancel', cancelOrder);

// Admin order routes
router.get(
  '/admin/all',
  authorizeRoles('ADMIN'),
  getAllOrdersAdmin
);

router.patch(
  '/admin/:id/status',
  authorizeRoles('ADMIN'),
  validate(updateOrderStatusSchema),
  updateOrderStatusAdmin
);

export default router;
