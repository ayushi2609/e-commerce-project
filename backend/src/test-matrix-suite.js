import express from 'express';
import http from 'http';
import backendApp from './app.js';

async function runCompleteMatrixTestSuite() {
  console.log('🚀 Running Complete Full-Stack Edge-Case & API Matrix Test Suite...\n');

  let passed = 0;
  let failed = 0;
  const testResults = [];

  function record(feature, test, result, issue, fix) {
    testResults.push({ feature, test, result, issue, fix });
    if (result === 'PASS') {
      console.log(`✅ [${feature}] ${test}`);
      passed++;
    } else {
      console.error(`❌ [${feature}] ${test} -> Issue: ${issue}`);
      failed++;
    }
  }

  const server = http.createServer(backendApp);
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const baseUrl = `http://localhost:${port}/api/v1`;

  // ----------------------------------------------------
  // 1. AUTHENTICATION & USERS
  // ----------------------------------------------------
  // 1.1 Register Customer 1
  const cust1Email = `cust1_${Date.now()}@example.com`;
  const regCust1 = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Customer One', email: cust1Email, password: 'Password123!' }),
  });
  const cust1RegData = await regCust1.json();
  const customer1Token = cust1RegData.data?.accessToken;
  record(
    'Authentication',
    'Register with valid data returns 201 and sanitized user object (no password hash)',
    regCust1.status === 201 && cust1RegData.data?.user?.password === undefined ? 'PASS' : 'FAIL',
    regCust1.status !== 201 ? `Returned ${regCust1.status}` : 'Password returned in response',
    'Explicit user sanitization in auth.controller'
  );

  // 1.2 Register Customer 2
  const cust2Email = `cust2_${Date.now()}@example.com`;
  const regCust2 = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Customer Two', email: cust2Email, password: 'Password123!' }),
  });
  const cust2RegData = await regCust2.json();
  const customer2Token = cust2RegData.data?.accessToken;

  // 1.3 Admin Login
  const adminLogin = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@chaistore.com', password: 'Admin123!' }),
  });
  const adminLoginData = await adminLogin.json();
  const adminToken = adminLoginData.data?.accessToken;
  record(
    'Authentication',
    'Admin login with seeded admin credentials returns 200 and ADMIN role token',
    adminLogin.status === 200 && adminLoginData.data?.user?.role === 'ADMIN' ? 'PASS' : 'FAIL',
    `Returned ${adminLogin.status}`,
    'bcrypt password verification and role generation'
  );

  // 1.4 Register Duplicate Email (409 Conflict)
  const regDup = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Duplicate User', email: cust1Email, password: 'Password123!' }),
  });
  record(
    'Authentication',
    'Register with duplicate email returns 409 Conflict',
    regDup.status === 409 ? 'PASS' : 'FAIL',
    `Returned ${regDup.status}`,
    'Existing user check in auth.controller'
  );

  // 1.5 Register Validation Failure (400 Bad Request)
  const regInvalid = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'U', email: 'invalid-email', password: '123' }),
  });
  record(
    'Validation',
    'Register with invalid email format and short password returns 400 Bad Request',
    regInvalid.status === 400 ? 'PASS' : 'FAIL',
    `Returned ${regInvalid.status}`,
    'Validate with Zod registerSchema'
  );

  // 1.6 Login Invalid Credentials (401 Unauthorized)
  const loginInvalid = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'nonexistent@example.com', password: 'WrongPassword!' }),
  });
  record(
    'Authentication',
    'Login with incorrect email/password returns 401 Unauthorized',
    loginInvalid.status === 401 ? 'PASS' : 'FAIL',
    `Returned ${loginInvalid.status}`,
    'Validate credentials via bcrypt comparison and return 401'
  );

  // 1.7 Access Protected Route with Forged Token (401 Unauthorized)
  const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.forged.signature';
  const meInvalidToken = await fetch(`${baseUrl}/auth/me`, {
    headers: { Authorization: `Bearer ${invalidToken}` },
  });
  record(
    'Authorization',
    'Access /auth/me with forged/invalid token returns 401 Unauthorized',
    meInvalidToken.status === 401 ? 'PASS' : 'FAIL',
    `Returned ${meInvalidToken.status}`,
    'verifyAccessToken middleware catches JWT verification exceptions'
  );

  // ----------------------------------------------------
  // 2. PRODUCTS & CATEGORIES
  // ----------------------------------------------------
  // 2.1 Public Catalog Listing (200 OK)
  const listProducts = await fetch(`${baseUrl}/products?page=1&limit=5`);
  const listProductsData = await listProducts.json();
  record(
    'Products',
    'Public customer can fetch paginated products catalog without auth (200 OK)',
    listProducts.status === 200 && Array.isArray(listProductsData.data?.products) ? 'PASS' : 'FAIL',
    `Returned ${listProducts.status}`,
    'Public GET route on /products'
  );

  // 2.2 Product Not Found (404 Not Found)
  const productNotFound = await fetch(`${baseUrl}/products/non-existent-product-id-9999`);
  record(
    'Products',
    'Fetch product with non-existent ID returns 404 Not Found',
    productNotFound.status === 404 ? 'PASS' : 'FAIL',
    `Returned ${productNotFound.status}`,
    'ApiError(404) when findUnique returns null'
  );

  // 2.3 Customer Forbidden to Create Product (403 Forbidden)
  const customerCreateProd = await fetch(`${baseUrl}/products`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${customer1Token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Hacked Product',
      description: 'Testing RBAC',
      price: 100,
      stock: 10,
      categoryId: 'cat-1-black-tea',
    }),
  });
  record(
    'Authorization',
    'Customer role is rejected when attempting to create product (403 Forbidden)',
    customerCreateProd.status === 403 ? 'PASS' : 'FAIL',
    `Returned ${customerCreateProd.status}`,
    'authorizeRoles("ADMIN") middleware protection'
  );

  // 2.4 Admin Create Product with Invalid Price (400 Bad Request)
  const adminInvalidPrice = await fetch(`${baseUrl}/products`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Invalid Price Tea',
      description: 'Negative price test',
      price: -50,
      stock: 10,
      categoryId: 'cat-1-black-tea',
    }),
  });
  record(
    'Validation',
    'Create product with negative price is rejected with 400 Bad Request',
    adminInvalidPrice.status === 400 ? 'PASS' : 'FAIL',
    `Returned ${adminInvalidPrice.status}`,
    'Zod positive number validation on price'
  );

  // 2.5 Admin Create Product Success (201 Created)
  const adminCreateSuccess = await fetch(`${baseUrl}/products`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Nilgiri Frost Oolong',
      description: 'Rare high-elevation winter harvest notes',
      price: 749.0,
      stock: 20,
      categoryId: 'cat-1-black-tea',
    }),
  });
  const createdProdData = await adminCreateSuccess.json();
  const createdProductId = createdProdData.data?.product?.id;
  record(
    'Products',
    'Admin role creates valid product (201 Created)',
    adminCreateSuccess.status === 201 && !!createdProductId ? 'PASS' : 'FAIL',
    `Returned ${adminCreateSuccess.status}`,
    'prisma.product.create with category association'
  );

  // ----------------------------------------------------
  // 3. SHOPPING CART & MULTI-TENANT ISOLATION
  // ----------------------------------------------------
  // 3.1 Unauthenticated Cart Access (401 Unauthorized)
  const unauthCart = await fetch(`${baseUrl}/cart`);
  record(
    'Cart',
    'Unauthenticated request to GET /cart returns 401 Unauthorized',
    unauthCart.status === 401 ? 'PASS' : 'FAIL',
    `Returned ${unauthCart.status}`,
    'authenticate middleware attached to cart routes'
  );

  // 3.2 Add to Cart with Quantity Exceeding Stock (400 Bad Request)
  const exceedStockCart = await fetch(`${baseUrl}/cart/items`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${customer1Token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ productId: 'prod-3-matcha', quantity: 9999 }),
  });
  record(
    'Cart',
    'Add quantity greater than available stock returns 400 Bad Request',
    exceedStockCart.status === 400 ? 'PASS' : 'FAIL',
    `Returned ${exceedStockCart.status}`,
    'Inventory stock check before cart mutation in cart.service'
  );

  // 3.3 Add to Cart with Non-Existent Product ID (404 Not Found)
  const invalidProdCart = await fetch(`${baseUrl}/cart/items`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${customer1Token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ productId: 'non-existent-product-id-000', quantity: 1 }),
  });
  record(
    'Cart',
    'Add non-existent product ID to cart returns 404 Not Found',
    invalidProdCart.status === 404 ? 'PASS' : 'FAIL',
    `Returned ${invalidProdCart.status}`,
    'ApiError(404) when product is missing'
  );

  // 3.4 Valid Cart Mutation & Isolation Check
  const validAddCart = await fetch(`${baseUrl}/cart/items`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${customer1Token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ productId: 'prod-1-masala-chai', quantity: 2 }),
  });
  const cust1CartData = await validAddCart.json();

  // Verify Customer 2 has isolated cart
  const cust2Cart = await fetch(`${baseUrl}/cart`, {
    headers: { Authorization: `Bearer ${customer2Token}` },
  });
  const cust2CartData = await cust2Cart.json();
  const cust1Qty = cust1CartData.data?.cart?.totalQuantity ?? cust1CartData.data?.totalQuantity;
  const cust2Qty = cust2CartData.data?.cart?.totalQuantity ?? cust2CartData.data?.totalQuantity;
  record(
    'Cart',
    'User B cannot access or view User A cart items (Cart Tenant Isolation)',
    cust1Qty === 2 && cust2Qty === 0 ? 'PASS' : 'FAIL',
    `Cust1 Qty: ${cust1Qty}, Cust2 Qty: ${cust2Qty}`,
    'Cart query is strictly scoped to req.user.id'
  );

  // ----------------------------------------------------
  // 4. CHECKOUT & ORDERS
  // ----------------------------------------------------
  // 4.1 Create Address for Customer 1
  const addrRes = await fetch(`${baseUrl}/addresses`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${customer1Token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      addressLine: '99 Darjeeling Hills Way',
      city: 'Darjeeling',
      state: 'West Bengal',
      postalCode: '734101',
    }),
  });
  const addrData = await addrRes.json();
  const cust1AddressId = addrData.data?.address?.id;

  // 4.2 Customer 2 trying to use Customer 1 Address for Checkout (404/403 Rejected)
  const idorOrderRes = await fetch(`${baseUrl}/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${customer2Token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ addressId: cust1AddressId }),
  });
  record(
    'Orders',
    'User B cannot use User A shipping address for order placement (IDOR Protection)',
    idorOrderRes.status === 404 || idorOrderRes.status === 400 ? 'PASS' : 'FAIL',
    `Returned ${idorOrderRes.status}`,
    'Verify address.userId === req.user.id inside transaction'
  );

  // 4.3 Customer 1 Checkout with Server-Side Price Calculation & Stock Reduction
  const orderCheckout = await fetch(`${baseUrl}/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${customer1Token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ addressId: cust1AddressId, spoofedTotal: 5.0 }),
  });
  const orderCheckoutData = await orderCheckout.json();
  const placedOrderId = orderCheckoutData.data?.order?.id;
  record(
    'Checkout',
    'Transactional checkout calculates total on server and clears user cart',
    orderCheckout.status === 201 && orderCheckoutData.data?.order?.totalAmount === 797 ? 'PASS' : 'FAIL',
    `Returned ${orderCheckout.status}, Total: ${orderCheckoutData.data?.order?.totalAmount}`,
    'prisma.$transaction verifies stock, computes total, and empties cart'
  );

  // 4.4 User B Forbidden from viewing User A Order Details (403 Forbidden)
  const userBViewOrder = await fetch(`${baseUrl}/orders/${placedOrderId}`, {
    headers: { Authorization: `Bearer ${customer2Token}` },
  });
  record(
    'Orders',
    'User B is forbidden from viewing User A order receipt (403 Forbidden)',
    userBViewOrder.status === 403 ? 'PASS' : 'FAIL',
    `Returned ${userBViewOrder.status}`,
    'getOrderById verifies order.userId === req.user.id'
  );

  // ----------------------------------------------------
  // 5. ADMIN MANAGEMENT & CONTROLS
  // ----------------------------------------------------
  // 5.1 Admin Analytics Endpoint Access (200 OK)
  const adminAnalytics = await fetch(`${baseUrl}/admin/analytics`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  record(
    'Admin',
    'Admin role fetches analytics KPI metrics and low-stock monitor (200 OK)',
    adminAnalytics.status === 200 ? 'PASS' : 'FAIL',
    `Returned ${adminAnalytics.status}`,
    'getAdminAnalytics route with ADMIN authorization'
  );

  // 5.2 Customer Blocked from Admin Analytics (403 Forbidden)
  const custBlockedAnalytics = await fetch(`${baseUrl}/admin/analytics`, {
    headers: { Authorization: `Bearer ${customer1Token}` },
  });
  record(
    'Authorization',
    'Customer role is denied access to admin analytics (403 Forbidden)',
    custBlockedAnalytics.status === 403 ? 'PASS' : 'FAIL',
    `Returned ${custBlockedAnalytics.status}`,
    'authorizeRoles("ADMIN") rejection'
  );

  // 5.3 Admin Update Customer Order Status (200 OK)
  const updateStatus = await fetch(`${baseUrl}/orders/admin/${placedOrderId}/status`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status: 'PROCESSING' }),
  });
  const updateStatusData = await updateStatus.json();
  record(
    'Admin',
    'Admin updates customer order status to PROCESSING (200 OK)',
    updateStatus.status === 200 && updateStatusData.data?.order?.status === 'PROCESSING' ? 'PASS' : 'FAIL',
    `Returned ${updateStatus.status}`,
    'updateOrderStatusAdmin handler with valid status transition'
  );

  server.close();

  console.log(`\n======================================================`);
  console.log(`Matrix Test Suite Complete: ${passed} passed, ${failed} failed.`);
  console.log(`======================================================\n`);

  if (failed > 0) process.exit(1);
}

runCompleteMatrixTestSuite().catch((err) => {
  console.error('Test matrix execution error:', err);
  process.exit(1);
});
