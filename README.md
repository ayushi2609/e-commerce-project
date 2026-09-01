# 🍵 ChaiStore — Artisanal Tea E-Commerce Platform

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/react-18.3.1-blue.svg)](https://reactjs.org/)
[![Prisma ORM](https://img.shields.io/badge/prisma-5.22.0-indigo.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/database-PostgreSQL-336791.svg)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/styling-Tailwind%20CSS-38bdf8.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

**ChaiStore** is a production-quality, full-stack e-commerce web application engineered for artisanal tea connoisseurs. Built with a decoupled **React.js + Tailwind CSS** frontend and a modular **Node.js + Express + Prisma ORM + PostgreSQL** backend, featuring atomic database transactions, role-based access control (RBAC), and multi-tenant data isolation.

---

## 📑 Table of Contents

1. [Key Features](#-key-features)
2. [Tech Stack](#-tech-stack)
3. [Architecture & Design Decisions](#-architecture--design-decisions)
4. [Project Structure](#-project-structure)
5. [Prerequisites](#-prerequisites)
6. [Environment Variables](#-environment-variables)
7. [Database Setup & Migrations](#-database-setup--migrations)
8. [Installation & Local Setup](#-installation--local-setup)
9. [REST API Documentation](#-rest-api-documentation)
10. [Automated Test Suites](#-automated-test-suites)
11. [Security Hardening](#-security-hardening)
12. [Future Improvements](#-future-improvements)

---

## ✨ Key Features

### 🛍️ Customer Journey
- **Hero & Curated Collections**: High-impact SaaS aesthetic with value props (*Free Express Shipping*, *100% Organic*, *Freshness Guarantee*).
- **Interactive Shop Catalog**: Real-time keyword search with instant debounced results, category sidebar filtering, and dynamic sorting (Newest, Price Low/High, Name).
- **Rich Product Detail Pages**: High-resolution image preview, 5-star customer ratings, live inventory indicators, quantity steppers, and interactive accordions for *Brewing Guides* and *Shipping Policies*.
- **Shopping Cart**: Real-time subtotal calculations, free express shipping progress bar ($\ge \text{₹999}$), promo code simulator (`CHAI10` for 10% discount), and inventory over-allocation safeguards.
- **3-Step Checkout**:
  1. *Shipping Address*: Select verified address or add a new delivery location inline.
  2. *Payment Options*: Cash on Delivery (COD) / UPI arrival payment.
  3. *Order Review*: Server-calculated pricing validation.
- **Order Tracking & Receipt**: Instant order confirmation receipt, 4-step live fulfillment progress tracker (`CONFIRMED` $\to$ `PROCESSING` $\to$ `SHIPPED` $\to$ `DELIVERED`), and self-service order cancellation with automatic inventory stock recovery.
- **Account & Address Book**: Profile management, multiple shipping addresses CRUD, and complete order history.

### 🛡️ Administrator Control Center
- **6 Real-Time KPI Metric Cards**: Total Revenue, Total Orders, Pending Orders, Registered Users, Active Products, and Low-Stock Alerts ($\le 10$ units).
- **Low-Stock Inventory Monitor**: Real-time table alerting admins of dwindling inventory with 1-click inline stock adjusters.
- **Product Management**: Full catalog table with search, inline stock editor, Add/Edit product modals with Zod validation, and delete confirmation dialogs.
- **Category Management**: Category creation and active product count trackers.
- **Order Fulfillment**: Order search, status filter pills, itemized invoice modals, and order status transition selectors.
- **User Directory**: List of registered customers, account roles, and order counts.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React.js 18 (Vite SPA)
- **Styling**: Tailwind CSS with custom animations and Glassmorphism
- **Icons**: Lucide React
- **Routing**: React Router DOM (v6) with Protected Route Guards
- **HTTP Client**: Axios with global interceptors and automatic Bearer token injection
- **State Management**: Context API (`AuthContext`, `CartContext`, `ToastContext`)

### Backend
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: PostgreSQL (Mandatory)
- **ORM**: Prisma ORM (v5.22.0)
- **Authentication**: JWT (`jsonwebtoken`) & Password Hashing (`bcryptjs`)
- **Validation**: Zod
- **Security**: Helmet, CORS whitelist, Express Rate Limit

---

## 🏛️ Architecture & Design Decisions

```
┌─────────────────────────┐                                           ┌─────────────────────────┐
│ React Frontend (Vite)   │                                           │ Express & Node Backend  │
│ - Chunked Assets (dist/)│ ── [REST /api/v1 (CORS & Rate Limited)] ──> │ - Helmet & Rate Limiter │
│ - Relative API Fallback │                                           │ - JWT Auth & RBAC       │
│ - Toast & Skeleton UX   │                                           │ - Prisma ORM            │
│ - Multi-Tenant State    │                                           │ - Database Transactions │
└─────────────────────────┘                                           └────────────┬────────────┘
                                                                                   │
                                                                                   ▼
                                                                      ┌─────────────────────────┐
                                                                      │ PostgreSQL Database     │
                                                                      │ - Users, Roles, Address │
                                                                      │ - Products, Categories  │
                                                                      │ - Carts & CartItems     │
                                                                      │ - Orders & OrderItems   │
                                                                      └─────────────────────────┘
```

1. **Transactional Order Integrity**: Order placement is wrapped inside `prisma.$transaction`. The server independently verifies product availability, recalculates totals from database prices, decrements stock atomically, inserts order and line item records, and clears the cart in a single atomic commit.
2. **Strict Server-Side Price Calculation**: Frontend-submitted prices or totals are completely discarded by the backend to prevent client tampering.
3. **Multi-Tenant User Isolation**: Cart items and customer orders are scoped strictly to `req.user.id`, preventing Insecure Direct Object References (IDOR).
4. **Resilient Database Layer**: Supports live PostgreSQL with an automated in-memory repository fallback for browser testing when a local database server is offline.

---

## 📁 Project Structure

```text
E-Commerce_Project/
├── backend/
│   ├── prisma/
│   │   ├── migrations/          # PostgreSQL migrations
│   │   ├── schema.prisma        # Database schema
│   │   └── seed.js              # Seed data script
│   ├── src/
│   │   ├── config/              # DB & Environment configs
│   │   ├── controllers/         # REST API Route Handlers
│   │   ├── middleware/          # Auth, RBAC, Validation, Error, Rate Limiting
│   │   ├── routes/              # Express API Routes
│   │   ├── services/            # Transactional business logic
│   │   ├── utils/               # ApiError, ApiResponse, JWT & Bcrypt utilities
│   │   ├── validations/         # Zod schemas
│   │   ├── app.js               # Express application configuration
│   │   └── server.js            # Server entry point & graceful shutdown
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/                 # Axios service modules
│   │   ├── components/          # Reusable UI, Navbar, Footer, Skeletons
│   │   ├── context/             # AuthContext, CartContext, ToastContext
│   │   ├── pages/               # Home, Shop, ProductDetail, Cart, Checkout, Orders, Admin
│   │   ├── routes/              # AppRoutes with ProtectedRoute guards
│   │   ├── App.jsx
│   │   ├── index.css            # Tailwind directives and Glassmorphism
│   │   └── main.jsx
│   ├── .env.example
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
├── docker-compose.yml           # PostgreSQL 16 local container
├── .gitignore
├── .env.example
└── README.md
```

---

## 📋 Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **PostgreSQL**: v14.0 or higher (or Docker)

---

## ⚙️ Environment Variables

Create `.env` in `backend/` and `frontend/` using the provided `.env.example` templates:

### Backend (`backend/.env`):
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ecommerce_db?schema=public"
JWT_ACCESS_SECRET="super_secret_access_jwt_key_at_least_32_characters_long_12345"
JWT_REFRESH_SECRET="super_secret_refresh_jwt_key_at_least_32_characters_long_67890"
JWT_ACCESS_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN="http://localhost:5173"
```

### Frontend (`frontend/.env`):
```env
VITE_API_URL="http://localhost:5000/api/v1"
```

---

## 🗄️ Database Setup & Migrations

1. **Start PostgreSQL with Docker (Optional)**:
   ```bash
   docker-compose up -d
   ```

2. **Generate Prisma Client & Apply Migrations**:
   ```bash
   cd backend
   npm run prisma:generate
   npx prisma migrate dev --name init
   ```

3. **Seed Demo Data**:
   ```bash
   npm run prisma:seed
   ```

---

## 🚀 Installation & Local Setup

### 1. Clone the repository:
```bash
git clone https://github.com/your-username/ecommerce-chaistore.git
cd ecommerce-chaistore
```

### 2. Setup Backend:
```bash
cd backend
npm install
npm run dev
```
*Backend runs on `http://localhost:5000`*

### 3. Setup Frontend:
```bash
cd ../frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`*

### 4. Default Seed Accounts:
- **Admin Account**: `admin@chaistore.com` / `Admin123!`
- **Customer Account**: `customer@chaistore.com` / `Password123!`

---

## 📡 REST API Documentation

Base Endpoint: `/api/v1`

### Authentication (`/auth`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Register customer account | Public |
| `POST` | `/auth/login` | Authenticate and issue JWT tokens | Public |
| `GET` | `/auth/me` | Fetch authenticated profile & addresses | Customer / Admin |
| `POST` | `/auth/logout` | Invalidate active session | Customer / Admin |

### Products & Categories (`/products`, `/categories`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/products` | Filter, search, and sort product catalog | Public |
| `GET` | `/products/:id` | Get single product details | Public |
| `POST` | `/products` | Create new product | Admin |
| `PUT` | `/products/:id` | Update product details | Admin |
| `PATCH` | `/products/:id/stock` | Inline stock quantity adjustment | Admin |
| `DELETE` | `/products/:id` | Delete product from catalog | Admin |
| `GET` | `/categories` | List all categories with product counts | Public |
| `POST` | `/categories` | Create new category | Admin |
| `DELETE` | `/categories/:id` | Delete category | Admin |

### Shopping Cart (`/cart`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/cart` | View user's isolated shopping cart | Customer |
| `POST` | `/cart/items` | Add product to cart with stock validation | Customer |
| `PUT` | `/cart/items/:id` | Update cart item quantity | Customer |
| `DELETE` | `/cart/items/:id` | Remove line item from cart | Customer |
| `DELETE` | `/cart` | Clear entire shopping cart | Customer |

### Shipping Addresses & Orders (`/addresses`, `/orders`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/addresses` | List user's saved delivery addresses | Customer |
| `POST` | `/addresses` | Add new shipping address | Customer |
| `DELETE` | `/addresses/:id` | Delete shipping address | Customer |
| `POST` | `/orders` | Atomic transaction checkout & stock reduction | Customer |
| `GET` | `/orders/my-orders` | Fetch customer order history | Customer |
| `GET` | `/orders/:id` | Fetch itemized order invoice & timeline | Customer / Admin |
| `POST` | `/orders/:id/cancel` | Cancel order & restore inventory stock | Customer |
| `GET` | `/orders/admin/all` | View all customer orders | Admin |
| `PATCH` | `/orders/admin/:id/status` | Update fulfillment status | Admin |

### Administrator Control Center (`/admin`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/admin/analytics` | Fetch revenue, order counts, and low-stock monitor | Admin |
| `GET` | `/admin/users` | List registered customers & order statistics | Admin |

---

## 🧪 Automated Test Suites

The repository contains 117 automated unit, integration, security, and browser E2E tests:

```bash
# Run complete test suite (Auth, Products, Cart, Orders, Admin, Security, Browser)
cd backend
npm run test:all
```

```
🧪 Authentication & Security Suite:           17 / 17 PASSED
🍵 Product & Category Management Suite:       13 / 13 PASSED
🛒 Shopping Cart System & Isolation Suite:    14 / 14 PASSED
📦 Checkout & Transactional Order Suite:      11 / 11 PASSED
🛡️ Admin Analytics & Management Suite:         5 /  5 PASSED
🔒 Security Audit & Privacy Suite:            12 / 12 PASSED
⚡ Edge-Case API Matrix Test Suite:           21 / 21 PASSED
🚀 Real Chromium Browser E2E Automation:      24 / 24 PASSED
==============================================================
Total Full-Stack Verification:               117 / 117 PASSED (100%)
==============================================================
```

---

## 🔒 Security Hardening

- **Bcrypt Password Hashing**: Passwords hashed with 10 salt rounds; plain-text passwords never stored.
- **Password Hash Redaction**: API responses explicitly exclude password hashes across registration, login, and profile fetching.
- **Zero Hardcoded Secrets**: Secrets validated strictly at startup from environment variables.
- **Brute-Force Defence**: `express-rate-limit` prevents credential-stuffing on `/auth/login` and `/auth/register`.
- **Multi-Tenant Protection**: Strict tenant scoping on carts, addresses, and orders preventing IDOR attacks.
- **Server Pricing Integrity**: Order total calculations performed strictly on server; client price inputs are discarded.
- **SQL / ORM Injection Prevention**: All database interactions execute via parameterized queries in Prisma ORM.

---

## 🔮 Future Improvements

- [ ] **Stripe / Razorpay Integration**: Automated payment gateway webhook callbacks.
- [ ] **Email Notifications**: Transactional order confirmation emails via Resend / SendGrid.
- [ ] **Customer Product Reviews**: Verified customer star ratings and image review uploads.
- [ ] **Wishlist System**: Save favorite blends for future purchases.
- [ ] **Redis Caching**: Cache catalog listings and category queries for high-scale throughput.

---

## 📄 License

This project is licensed under the **MIT License**.
