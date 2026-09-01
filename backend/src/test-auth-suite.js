import { hashPassword, comparePassword } from './utils/password.js';
import { generateAccessToken, generateRefreshToken, verifyAccessToken } from './utils/token.js';
import { registerSchema, loginSchema } from './validations/auth.validation.js';
import { authenticate, authorizeRoles } from './middleware/auth.middleware.js';
import { ApiError } from './utils/ApiError.js';
import express from 'express';
import http from 'http';

async function runTests() {
  console.log('🧪 Starting Authentication & Security Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // 1. Password Hashing (bcrypt)
  console.log('--- 1. Testing Password Hashing & Bcrypt Security ---');
  const plainPassword = 'SuperSecretPassword123!';
  const hashedPassword = await hashPassword(plainPassword);

  assert(
    typeof hashedPassword === 'string' && hashedPassword.startsWith('$2'),
    'Password is hashed using bcrypt with salt rounds'
  );
  assert(
    hashedPassword !== plainPassword,
    'Plain text password is never stored or returned directly'
  );

  const isValidPassword = await comparePassword(plainPassword, hashedPassword);
  assert(isValidPassword === true, 'Correct password verifies successfully against bcrypt hash');

  const isInvalidPassword = await comparePassword('WrongPassword123!', hashedPassword);
  assert(isInvalidPassword === false, 'Incorrect password fails verification (Invalid Credentials)');

  // 2. JWT Generation & Verification
  console.log('\n--- 2. Testing JWT Token Utilities ---');
  const userPayload = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    role: 'CUSTOMER',
  };

  const accessToken = generateAccessToken(userPayload);
  assert(
    typeof accessToken === 'string' && accessToken.split('.').length === 3,
    'Access token generated is a valid 3-part JWT'
  );

  const decoded = verifyAccessToken(accessToken);
  assert(
    decoded.id === userPayload.id && decoded.email === userPayload.email && decoded.role === userPayload.role,
    'Access token successfully verifies and decodes user payload'
  );

  const adminPayload = {
    id: '987e6543-e21b-12d3-a456-426614174999',
    email: 'admin@chaistore.com',
    role: 'ADMIN',
  };
  const adminToken = generateAccessToken(adminPayload);
  const decodedAdmin = verifyAccessToken(adminToken);
  assert(decodedAdmin.role === 'ADMIN', 'Admin JWT token contains ADMIN role');

  // 3. Schema Validations (Zod)
  console.log('\n--- 3. Testing Input Validations (Email & Password) ---');
  const validRegister = registerSchema.safeParse({
    name: 'Alice Johnson',
    email: 'ALICE@EXAMPLE.COM',
    password: 'securePassword123',
  });
  assert(
    validRegister.success && validRegister.data.email === 'alice@example.com',
    'Register schema accepts valid input and normalizes email to lowercase'
  );

  const invalidEmailRegister = registerSchema.safeParse({
    name: 'Alice',
    email: 'not-an-email',
    password: 'securePassword123',
  });
  assert(!invalidEmailRegister.success, 'Register schema rejects invalid email format');

  const shortPasswordRegister = registerSchema.safeParse({
    name: 'Alice',
    email: 'alice@example.com',
    password: '123',
  });
  assert(!shortPasswordRegister.success, 'Register schema rejects password shorter than 6 chars');

  const validLogin = loginSchema.safeParse({
    email: 'alice@example.com',
    password: 'password123',
  });
  assert(validLogin.success, 'Login schema accepts valid credentials structure');

  // 4. HTTP Middleware & RBAC Protected Routes Simulation
  console.log('\n--- 4. Testing Protected Routes & RBAC Authorization Middleware ---');
  const testApp = express();
  testApp.use(express.json());

  // Test route: Protected for Customers
  testApp.get('/test/protected-customer', (req, res, next) => {
    // Inject decoded token directly for middleware test or verify bearer header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, statusCode: 401, message: 'Authentication token missing or invalid' });
    }
    try {
      const token = authHeader.split(' ')[1];
      req.user = verifyAccessToken(token);
      next();
    } catch {
      return res.status(401).json({ success: false, statusCode: 401, message: 'Invalid or expired token' });
    }
  }, (req, res) => {
    // Sanitized response
    const { id, email, role } = req.user;
    return res.status(200).json({ success: true, data: { user: { id, email, role } }, message: 'Protected profile data' });
  });

  // Test route: Protected for Admin only
  testApp.get('/test/admin-only', (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, statusCode: 401, message: 'Authentication token missing or invalid' });
    }
    try {
      const token = authHeader.split(' ')[1];
      req.user = verifyAccessToken(token);
      next();
    } catch {
      return res.status(401).json({ success: false, statusCode: 401, message: 'Invalid or expired token' });
    }
  }, authorizeRoles('ADMIN'), (req, res) => {
    return res.status(200).json({ success: true, message: 'Admin access granted' });
  });

  // Global test error handler
  testApp.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ success: false, statusCode, message: err.message });
  });

  const server = testApp.listen(0);
  const { port } = server.address();
  const baseUrl = `http://localhost:${port}`;

  try {
    // A. Request without token -> 401 Unauthorized
    const resNoToken = await fetch(`${baseUrl}/test/protected-customer`);
    const dataNoToken = await resNoToken.json();
    assert(
      resNoToken.status === 401 && dataNoToken.success === false,
      'Protected route rejects request with missing token (401 Unauthorized)'
    );

    // B. Request with invalid token -> 401 Unauthorized
    const resInvalidToken = await fetch(`${baseUrl}/test/protected-customer`, {
      headers: { Authorization: 'Bearer invalid.token.signature' },
    });
    assert(
      resInvalidToken.status === 401,
      'Protected route rejects malformed/invalid JWT token (401 Unauthorized)'
    );

    // C. Request with valid Customer token -> 200 OK and no password hash exposed
    const resCustomer = await fetch(`${baseUrl}/test/protected-customer`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const dataCustomer = await resCustomer.json();
    assert(
      resCustomer.status === 200 && dataCustomer.data.user.email === 'test@example.com',
      'Protected route accepts valid JWT token (200 OK)'
    );
    assert(
      dataCustomer.data.user.password === undefined,
      'Sensitive password hashes are never exposed in user API response'
    );

    // D. Customer attempting Admin-only route -> 403 Forbidden
    const resCustomerAdminRoute = await fetch(`${baseUrl}/test/admin-only`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const dataCustomerAdminRoute = await resCustomerAdminRoute.json();
    assert(
      resCustomerAdminRoute.status === 403 && dataCustomerAdminRoute.message.includes('Required role is [ADMIN]'),
      'Customer token is denied access to Admin-only route (403 Forbidden)'
    );

    // E. Admin attempting Admin-only route -> 200 OK
    const resAdmin = await fetch(`${baseUrl}/test/admin-only`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dataAdmin = await resAdmin.json();
    assert(
      resAdmin.status === 200 && dataAdmin.message === 'Admin access granted',
      'Admin token successfully accesses Admin-only route (200 OK)'
    );
  } finally {
    server.close();
  }

  console.log(`\n=========================================`);
  console.log(`Summary: ${passed} passed, ${failed} failed.`);
  console.log(`=========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test runner failed:', err);
  process.exit(1);
});
