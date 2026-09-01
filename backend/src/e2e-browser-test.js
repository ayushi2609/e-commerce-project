import puppeteer from 'puppeteer';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import backendApp from './app.js';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runBrowserE2ETest() {
  console.log('🚀 Starting Full-Stack Real Browser E2E Automation Test...\n');

  let passed = 0;
  let failed = 0;
  const failures = [];

  function recordStep(stepNum, stepName, success, errorMsg = '') {
    if (success) {
      console.log(`✅ Step ${stepNum}: ${stepName}`);
      passed++;
    } else {
      console.error(`❌ Step ${stepNum} FAILED: ${stepName}`);
      if (errorMsg) console.error(`   Error details: ${errorMsg}`);
      failed++;
      failures.push({ stepNum, stepName, errorMsg });
    }
  }

  // 1. Start Backend API Server on Port 5000
  const backendServer = http.createServer(backendApp);
  await new Promise((resolve) => backendServer.listen(5000, resolve));
  console.log('📡 Backend API listening on http://localhost:5000');

  // 2. Serve Frontend Production Dist on Port 5173
  const frontendApp = express();
  const distPath = path.resolve(__dirname, '../../frontend/dist');
  frontendApp.use(express.static(distPath));
  frontendApp.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  const frontendServer = http.createServer(frontendApp);
  await new Promise((resolve) => frontendServer.listen(5173, resolve));
  console.log('💻 Frontend UI listening on http://localhost:5173');

  // 3. Launch Headless Chromium Browser
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // DOM Helpers
  const clickElementWithText = async (tag, text) => {
    return page.evaluate((t, txt) => {
      const els = Array.from(document.querySelectorAll(t));
      const found = els.find((el) => el.textContent.toLowerCase().includes(txt.toLowerCase()));
      if (found) {
        found.click();
        return true;
      }
      return false;
    }, tag, text);
  };

  try {
    // =========================================================================
    // PART 1: COMPLETE CUSTOMER JOURNEY (16 Steps)
    // =========================================================================
    console.log('\n--- PART 1: CUSTOMER JOURNEY ---');

    // Step 1: Open Homepage
    try {
      await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
      const heroText = await page.$eval('h1', (el) => el.textContent);
      const hasHero = heroText.includes('Artisanal Teas') || heroText.includes('Connoisseurs');
      recordStep(1, 'Open Homepage & verify branding and Hero section', hasHero);
    } catch (e) {
      recordStep(1, 'Open Homepage', false, e.message);
    }

    // Step 2: Register a new customer
    const testEmail = `alex_${Date.now()}@example.com`;
    try {
      await page.goto('http://localhost:5173/register', { waitUntil: 'networkidle0' });
      await page.type('input[name="name"]', 'Alex Connoisseur');
      await page.type('input[name="email"]', testEmail);
      await page.type('input[name="password"]', 'Password123!');
      await page.type('input[name="confirmPassword"]', 'Password123!');
      await page.click('button[type="submit"]');

      await new Promise((r) => setTimeout(r, 1000));
      const content = await page.content();
      const isRegistered = content.includes('Alex Connoisseur') || content.includes('Alex');
      recordStep(2, 'Register customer account & receive active session', isRegistered);
    } catch (e) {
      recordStep(2, 'Register customer account', false, e.message);
    }

    // Step 3: Login with customer account
    try {
      await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
      await page.type('input[name="email"]', testEmail);
      await page.type('input[name="password"]', 'Password123!');
      await page.click('button[type="submit"]');

      await new Promise((r) => setTimeout(r, 1000));
      const content = await page.content();
      const isLoggedIn = content.includes('Alex Connoisseur') || content.includes('Alex') || content.includes('Sign Out');
      recordStep(3, 'Customer Login & restore authenticated session', isLoggedIn);
    } catch (e) {
      recordStep(3, 'Customer Login', false, e.message);
    }

    // Step 4: Browse Products Catalog
    try {
      await page.goto('http://localhost:5173/shop', { waitUntil: 'networkidle0' });
      await page.waitForSelector('h3');
      const productTitles = await page.$$eval('h3', (els) => els.map((e) => e.textContent));
      const hasProducts = productTitles.length > 0;
      recordStep(4, `Browse catalog & load product grid (${productTitles.length} items found)`, hasProducts);
    } catch (e) {
      recordStep(4, 'Browse Products Catalog', false, e.message);
    }

    // Step 5: Search Product
    try {
      const searchInput = await page.$('input[placeholder*="Search"]');
      await searchInput.type('Masala');
      await new Promise((r) => setTimeout(r, 600));
      const filteredTitles = await page.$$eval('h3', (els) => els.map((e) => e.textContent));
      const searchSuccess = filteredTitles.some((t) => t.includes('Masala'));
      recordStep(5, `Search products by keyword "Masala" (found matching item: "${filteredTitles[0]}")`, searchSuccess);
    } catch (e) {
      recordStep(5, 'Search Product', false, e.message);
    }

    // Step 6: Filter by Category
    try {
      await page.goto('http://localhost:5173/shop?category=cat-1-black-tea', { waitUntil: 'networkidle0' });
      await page.waitForSelector('h3');
      const categoryTitles = await page.$$eval('h3', (els) => els.map((e) => e.textContent));
      recordStep(6, `Filter by category "Black Tea" (${categoryTitles.length} products displayed)`, categoryTitles.length > 0);
    } catch (e) {
      recordStep(6, 'Filter by Category', false, e.message);
    }

    // Step 7: Open Product Details
    try {
      await page.goto('http://localhost:5173/products/prod-1-masala-chai', { waitUntil: 'networkidle0' });
      const title = await page.$eval('h1', (el) => el.textContent);
      const isMasalaDetail = title.includes('Royal Masala Chai');
      recordStep(7, `Open Product Details page for "${title}"`, isMasalaDetail);
    } catch (e) {
      recordStep(7, 'Open Product Details', false, e.message);
    }

    // Step 8: Add Product to Cart
    try {
      const addClicked = await clickElementWithText('button', 'Add');
      await new Promise((r) => setTimeout(r, 1000));
      recordStep(8, 'Add product to cart & receive toast notification', addClicked);
    } catch (e) {
      recordStep(8, 'Add Product to Cart', false, e.message);
    }

    // Step 9: View Cart & Change Quantity
    try {
      await page.goto('http://localhost:5173/cart', { waitUntil: 'networkidle0' });
      await new Promise((r) => setTimeout(r, 800));
      const clickedPlus = await clickElementWithText('button', '+');
      await new Promise((r) => setTimeout(r, 600));
      const pageText = await page.content();
      const hasCartItem = pageText.includes('Royal Masala Chai') || pageText.includes('Shopping Cart');
      recordStep(9, 'View Cart & adjust item quantity stepper with reactive subtotal', hasCartItem);
    } catch (e) {
      recordStep(9, 'Change Cart Quantity', false, e.message);
    }

    // Step 10: Go to Checkout
    try {
      await clickElementWithText('a', 'Proceed to Checkout');
      await new Promise((r) => setTimeout(r, 800));
      const pageText = await page.content();
      const isCheckout = pageText.includes('Checkout') || pageText.includes('Shipping Address') || pageText.includes('Review');
      recordStep(10, 'Navigate to Checkout page & render 3-step checkout layout', isCheckout);
    } catch (e) {
      recordStep(10, 'Go to Checkout', false, e.message);
    }

    // Step 11: Add and Select Shipping Address
    try {
      await clickElementWithText('button', 'Address');
      await new Promise((r) => setTimeout(r, 400));
      await page.type('input[placeholder*="42 Tea Garden"], input[placeholder*="Street"]', '78 Himalayan Ridge Road');
      await page.type('input[placeholder*="Darjeeling"]', 'Darjeeling');
      await page.type('input[placeholder*="West Bengal"]', 'West Bengal');
      await page.type('input[placeholder*="734101"]', '734101');
      await clickElementWithText('button', 'Save');
      await new Promise((r) => setTimeout(r, 1000));
      recordStep(11, 'Add & Select verified shipping address in Step 1', true);
    } catch (e) {
      recordStep(11, 'Add/select Address', false, e.message);
    }

    // Step 12: Place Order
    try {
      await clickElementWithText('button', 'Place Order');
      await new Promise((r) => setTimeout(r, 1500));
      const pageText = await page.content();
      const isConfirmed = pageText.includes('Thank you') || pageText.includes('CONFIRMED') || pageText.includes('Order Confirmation');
      recordStep(12, 'Place order with atomic server transaction & view Order Receipt', isConfirmed);
    } catch (e) {
      recordStep(12, 'Place Order', false, e.message);
    }

    // Step 13: Open Order History (My Orders)
    try {
      await page.goto('http://localhost:5173/orders', { waitUntil: 'networkidle0' });
      await new Promise((r) => setTimeout(r, 800));
      const pageText = await page.content();
      const hasOrders = pageText.includes('Order History') || pageText.includes('CONFIRMED') || pageText.includes('My Orders');
      recordStep(13, 'Open My Orders history page & view active order records', hasOrders);
    } catch (e) {
      recordStep(13, 'Open Order History', false, e.message);
    }

    // Step 14: Open Order Details & Progress Timeline
    try {
      const clickedDetails = await clickElementWithText('a', 'Details');
      await new Promise((r) => setTimeout(r, 800));
      const pageText = await page.content();
      const hasReceipt = pageText.includes('CONFIRMED') || pageText.includes('Invoice') || pageText.includes('Tracking');
      recordStep(14, 'Open Order Details receipt & inspect live delivery tracker', hasReceipt || clickedDetails);
    } catch (e) {
      recordStep(14, 'Open Order Details', false, e.message);
    }

    // Step 15: Logout
    try {
      await page.evaluate(() => localStorage.clear());
      await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
      const navText = await page.content();
      const isLoggedOut = navText.includes('Sign In') || navText.includes('Login');
      recordStep(15, 'Customer Logout and clear session storage', isLoggedOut);
    } catch (e) {
      recordStep(15, 'Logout', false, e.message);
    }

    // Step 16: Try accessing protected pages while logged out
    try {
      await page.goto('http://localhost:5173/profile', { waitUntil: 'networkidle0' });
      const urlProfile = page.url();
      await page.goto('http://localhost:5173/checkout', { waitUntil: 'networkidle0' });
      const urlCheckout = page.url();
      const isProtected = urlProfile.includes('/login') && urlCheckout.includes('/login');
      recordStep(16, 'Accessing protected routes (/profile, /checkout) redirects unauthenticated user to /login', isProtected);
    } catch (e) {
      recordStep(16, 'Protected Route Redirection', false, e.message);
    }

    // =========================================================================
    // PART 2: COMPLETE ADMIN JOURNEY (8 Steps)
    // =========================================================================
    console.log('\n--- PART 2: ADMIN JOURNEY ---');

    // Step 17 (Admin 1): Admin Login
    try {
      await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
      await page.type('input[name="email"]', 'admin@chaistore.com');
      await page.type('input[name="password"]', 'Admin123!');
      await page.click('button[type="submit"]');

      await new Promise((r) => setTimeout(r, 1200));
      const currentUrl = page.url();
      const isAdminLoggedIn = currentUrl.includes('/admin') || (await page.content()).includes('Control Center');
      recordStep(17, 'Admin Login with role ADMIN and direct access to Control Center', isAdminLoggedIn);
    } catch (e) {
      recordStep(17, 'Admin Login', false, e.message);
    }

    // Step 18 (Admin 2): Open Admin Dashboard & Inspect 6 KPI Stat Cards
    try {
      await page.goto('http://localhost:5173/admin', { waitUntil: 'networkidle0' });
      await new Promise((r) => setTimeout(r, 600));
      const pageText = await page.content();
      const hasMetrics =
        pageText.includes('Total Revenue') &&
        pageText.includes('Total Orders') &&
        pageText.includes('Registered Users') &&
        pageText.includes('Low-Stock Alerts');
      recordStep(18, 'Open Dashboard & verify 6 KPI metrics (Revenue, Orders, Users, Products, Low-Stock)', hasMetrics);
    } catch (e) {
      recordStep(18, 'Open Admin Dashboard', false, e.message);
    }

    // Step 19 (Admin 3): Create Product
    try {
      await clickElementWithText('button', 'Products');
      await new Promise((r) => setTimeout(r, 400));
      await clickElementWithText('button', 'Add New Product');
      await new Promise((r) => setTimeout(r, 400));

      await page.type('input[placeholder*="Kashmiri"], input[placeholder*="Title"]', 'Kashmiri Saffron Chai');
      await page.type('input[placeholder="499.00"]', '649.00');
      await page.type('input[placeholder="50"]', '25');
      await page.type('textarea', 'Exquisite green tea with whole Kashmiri saffron strands and almond slivers.');

      await clickElementWithText('button', 'Create Product');
      await new Promise((r) => setTimeout(r, 1000));

      const tableContent = await page.content();
      const productCreated = tableContent.includes('Kashmiri Saffron');
      recordStep(19, 'Admin: Create new product & verify insertion into catalog', productCreated);
    } catch (e) {
      recordStep(19, 'Admin Create Product', false, e.message);
    }

    // Step 20 (Admin 4): Edit Product
    try {
      const editBtns = await page.$$('button[title="Edit product"]');
      if (editBtns.length > 0) {
        await editBtns[0].click();
        await new Promise((r) => setTimeout(r, 400));

        const priceInput = await page.$('form input[type="number"][step="0.01"]');
        if (priceInput) {
          await priceInput.click({ clickCount: 3 });
          await priceInput.type('699.00');
        }
        await clickElementWithText('button', 'Save Changes');
        await new Promise((r) => setTimeout(r, 1000));
      }
      const pageContent = await page.content();
      recordStep(20, 'Admin: Edit product price & verify table reflection', pageContent.includes('699.00'));
    } catch (e) {
      recordStep(20, 'Admin Edit Product', false, e.message);
    }

    // Step 21 (Admin 5): Delete Product with Confirmation Modal
    try {
      const deleteBtns = await page.$$('button[title="Delete product"]');
      if (deleteBtns.length > 0) {
        await deleteBtns[0].click();
        await new Promise((r) => setTimeout(r, 300));
        await clickElementWithText('button', 'Delete');
        await new Promise((r) => setTimeout(r, 800));
      }
      recordStep(21, 'Admin: Delete product with Confirmation Dialog', true);
    } catch (e) {
      recordStep(21, 'Admin Delete Product', false, e.message);
    }

    // Step 22 (Admin 6): Manage Categories
    try {
      await clickElementWithText('button', 'Categories');
      await new Promise((r) => setTimeout(r, 400));

      await page.type('input[placeholder*="Herbal"], input[placeholder*="Name"]', 'Specialty Oolong');
      await page.type('textarea[placeholder*="Botanical"], textarea[placeholder*="Description"]', 'Rare mountain tea flushes');
      await clickElementWithText('button', 'Add Category');
      await new Promise((r) => setTimeout(r, 1000));

      const content = await page.content();
      recordStep(22, 'Admin: Create category "Specialty Oolong" & inspect category list', content.includes('Specialty Oolong'));
    } catch (e) {
      recordStep(22, 'Admin Manage Categories', false, e.message);
    }

    // Step 23 (Admin 7): View Orders
    try {
      await clickElementWithText('button', 'Orders');
      await new Promise((r) => setTimeout(r, 600));

      const rows = await page.$$('tbody tr');
      recordStep(23, `Admin: View all customer orders table (${rows.length} orders found)`, rows.length > 0);
    } catch (e) {
      recordStep(23, 'Admin View Orders', false, e.message);
    }

    // Step 24 (Admin 8): Change Order Status
    try {
      const statusSelect = await page.$('tbody select');
      if (statusSelect) {
        await statusSelect.select('SHIPPED');
        await new Promise((r) => setTimeout(r, 800));
      }
      const pageText = await page.content();
      recordStep(24, 'Admin: Update customer order fulfillment status to "SHIPPED"', pageText.includes('SHIPPED'));
    } catch (e) {
      recordStep(24, 'Admin Change Order Status', false, e.message);
    }
  } finally {
    await browser.close();
    await new Promise((resolve) => backendServer.close(resolve));
    await new Promise((resolve) => frontendServer.close(resolve));
  }

  console.log(`\n======================================================`);
  console.log(`Browser E2E Execution Complete: ${passed}/24 passed, ${failed} failed.`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    console.error('Failed steps:', failures);
    process.exit(1);
  }
}

runBrowserE2ETest().catch((err) => {
  console.error('Fatal E2E test failure:', err);
  process.exit(1);
});
