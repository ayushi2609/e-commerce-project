import { Router } from 'express';
import { getAdminAnalytics, getAdminUsers } from '../controllers/admin.controller.js';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';

const router = Router();

// Protect all admin routes
router.use(authenticate, authorizeRoles('ADMIN'));

router.get('/analytics', getAdminAnalytics);
router.get('/users', getAdminUsers);

export default router;
