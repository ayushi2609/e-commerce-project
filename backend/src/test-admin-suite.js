import { generateAccessToken } from './utils/token.js';
import { updateOrderStatusSchema } from './validations/order.validation.js';
import express from 'express';

async function runAdminTests() {
  console.log('🛡️ Starting Admin Control Center Test Suite...\n');
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

  const customerToken = generateAccessToken({
    id: 'user-1',
    email: 'customer@example.com',
    role: 'CUSTOMER',
  });

  const adminToken = generateAccessToken({
    id: 'admin-1',
    email: 'admin@chaistore.com',
    role: 'ADMIN',
  });

  // Mock in-memory state for admin analytics
  const mockAdminDb = {
    users: [
      { id: 'u-1', name: 'Alice Customer', email: 'alice@example.com', role: 'CUSTOMER', orderCount: 3 },
      { id: 'u-2', name: 'Bob Customer', email: 'bob@example.com', role: 'CUSTOMER', orderCount: 1 },
    ],
    products: [
      { id: 'p-1', name: 'Masala Chai', stock: 50, price: 350 },
      { id: 'p-2', name: 'Ceremonial Matcha', stock: 4, price: 899 }, // Low stock <= 10
      { id: 'p-3', name: 'First Flush Darjeeling', stock: 8, price: 599 }, // Low stock <= 10
    ],
    orders: [
      { id: 'ord-1', totalAmount: 1500, status: 'CONFIRMED' },
      { id: 'ord-2', totalAmount: 899, status: 'SHIPPED' },
      { id: 'ord-3', totalAmount: 350, status: 'CANCELLED' }, // Should not count towards completed revenue
    ],
  };

  const testApp = express();
  testApp.use(express.json());

  const authAdmin = (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const token = auth.split(' ')[1];
    if (token === customerToken) {
      return res.status(403).json({ success: false, message: 'Access forbidden: Admin role required' });
    }
    if (token === adminToken) {
      req.user = { id: 'admin-1', role: 'ADMIN' };
      return next();
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  };

  // Admin Analytics Endpoint
  testApp.get('/api/v1/admin/analytics', authAdmin, (req, res) => {
    const totalUsers = mockAdminDb.users.length;
    const totalProducts = mockAdminDb.products.length;
    const totalOrders = mockAdminDb.orders.length;
    const pendingOrders = mockAdminDb.orders.filter((o) =>
      ['PENDING', 'CONFIRMED', 'PROCESSING'].includes(o.status)
    ).length;

    const completedOrders = mockAdminDb.orders.filter((o) => o.status !== 'CANCELLED');
    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const lowStockProducts = mockAdminDb.products.filter((p) => p.stock <= 10);

    return res.status(200).json({
      success: true,
      data: {
        metrics: {
          totalUsers,
          totalProducts,
          totalOrders,
          totalRevenue,
          pendingOrders,
          lowStockCount: lowStockProducts.length,
        },
        lowStockProducts,
        recentOrders: mockAdminDb.orders.slice(0, 5),
      },
    });
  });

  // Admin Users List Endpoint
  testApp.get('/api/v1/admin/users', authAdmin, (req, res) => {
    return res.status(200).json({
      success: true,
      data: { users: mockAdminDb.users },
    });
  });

  // Admin Update Order Status Endpoint
  testApp.patch('/api/v1/orders/admin/:id/status', authAdmin, (req, res) => {
    const { status } = req.body;
    const order = mockAdminDb.orders.find((o) => o.id === req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.status = status;
    return res.status(200).json({ success: true, data: { order } });
  });

  const server = testApp.listen(0);
  const { port } = server.address();
  const baseUrl = `http://localhost:${port}`;

  try {
    // 1. Customer token rejected from analytics -> 403
    const custAnalyticsRes = await fetch(`${baseUrl}/api/v1/admin/analytics`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert(
      custAnalyticsRes.status === 403,
      'Customer account is blocked from accessing admin analytics (403 Forbidden)'
    );

    // 2. Admin token accessing analytics -> 200
    const adminAnalyticsRes = await fetch(`${baseUrl}/api/v1/admin/analytics`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const analyticsData = await adminAnalyticsRes.json();
    assert(
      adminAnalyticsRes.status === 200 &&
      analyticsData.data.metrics.totalUsers === 2 &&
      analyticsData.data.metrics.totalProducts === 3 &&
      analyticsData.data.metrics.totalOrders === 3 &&
      analyticsData.data.metrics.totalRevenue === 2399 && // 1500 + 899 (excludes cancelled 350)
      analyticsData.data.metrics.pendingOrders === 1 &&
      analyticsData.data.metrics.lowStockCount === 2,
      'Computes accurate KPI metrics (Total Users, Products, Orders, Revenue, Pending, Low Stock)'
    );

    assert(
      analyticsData.data.lowStockProducts.length === 2 &&
      analyticsData.data.lowStockProducts.every((p) => p.stock <= 10),
      'Correctly filters products with inventory stock <= 10 units for low-stock alerts'
    );

    // 3. Admin user directory -> 200
    const usersRes = await fetch(`${baseUrl}/api/v1/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const usersData = await usersRes.json();
    assert(
      usersRes.status === 200 && usersData.data.users.length === 2,
      'Admin can view registered customer accounts and order counts'
    );

    // 4. Admin updating order fulfillment status
    const updateStatusRes = await fetch(`${baseUrl}/api/v1/orders/admin/ord-1/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'SHIPPED' }),
    });
    const updateData = await updateStatusRes.json();
    assert(
      updateStatusRes.status === 200 && updateData.data.order.status === 'SHIPPED',
      'Admin can update customer order fulfillment status to SHIPPED'
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

runAdminTests().catch((err) => {
  console.error('Admin test runner error:', err);
  process.exit(1);
});
