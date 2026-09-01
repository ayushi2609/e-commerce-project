import { Router } from 'express';
import { register, login, getMe, logout } from '../controllers/auth.controller.js';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { registerSchema, loginSchema } from '../validations/auth.validation.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const router = Router();

import { authLimiter } from '../middleware/rateLimit.middleware.js';

// Public routes with brute-force rate limit protection
router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/logout', logout);

// Customer protected route
router.get('/me', authenticate, getMe);

// Admin-only test protected route
router.get('/admin-only', authenticate, authorizeRoles('ADMIN'), (req, res) => {
  return res.status(200).json(
    new ApiResponse(200, { adminUser: req.user }, 'Access granted to admin route')
  );
});

export default router;
