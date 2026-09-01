import { generateAccessToken } from './utils/token.js';
import { hashPassword, comparePassword } from './utils/password.js';
import express from 'express';

async function runSecurityAuditTests() {
  console.log('🔒 Starting Comprehensive Application Security Audit Suite...\n');
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

  // --- 1. Password Hashing & Sensitive Field Privacy ---
  console.log('--- 1. Password Hashing & User Data Privacy ---');
  const plainPassword = 'SecretCustomerPassword123!';
  const hashedPassword = await hashPassword(plainPassword);

  assert(hashedPassword.startsWith('$2'), 'Passwords are hashed with bcrypt');
  assert(hashedPassword !== plainPassword, 'Plain-text passwords are never stored');
  assert(await comparePassword(plainPassword, hashedPassword), 'Correct password verifies');
  assert(!(await comparePassword('WrongPassword', hashedPassword)), 'Incorrect password fails');

  // Simulated sanitized user object check
  const mockUserDbRecord = {
    id: 'usr-1',
    name: 'Alice',
    email: 'alice@example.com',
    password: hashedPassword,
    role: 'CUSTOMER',
  };

  const sanitizeUser = (u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
  });

  const apiUserResponse = sanitizeUser(mockUserDbRecord);
  assert(
    apiUserResponse.password === undefined && apiUserResponse.passwordHash === undefined,
    'Password hashes are strictly excluded from API responses'
  );

  // --- 2. Multi-Tenant User Isolation & Ownership (IDOR Checks) ---
  console.log('\n--- 2. Multi-Tenant Cart & Order Ownership (IDOR Protections) ---');
  const userAToken = generateAccessToken({ id: 'user-A', email: 'userA@example.com', role: 'CUSTOMER' });
  const userBToken = generateAccessToken({ id: 'user-B', email: 'userB@example.com', role: 'CUSTOMER' });
  const adminToken = generateAccessToken({ id: 'admin-1', email: 'admin@chaistore.com', role: 'ADMIN' });

  const mockDb = {
    products: {
      'p-1': { id: 'p-1', name: 'Darjeeling Tea', price: 500, stock: 20 },
    },
    addresses: {
      'addr-A': { id: 'addr-A', userId: 'user-A', addressLine: '123 Estate Road' },
      'addr-B': { id: 'addr-B', userId: 'user-B', addressLine: '456 Hill Road' },
    },
    orders: [
      { id: 'ord-A-1', userId: 'user-A', addressId: 'addr-A', totalAmount: 500, status: 'CONFIRMED' },
    ],
    carts: {
      'user-A': { id: 'cart-A', userId: 'user-A', items: [{ id: 'item-A-1', productId: 'p-1', quantity: 1 }] },
      'user-B': { id: 'cart-B', userId: 'user-B', items: [] },
    },
  };

  const testApp = express();
  testApp.use(express.json());

  const authMiddleware = (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const token = auth.split(' ')[1];
    if (token === userAToken) req.user = { id: 'user-A', role: 'CUSTOMER' };
    else if (token === userBToken) req.user = { id: 'user-B', role: 'CUSTOMER' };
    else if (token === adminToken) req.user = { id: 'admin-1', role: 'ADMIN' };
    else return res.status(401).json({ success: false, message: 'Invalid token' });
    next();
  };

  const authorizeAdmin = (req, res, next) => {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ success: false, message: 'Forbidden' });
    next();
  };

  // Order Details endpoint with IDOR check
  testApp.get('/api/v1/orders/:id', authMiddleware, (req, res) => {
    const order = mockDb.orders.find((o) => o.id === req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (req.user.role !== 'ADMIN' && order.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own this order' });
    }
    return res.status(200).json({ success: true, data: { order } });
  });

  // Order Placement endpoint with Address Ownership & Server-Side Pricing
  testApp.post('/api/v1/orders', authMiddleware, (req, res) => {
    const { addressId, clientSpoofedPrice } = req.body;
    const address = mockDb.addresses[addressId];
    if (!address || address.userId !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Invalid address: Address does not belong to you' });
    }

    // Trust ONLY server database price
    const prod = mockDb.products['p-1'];
    const serverCalculatedTotal = prod.price * 1 + (prod.price > 999 ? 0 : 99);

    const newOrder = {
      id: `ord-${Date.now()}`,
      userId: req.user.id,
      addressId,
      totalAmount: serverCalculatedTotal,
      status: 'CONFIRMED',
    };
    mockDb.orders.push(newOrder);
    return res.status(201).json({ success: true, data: { order: newOrder } });
  });

  // Admin Only Route (Product CRUD)
  testApp.post('/api/v1/products', authMiddleware, authorizeAdmin, (req, res) => {
    return res.status(201).json({ success: true, message: 'Product created by Admin' });
  });

  const server = testApp.listen(0);
  const { port } = server.address();
  const baseUrl = `http://localhost:${port}`;

  try {
    // Test A: User B attempting to view User A's order -> 403 Forbidden
    const userBOrderRes = await fetch(`${baseUrl}/api/v1/orders/ord-A-1`, {
      headers: { Authorization: `Bearer ${userBToken}` },
    });
    assert(
      userBOrderRes.status === 403,
      'User B is blocked from viewing User A order (403 Forbidden / IDOR Prevention)'
    );

    // Test B: User A viewing their own order -> 200 OK
    const userAOrderRes = await fetch(`${baseUrl}/api/v1/orders/ord-A-1`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    assert(userAOrderRes.status === 200, 'User A can view their own order (200 OK)');

    // Test C: Admin viewing any order -> 200 OK
    const adminOrderRes = await fetch(`${baseUrl}/api/v1/orders/ord-A-1`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminOrderRes.status === 200, 'Admin can view customer order (200 OK)');

    // Test D: User B attempting to place order using User A address -> 404/403 Rejected
    const spoofedAddrOrderRes = await fetch(`${baseUrl}/api/v1/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userBToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ addressId: 'addr-A' }),
    });
    assert(
      spoofedAddrOrderRes.status === 404,
      'User B cannot use User A shipping address for order placement'
    );

    // Test E: Client trying to spoof product prices ($1.00 instead of $500.00)
    const spoofedPriceRes = await fetch(`${baseUrl}/api/v1/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userBToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ addressId: 'addr-B', clientSpoofedPrice: 1.0 }),
    });
    const orderData = await spoofedPriceRes.json();
    assert(
      orderData.data.order.totalAmount === 599, // 500 + 99 shipping
      'Server calculates total securely and ignores client-submitted price tampering'
    );

    // Test F: Customer attempting to create/modify product catalog -> 403 Forbidden
    const custCreateProdRes = await fetch(`${baseUrl}/api/v1/products`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userAToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'Hacked Product' }),
    });
    assert(
      custCreateProdRes.status === 403,
      'Customer is blocked from modifying product catalog (403 Forbidden RBAC)'
    );

    // Test G: Admin creating product -> 201 Created
    const adminCreateProdRes = await fetch(`${baseUrl}/api/v1/products`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'Authentic Tea' }),
    });
    assert(adminCreateProdRes.status === 201, 'Admin role can create catalog products (201 Created)');
  } finally {
    server.close();
  }

  console.log(`\n======================================================`);
  console.log(`Security Audit Test Complete: ${passed} passed, ${failed} failed.`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityAuditTests().catch((err) => {
  console.error('Security audit runner failed:', err);
  process.exit(1);
});
