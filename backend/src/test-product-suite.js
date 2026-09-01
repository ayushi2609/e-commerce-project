import {
  createProductSchema,
  updateProductSchema,
  updateStockSchema,
} from './validations/product.validation.js';
import {
  createCategorySchema,
  updateCategorySchema,
} from './validations/category.validation.js';
import { generateAccessToken } from './utils/token.js';
import express from 'express';

async function runProductTests() {
  console.log('🍵 Starting Product & Category Management Test Suite...\n');
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

  // 1. Zod Validation Tests: Products & Stock
  console.log('--- 1. Testing Product & Stock Validations ---');

  const validProduct = createProductSchema.safeParse({
    name: 'Darjeeling Autumn Flush',
    description: 'Crisp, muscatel black tea from single Himalayan estate.',
    price: '499.50',
    stock: '25',
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3',
    categoryId: '123e4567-e89b-12d3-a456-426614174000',
  });
  assert(validProduct.success, 'Valid product data parses and coerces types correctly');

  const zeroPriceProduct = createProductSchema.safeParse({
    name: 'Free Tea',
    description: 'Free sample promo',
    price: 0,
    stock: 10,
    categoryId: '123e4567-e89b-12d3-a456-426614174000',
  });
  assert(!zeroPriceProduct.success, 'Rejects price <= 0 (Price must be positive)');

  const negativeStockProduct = createProductSchema.safeParse({
    name: 'Invalid Stock Tea',
    description: 'Test description of tea',
    price: 100,
    stock: -5,
    categoryId: '123e4567-e89b-12d3-a456-426614174000',
  });
  assert(!negativeStockProduct.success, 'Rejects negative stock values');

  const decimalStock = updateStockSchema.safeParse({ stock: 12.5 });
  assert(!decimalStock.success, 'Rejects non-integer stock values');

  const validStockUpdate = updateStockSchema.safeParse({ stock: 0 });
  assert(validStockUpdate.success && validStockUpdate.data.stock === 0, 'Accepts 0 stock (out-of-stock state)');

  // 2. Category Validations
  console.log('\n--- 2. Testing Category Validations ---');
  const validCategory = createCategorySchema.safeParse({
    name: 'Green Tea',
    description: 'Antioxidant rich steamed loose leaves',
  });
  assert(validCategory.success, 'Accepts valid category schema');

  const shortCategoryName = createCategorySchema.safeParse({ name: 'A' });
  assert(!shortCategoryName.success, 'Rejects category name shorter than 2 characters');

  // 3. RBAC Route Protection Simulation
  console.log('\n--- 3. Testing Admin RBAC Endpoint Protection ---');
  const testApp = express();
  testApp.use(express.json());

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

  const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const token = authHeader.split(' ')[1];
    if (token === customerToken) {
      req.user = { id: 'user-1', role: 'CUSTOMER' };
      return next();
    }
    if (token === adminToken) {
      req.user = { id: 'admin-1', role: 'ADMIN' };
      return next();
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  };

  const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Access forbidden: Admin role required' });
    }
    next();
  };

  // Public Catalog endpoint
  testApp.get('/api/v1/products', (req, res) => {
    res.status(200).json({ success: true, data: { products: [] } });
  });

  // Admin-only Creation endpoint
  testApp.post('/api/v1/products', authMiddleware, requireAdmin, (req, res) => {
    res.status(201).json({ success: true, message: 'Product created successfully' });
  });

  // Admin-only Stock update endpoint
  testApp.patch('/api/v1/products/:id/stock', authMiddleware, requireAdmin, (req, res) => {
    res.status(200).json({ success: true, message: 'Stock updated' });
  });

  // Admin-only Delete endpoint
  testApp.delete('/api/v1/products/:id', authMiddleware, requireAdmin, (req, res) => {
    res.status(200).json({ success: true, message: 'Product deleted' });
  });

  const server = testApp.listen(0);
  const { port } = server.address();
  const baseUrl = `http://localhost:${port}`;

  try {
    // Public access
    const pubRes = await fetch(`${baseUrl}/api/v1/products`);
    assert(pubRes.status === 200, 'Public can view products catalog without authentication (200 OK)');

    // Unauthenticated admin action
    const unauthRes = await fetch(`${baseUrl}/api/v1/products`, { method: 'POST', body: '{}' });
    assert(unauthRes.status === 401, 'Unauthenticated user cannot create product (401 Unauthorized)');

    // Customer attempting admin action
    const custCreateRes = await fetch(`${baseUrl}/api/v1/products`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test' }),
    });
    assert(custCreateRes.status === 403, 'Customer role cannot create product (403 Forbidden)');

    // Admin creating product
    const adminCreateRes = await fetch(`${baseUrl}/api/v1/products`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test' }),
    });
    assert(adminCreateRes.status === 201, 'Admin role can create product (201 Created)');

    // Admin updating stock
    const adminStockRes = await fetch(`${baseUrl}/api/v1/products/123/stock`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock: 50 }),
    });
    assert(adminStockRes.status === 200, 'Admin can update inventory stock (200 OK)');

    // Admin deleting product
    const adminDelRes = await fetch(`${baseUrl}/api/v1/products/123`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminDelRes.status === 200, 'Admin can delete product from catalog (200 OK)');
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

runProductTests().catch((err) => {
  console.error('Product test runner failed:', err);
  process.exit(1);
});
