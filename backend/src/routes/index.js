import { Router } from 'express';
import { ApiResponse } from '../utils/ApiResponse.js';
import authRoutes from './auth.routes.js';
import categoryRoutes from './category.routes.js';
import productRoutes from './product.routes.js';
import cartRoutes from './cart.routes.js';
import addressRoutes from './address.routes.js';
import orderRoutes from './order.routes.js';
import adminRoutes from './admin.routes.js';

const router = Router();

// Healthcheck endpoint
router.get('/health', (req, res) => {
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        status: 'UP',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
      'Server is healthy'
    )
  );
});

// Mounted Routes
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/addresses', addressRoutes);
router.use('/orders', orderRoutes);
router.use('/admin', adminRoutes);

export default router;
