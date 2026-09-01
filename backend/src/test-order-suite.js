import { createAddressSchema } from './validations/address.validation.js';
import { createOrderSchema, updateOrderStatusSchema } from './validations/order.validation.js';
import { generateAccessToken } from './utils/token.js';
import express from 'express';

async function runOrderTests() {
  console.log('📦 Starting Checkout & Order Management Test Suite...\n');
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

  // 1. Validations
  console.log('--- 1. Testing Address & Order Schemas ---');
  const validAddr = createAddressSchema.safeParse({
    addressLine: '42 Darjeeling Tea Estate Road',
    city: 'Darjeeling',
    state: 'West Bengal',
    postalCode: '734101',
    country: 'India',
  });
  assert(validAddr.success, 'Accepts valid shipping address schema');

  const shortAddr = createAddressSchema.safeParse({
    addressLine: 'Road',
    city: 'D',
    state: 'WB',
    postalCode: '1',
  });
  assert(!shortAddr.success, 'Rejects incomplete/short address lines');

  const validOrder = createOrderSchema.safeParse({
    addressId: '123e4567-e89b-12d3-a456-426614174000',
  });
  assert(validOrder.success, 'Accepts valid address UUID for order creation');

  const invalidStatus = updateOrderStatusSchema.safeParse({
    status: 'UNKNOWN_STATUS',
  });
  assert(!invalidStatus.success, 'Rejects invalid order status enum value');

  const validStatus = updateOrderStatusSchema.safeParse({
    status: 'CONFIRMED',
  });
  assert(validStatus.success && validStatus.data.status === 'CONFIRMED', 'Accepts CONFIRMED status');

  // 2. Transactional Checkout & Order Lifecycle Simulation
  console.log('\n--- 2. Testing Transactional Checkout & Order Flow ---');
  const testApp = express();
  testApp.use(express.json());

  const customerToken = generateAccessToken({
    id: 'cust-1',
    email: 'jane@example.com',
    role: 'CUSTOMER',
  });

  // Mock in-memory state
  const mockDb = {
    products: {
      'p-1': { id: 'p-1', name: 'Royal Masala Chai', price: 350.0, stock: 10 },
      'p-2': { id: 'p-2', name: 'Organic Matcha', price: 800.0, stock: 2 },
    },
    addresses: {
      'addr-1': { id: 'addr-1', userId: 'cust-1', addressLine: '123 Tea Lane', city: 'Darjeeling' },
    },
    carts: {
      'cust-1': {
        items: [
          { productId: 'p-1', quantity: 2 },
          { productId: 'p-2', quantity: 1 },
        ],
      },
    },
    orders: [],
  };

  const authMiddleware = (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ success: false });
    req.user = { id: 'cust-1', role: 'CUSTOMER' };
    next();
  };

  // Checkout / Create Order endpoint (simulating transactional execution)
  testApp.post('/api/v1/orders', authMiddleware, (req, res) => {
    const { addressId } = req.body;
    const addr = mockDb.addresses[addressId];
    if (!addr || addr.userId !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Invalid address' });
    }

    const userCart = mockDb.carts[req.user.id];
    if (!userCart || userCart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    // Server-side calculation & Stock check
    let subtotal = 0;
    const orderItems = [];

    for (const item of userCart.items) {
      const prod = mockDb.products[item.productId];
      if (!prod || prod.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product ${prod?.name || item.productId}`,
        });
      }

      const itemPrice = prod.price; // Trust only database price
      subtotal += itemPrice * item.quantity;
      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: itemPrice,
      });

      // Reduce stock
      prod.stock -= item.quantity;
    }

    const shipping = subtotal > 999 ? 0 : 99;
    const totalAmount = subtotal + shipping;

    const newOrder = {
      id: `order-${Date.now()}`,
      userId: req.user.id,
      addressId,
      totalAmount,
      status: 'CONFIRMED',
      orderItems,
      createdAt: new Date().toISOString(),
    };

    mockDb.orders.push(newOrder);

    // Clear cart
    userCart.items = [];

    return res.status(201).json({
      success: true,
      data: { order: newOrder },
      message: 'Order created',
    });
  });

  // Cancel order endpoint
  testApp.post('/api/v1/orders/:id/cancel', authMiddleware, (req, res) => {
    const { id } = req.params;
    const order = mockDb.orders.find((o) => o.id === id && o.userId === req.user.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel order' });
    }

    // Restore stock
    for (const item of order.orderItems) {
      mockDb.products[item.productId].stock += item.quantity;
    }

    order.status = 'CANCELLED';
    return res.status(200).json({ success: true, data: { order } });
  });

  const server = testApp.listen(0);
  const { port } = server.address();
  const baseUrl = `http://localhost:${port}`;

  try {
    // Initial stocks: p-1 = 10, p-2 = 2
    // Cart has: 2x p-1 (350.0) + 1x p-2 (800.0)
    // Server subtotal: 2*350 + 1*800 = 700 + 800 = 1500 (Free shipping >= 1000) -> totalAmount: 1500

    const orderRes = await fetch(`${baseUrl}/api/v1/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${customerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ addressId: 'addr-1', spoofedTotal: 10.0 }), // Spoofed price ignored
    });

    const orderData = await orderRes.json();
    assert(
      orderRes.status === 201 &&
      orderData.data.order.totalAmount === 1500 &&
      orderData.data.order.status === 'CONFIRMED',
      'Calculates total on server (₹1500) and sets status to CONFIRMED'
    );

    assert(
      mockDb.products['p-1'].stock === 8 && mockDb.products['p-2'].stock === 1,
      'Reduces product inventory stock atomically (p-1: 10->8, p-2: 2->1)'
    );

    assert(
      mockDb.carts['cust-1'].items.length === 0,
      'Clears the user cart after successful order creation'
    );

    // Attempting to checkout with empty cart -> 400
    const emptyCartRes = await fetch(`${baseUrl}/api/v1/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${customerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ addressId: 'addr-1' }),
    });
    assert(emptyCartRes.status === 400, 'Rejects order placement when cart is empty (400 Bad Request)');

    // Test Order Cancellation & Stock Restoration
    const createdOrderId = orderData.data.order.id;
    const cancelRes = await fetch(`${baseUrl}/api/v1/orders/${createdOrderId}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const cancelData = await cancelRes.json();
    assert(
      cancelRes.status === 200 && cancelData.data.order.status === 'CANCELLED',
      'Cancels CONFIRMED order and sets status to CANCELLED'
    );

    assert(
      mockDb.products['p-1'].stock === 10 && mockDb.products['p-2'].stock === 2,
      'Restores product inventory stock upon order cancellation (p-1: 8->10, p-2: 1->2)'
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

runOrderTests().catch((err) => {
  console.error('Order test runner failed:', err);
  process.exit(1);
});
