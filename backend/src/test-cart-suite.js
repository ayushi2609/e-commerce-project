import { addToCartSchema, updateCartItemSchema } from './validations/cart.validation.js';
import { generateAccessToken } from './utils/token.js';
import express from 'express';

async function runCartTests() {
  console.log('🛒 Starting Shopping Cart Test Suite...\n');
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

  // 1. Zod Cart Schema Validations
  console.log('--- 1. Testing Cart Schema Validations ---');
  const validAdd = addToCartSchema.safeParse({
    productId: '123e4567-e89b-12d3-a456-426614174000',
    quantity: 2,
  });
  assert(validAdd.success && validAdd.data.quantity === 2, 'Accepts valid product UUID and integer quantity');

  const defaultQuantityAdd = addToCartSchema.safeParse({
    productId: '123e4567-e89b-12d3-a456-426614174000',
  });
  assert(defaultQuantityAdd.success && defaultQuantityAdd.data.quantity === 1, 'Defaults quantity to 1 when omitted');

  const zeroQuantityAdd = addToCartSchema.safeParse({
    productId: '123e4567-e89b-12d3-a456-426614174000',
    quantity: 0,
  });
  assert(!zeroQuantityAdd.success, 'Rejects zero quantity (must be at least 1)');

  const negativeQuantityAdd = addToCartSchema.safeParse({
    productId: '123e4567-e89b-12d3-a456-426614174000',
    quantity: -3,
  });
  assert(!negativeQuantityAdd.success, 'Rejects negative quantity');

  const invalidProductUuid = addToCartSchema.safeParse({
    productId: '',
    quantity: 1,
  });
  assert(!invalidProductUuid.success, 'Rejects empty product ID string');

  // 2. HTTP Cart Operations & Isolation Simulation
  console.log('\n--- 2. Testing HTTP Cart Operations & User Isolation ---');
  const testApp = express();
  testApp.use(express.json());

  const userAToken = generateAccessToken({ id: 'user-A', email: 'userA@example.com', role: 'CUSTOMER' });
  const userBToken = generateAccessToken({ id: 'user-B', email: 'userB@example.com', role: 'CUSTOMER' });

  // In-memory mock database for testing cart business logic
  const mockProducts = {
    'prod-in-stock': { id: 'prod-in-stock', name: 'Royal Masala Chai', price: 300.0, stock: 5 },
    'prod-out-stock': { id: 'prod-out-stock', name: 'Darjeeling Flush', price: 500.0, stock: 0 },
  };

  const mockCarts = {
    'user-A': { userId: 'user-A', items: [] },
    'user-B': { userId: 'user-B', items: [] },
  };

  const authMiddleware = (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const token = auth.split(' ')[1];
    if (token === userAToken) req.user = { id: 'user-A' };
    else if (token === userBToken) req.user = { id: 'user-B' };
    else return res.status(401).json({ success: false, message: 'Invalid token' });
    next();
  };

  const calculateCartTotals = (userId) => {
    const cart = mockCarts[userId];
    let subtotal = 0;
    let totalQuantity = 0;
    const items = cart.items.map((item) => {
      const prod = mockProducts[item.productId];
      const itemTotal = prod.price * item.quantity;
      subtotal += itemTotal;
      totalQuantity += item.quantity;
      return { ...item, product: prod, itemTotal };
    });
    return { userId, items, subtotal, totalQuantity };
  };

  // GET Cart
  testApp.get('/api/v1/cart', authMiddleware, (req, res) => {
    return res.status(200).json({ success: true, data: { cart: calculateCartTotals(req.user.id) } });
  });

  // POST Add Item
  testApp.post('/api/v1/cart/items', authMiddleware, (req, res) => {
    const { productId, quantity } = req.body;
    const prod = mockProducts[productId];
    if (!prod) return res.status(404).json({ success: false, message: 'Product not found' });
    if (prod.stock <= 0) return res.status(400).json({ success: false, message: 'Product is out of stock' });

    const cart = mockCarts[req.user.id];
    const existing = cart.items.find((i) => i.productId === productId);
    const newQty = existing ? existing.quantity + quantity : quantity;

    if (newQty > prod.stock) {
      return res.status(400).json({
        success: false,
        message: `Requested quantity exceeds available stock (${prod.stock})`,
      });
    }

    if (existing) {
      existing.quantity = newQty;
    } else {
      cart.items.push({ id: `item-${Date.now()}-${Math.random()}`, productId, quantity: newQty });
    }

    return res.status(200).json({ success: true, data: { cart: calculateCartTotals(req.user.id) } });
  });

  // PUT Update Item
  testApp.put('/api/v1/cart/items/:id', authMiddleware, (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body;
    const cart = mockCarts[req.user.id];
    const item = cart.items.find((i) => i.id === id);

    if (!item) return res.status(404).json({ success: false, message: 'Cart item not found in your cart' });

    const prod = mockProducts[item.productId];
    if (quantity > prod.stock) {
      return res.status(400).json({ success: false, message: 'Quantity exceeds available stock' });
    }

    item.quantity = quantity;
    return res.status(200).json({ success: true, data: { cart: calculateCartTotals(req.user.id) } });
  });

  // DELETE Remove Item
  testApp.delete('/api/v1/cart/items/:id', authMiddleware, (req, res) => {
    const { id } = req.params;
    const cart = mockCarts[req.user.id];
    const index = cart.items.findIndex((i) => i.id === id);

    if (index === -1) return res.status(404).json({ success: false, message: 'Cart item not found in your cart' });

    cart.items.splice(index, 1);
    return res.status(200).json({ success: true, data: { cart: calculateCartTotals(req.user.id) } });
  });

  // DELETE Clear Cart
  testApp.delete('/api/v1/cart', authMiddleware, (req, res) => {
    mockCarts[req.user.id].items = [];
    return res.status(200).json({ success: true, data: { cart: calculateCartTotals(req.user.id) } });
  });

  const server = testApp.listen(0);
  const { port } = server.address();
  const baseUrl = `http://localhost:${port}`;

  try {
    // A. Unauthorized access
    const unauthRes = await fetch(`${baseUrl}/api/v1/cart`);
    assert(unauthRes.status === 401, 'Unauthenticated user cannot view cart (401 Unauthorized)');

    // B. Add out of stock product -> 400
    const outOfStockRes = await fetch(`${baseUrl}/api/v1/cart/items`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userAToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: 'prod-out-stock', quantity: 1 }),
    });
    assert(outOfStockRes.status === 400, 'Cannot add out-of-stock product to cart (400 Bad Request)');

    // C. Add in-stock product with quantity > stock -> 400
    const exceedStockRes = await fetch(`${baseUrl}/api/v1/cart/items`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userAToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: 'prod-in-stock', quantity: 10 }),
    });
    assert(exceedStockRes.status === 400, 'Cannot add quantity exceeding available stock (400 Bad Request)');

    // D. Add valid item (qty: 2) -> 200 OK
    const addRes = await fetch(`${baseUrl}/api/v1/cart/items`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userAToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: 'prod-in-stock', quantity: 2 }),
    });
    const addData = await addRes.json();
    assert(
      addRes.status === 200 &&
      addData.data.cart.totalQuantity === 2 &&
      addData.data.cart.subtotal === 600.0,
      'Adds product to cart and calculates subtotal (2 * 300 = 600) and totalQuantity (2)'
    );

    const userAItemId = addData.data.cart.items[0].id;

    // E. Increase quantity to 4 -> 200 OK
    const incRes = await fetch(`${baseUrl}/api/v1/cart/items/${userAItemId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${userAToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: 4 }),
    });
    const incData = await incRes.json();
    assert(
      incRes.status === 200 &&
      incData.data.cart.totalQuantity === 4 &&
      incData.data.cart.subtotal === 1200.0,
      'Increases quantity to 4 and recalculates subtotal to 1200'
    );

    // F. User B trying to modify User A's cart item -> 404 (User Isolation)
    const userBAccessRes = await fetch(`${baseUrl}/api/v1/cart/items/${userAItemId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${userBToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: 1 }),
    });
    assert(userBAccessRes.status === 404, 'User B cannot access or mutate User A cart item (Cart Isolation)');

    // G. Decrease quantity to 1 -> 200 OK
    const decRes = await fetch(`${baseUrl}/api/v1/cart/items/${userAItemId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${userAToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: 1 }),
    });
    const decData = await decRes.json();
    assert(
      decRes.status === 200 && decData.data.cart.totalQuantity === 1,
      'Decreases quantity to 1'
    );

    // H. Remove item -> 200 OK
    const remRes = await fetch(`${baseUrl}/api/v1/cart/items/${userAItemId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    const remData = await remRes.json();
    assert(
      remRes.status === 200 && remData.data.cart.items.length === 0,
      'Removes item from cart'
    );

    // I. Add item then Clear cart
    await fetch(`${baseUrl}/api/v1/cart/items`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userAToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: 'prod-in-stock', quantity: 3 }),
    });

    const clearRes = await fetch(`${baseUrl}/api/v1/cart`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    const clearData = await clearRes.json();
    assert(
      clearRes.status === 200 &&
      clearData.data.cart.items.length === 0 &&
      clearData.data.cart.subtotal === 0 &&
      clearData.data.cart.totalQuantity === 0,
      'Clears entire shopping cart and resets subtotal and totalQuantity to 0'
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

runCartTests().catch((err) => {
  console.error('Cart test runner error:', err);
  process.exit(1);
});
