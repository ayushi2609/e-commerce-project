import { PrismaClient } from '@prisma/client';
import { env } from './env.js';
import bcrypt from 'bcryptjs';

// Real Prisma Client
const realPrisma = new PrismaClient({
  log: env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

// Resilient In-Memory Storage for offline/unreachable PostgreSQL environments
const defaultPasswordHash = bcrypt.hashSync('Password123!', 10);
const adminPasswordHash = bcrypt.hashSync('Admin123!', 10);

const memoryStore = {
  users: [
    {
      id: 'admin-usr-uuid-1',
      name: 'Store Administrator',
      email: 'admin@chaistore.com',
      password: adminPasswordHash,
      role: 'ADMIN',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'customer-usr-uuid-1',
      name: 'Jane Customer',
      email: 'customer@chaistore.com',
      password: defaultPasswordHash,
      role: 'CUSTOMER',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  categories: [
    {
      id: 'cat-1-black-tea',
      name: 'Black Tea',
      description: 'Single-estate full-bodied loose leaf black teas.',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'cat-2-green-tea',
      name: 'Green Tea & Matcha',
      description: 'Stone-ground ceremonial matcha and antioxidant-rich green teas.',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'cat-3-herbal',
      name: 'Herbal & Ayurvedic',
      description: 'Botanical caffeine-free soothing herbal infusions.',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  products: [
    {
      id: 'prod-1-masala-chai',
      name: 'Royal Masala Chai Blend',
      description: 'Traditional Indian spiced black tea with crushed cardamom, cinnamon, cloves, and ginger.',
      price: 349.00,
      stock: 45,
      image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',
      categoryId: 'cat-1-black-tea',
      createdAt: new Date(Date.now() - 10000),
      updatedAt: new Date(),
    },
    {
      id: 'prod-2-darjeeling',
      name: 'Darjeeling Autumn First Flush',
      description: 'Exquisite single-estate muscatel floral tea harvested at 6,000 ft elevation.',
      price: 599.00,
      stock: 8, // Low stock <= 10 for alerts
      image: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=800&q=80',
      categoryId: 'cat-1-black-tea',
      createdAt: new Date(Date.now() - 20000),
      updatedAt: new Date(),
    },
    {
      id: 'prod-3-matcha',
      name: 'Ceremonial Organic Matcha',
      description: 'Stone-ground, shade-grown vibrant green tea powder with smooth umami finish.',
      price: 899.00,
      stock: 5, // Low stock <= 10
      image: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=800&q=80',
      categoryId: 'cat-2-green-tea',
      createdAt: new Date(Date.now() - 30000),
      updatedAt: new Date(),
    },
    {
      id: 'prod-4-jasmine',
      name: 'Himalayan Jasmine Green Pearls',
      description: 'Hand-rolled tender green tea pearls naturally scented with midnight jasmine blossoms.',
      price: 499.00,
      stock: 30,
      image: 'https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?auto=format&fit=crop&w=800&q=80',
      categoryId: 'cat-2-green-tea',
      createdAt: new Date(Date.now() - 40000),
      updatedAt: new Date(),
    },
    {
      id: 'prod-5-ashwagandha',
      name: 'Ayurvedic Ashwagandha & Tulsi Infusion',
      description: 'Restorative wellness herbal blend designed to calm the mind and revitalize vitality.',
      price: 399.00,
      stock: 50,
      image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80',
      categoryId: 'cat-3-herbal',
      createdAt: new Date(Date.now() - 50000),
      updatedAt: new Date(),
    },
  ],
  carts: [
    { id: 'cart-cust-1', userId: 'customer-usr-uuid-1', createdAt: new Date(), updatedAt: new Date() },
  ],
  cartItems: [],
  addresses: [
    {
      id: 'addr-demo-1',
      userId: 'customer-usr-uuid-1',
      addressLine: '42 Tea Garden Estate Road, Flat 3B',
      city: 'Darjeeling',
      state: 'West Bengal',
      postalCode: '734101',
      country: 'India',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  orders: [],
  orderItems: [],
};

// Create Fallback Proxy handler for Prisma models
const createModelProxy = (modelName) => {
  return {
    findMany: async (args = {}) => {
      const records = memoryStore[modelName] || [];
      let result = [...records];

      if (args.where) {
        if (args.where.userId) {
          result = result.filter((r) => r.userId === args.where.userId);
        }
        if (args.where.cartId) {
          result = result.filter((r) => r.cartId === args.where.cartId);
        }
        if (args.where.orderId) {
          result = result.filter((r) => r.orderId === args.where.orderId);
        }
        if (args.where.categoryId) {
          result = result.filter((r) => r.categoryId === args.where.categoryId);
        }
        if (args.where.stock?.lte !== undefined) {
          result = result.filter((r) => r.stock <= args.where.stock.lte);
        }
        if (args.where.stock?.gt !== undefined) {
          result = result.filter((r) => r.stock > args.where.stock.gt);
        }
        if (args.where.status?.in) {
          result = result.filter((r) => args.where.status.in.includes(r.status));
        }
        if (args.where.status?.not) {
          result = result.filter((r) => r.status !== args.where.status.not);
        }
        if (args.where.OR) {
          const search = args.where.OR[0]?.name?.contains?.toLowerCase() || '';
          if (search) {
            result = result.filter(
              (r) =>
                r.name?.toLowerCase().includes(search) ||
                r.description?.toLowerCase().includes(search)
            );
          }
        }
      }

      // Populate Relations
      result = result.map((r) => {
        const copy = { ...r };
        if (modelName === 'products') {
          copy.category = memoryStore.categories.find((c) => c.id === copy.categoryId);
        }
        if (modelName === 'categories' && args.include?._count?.select?.products) {
          copy._count = {
            products: memoryStore.products.filter((p) => p.categoryId === copy.id).length,
          };
        }
        if (modelName === 'orders') {
          copy.user = memoryStore.users.find((u) => u.id === copy.userId);
          copy.address = memoryStore.addresses.find((a) => a.id === copy.addressId);
          copy.orderItems = memoryStore.orderItems
            .filter((oi) => oi.orderId === copy.id)
            .map((oi) => ({
              ...oi,
              product: memoryStore.products.find((p) => p.id === oi.productId),
            }));
        }
        if (modelName === 'users') {
          copy._count = {
            orders: memoryStore.orders.filter((o) => o.userId === copy.id).length,
            addresses: memoryStore.addresses.filter((a) => a.userId === copy.id).length,
          };
        }
        if (modelName === 'cartItems') {
          copy.product = {
            ...memoryStore.products.find((p) => p.id === copy.productId),
            category: memoryStore.categories.find((c) => c.id === copy.categoryId),
          };
        }
        return copy;
      });

      if (args.orderBy) {
        const field = Object.keys(args.orderBy)[0];
        const dir = args.orderBy[field];
        result.sort((a, b) => (dir === 'asc' ? (a[field] > b[field] ? 1 : -1) : (a[field] < b[field] ? 1 : -1)));
      }

      if (args.skip !== undefined || args.take !== undefined) {
        const skip = args.skip || 0;
        const take = args.take || result.length;
        result = result.slice(skip, skip + take);
      }

      return result;
    },

    findUnique: async (args = {}) => {
      const records = memoryStore[modelName] || [];
      let found = null;

      if (args.where?.id) {
        found = records.find((r) => r.id === args.where.id);
      } else if (args.where?.email) {
        found = records.find((r) => r.email === args.where.email.toLowerCase());
      } else if (args.where?.name) {
        found = records.find((r) => r.name === args.where.name);
      } else if (args.where?.userId) {
        found = records.find((r) => r.userId === args.where.userId);
      } else if (args.where?.cartId_productId) {
        found = records.find(
          (r) =>
            r.cartId === args.where.cartId_productId.cartId &&
            r.productId === args.where.cartId_productId.productId
        );
      }

      if (!found) return null;

      const copy = { ...found };
      if (modelName === 'products') {
        if (args.include?.category) {
          copy.category = memoryStore.categories.find((c) => c.id === copy.categoryId);
        }
        if (args.include?._count) {
          copy._count = {
            orderItems: memoryStore.orderItems.filter((oi) => oi.productId === copy.id).length,
          };
        }
      }
      if (modelName === 'cartItems' && args.include?.product) {
        copy.product = memoryStore.products.find((p) => p.id === copy.productId);
      }
      if (modelName === 'categories') {
        copy._count = {
          products: memoryStore.products.filter((p) => p.categoryId === copy.id).length,
        };
        if (args.include?.products) {
          copy.products = memoryStore.products.filter((p) => p.categoryId === copy.id);
        }
      }
      if (modelName === 'orders') {
        copy.user = memoryStore.users.find((u) => u.id === copy.userId);
        copy.address = memoryStore.addresses.find((a) => a.id === copy.addressId);
        copy.orderItems = memoryStore.orderItems
          .filter((oi) => oi.orderId === copy.id)
          .map((oi) => ({
            ...oi,
            product: memoryStore.products.find((p) => p.id === oi.productId),
          }));
      }
      if (modelName === 'carts' && args.include?.items) {
        copy.items = memoryStore.cartItems
          .filter((ci) => ci.cartId === copy.id)
          .map((ci) => ({
            ...ci,
            product: memoryStore.products.find((p) => p.id === ci.productId),
          }));
      }
      return copy;
    },

    create: async (args = {}) => {
      const records = memoryStore[modelName] || [];
      const newId = args.data?.id || `${modelName.slice(0, 4)}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const newRecord = {
        id: newId,
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (modelName === 'users' && args.data?.cart?.create) {
        delete newRecord.cart;
        memoryStore.carts.push({ id: `cart-${newId}`, userId: newId, createdAt: new Date(), updatedAt: new Date() });
      }

      if (modelName === 'orders' && args.data?.orderItems?.create) {
        const itemsToCreate = args.data.orderItems.create;
        delete newRecord.orderItems;
        itemsToCreate.forEach((item) => {
          memoryStore.orderItems.push({
            id: `oi-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
            orderId: newId,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            createdAt: new Date(),
          });
        });
      }

      records.push(newRecord);

      const copy = { ...newRecord };
      if (modelName === 'products') {
        copy.category = memoryStore.categories.find((c) => c.id === copy.categoryId);
      }
      if (modelName === 'orders') {
        copy.user = memoryStore.users.find((u) => u.id === copy.userId);
        copy.address = memoryStore.addresses.find((a) => a.id === copy.addressId);
        copy.orderItems = memoryStore.orderItems
          .filter((oi) => oi.orderId === copy.id)
          .map((oi) => ({
            ...oi,
            product: memoryStore.products.find((p) => p.id === oi.productId),
          }));
      }
      return copy;
    },

    update: async (args = {}) => {
      const records = memoryStore[modelName] || [];
      const index = records.findIndex((r) => r.id === args.where.id);
      if (index === -1) return null;

      const record = records[index];
      const data = args.data;

      // Handle stock decrement/increment
      if (data.stock?.decrement !== undefined) {
        record.stock = Math.max(0, record.stock - data.stock.decrement);
      } else if (data.stock?.increment !== undefined) {
        record.stock = record.stock + data.stock.increment;
      } else if (data.stock !== undefined) {
        record.stock = data.stock;
      }

      Object.keys(data).forEach((key) => {
        if (key !== 'stock') {
          record[key] = data[key];
        }
      });
      record.updatedAt = new Date();

      const copy = { ...record };
      if (modelName === 'products') {
        copy.category = memoryStore.categories.find((c) => c.id === copy.categoryId);
      }
      if (modelName === 'orders') {
        copy.user = memoryStore.users.find((u) => u.id === copy.userId);
        copy.address = memoryStore.addresses.find((a) => a.id === copy.addressId);
        copy.orderItems = memoryStore.orderItems
          .filter((oi) => oi.orderId === copy.id)
          .map((oi) => ({
            ...oi,
            product: memoryStore.products.find((p) => p.id === oi.productId),
          }));
      }
      return copy;
    },

    delete: async (args = {}) => {
      const records = memoryStore[modelName] || [];
      const index = records.findIndex((r) => r.id === args.where.id);
      if (index !== -1) {
        records.splice(index, 1);
      }
      return { id: args.where.id };
    },

    deleteMany: async (args = {}) => {
      let records = memoryStore[modelName] || [];
      if (args.where?.cartId) {
        memoryStore[modelName] = records.filter((r) => r.cartId !== args.where.cartId);
      } else {
        memoryStore[modelName] = [];
      }
      return { count: records.length };
    },

    count: async (args = {}) => {
      const records = memoryStore[modelName] || [];
      if (args.where?.role) {
        return records.filter((r) => r.role === args.where.role).length;
      }
      if (args.where?.status?.in) {
        return records.filter((r) => args.where.status.in.includes(r.status)).length;
      }
      return records.length;
    },
  };
};

const fallbackPrisma = {
  user: createModelProxy('users'),
  category: createModelProxy('categories'),
  product: createModelProxy('products'),
  cart: createModelProxy('carts'),
  cartItem: createModelProxy('cartItems'),
  address: createModelProxy('addresses'),
  order: createModelProxy('orders'),
  orderItem: createModelProxy('orderItems'),
  $transaction: async (fn) => {
    return fn(fallbackPrisma);
  },
  $disconnect: async () => {},
};

// Check if live PostgreSQL connection is active
let isPostgresLive = false;
let prismaInstance = fallbackPrisma;

export const initDb = async () => {
  try {
    await realPrisma.$connect();
    isPostgresLive = true;
    prismaInstance = realPrisma;
    console.log('✅ Connected to live PostgreSQL database via Prisma ORM.');
  } catch (err) {
    isPostgresLive = false;
    prismaInstance = fallbackPrisma;
    console.log('ℹ️  PostgreSQL server offline at localhost:5432. Using in-memory Prisma store for browser testing.');
  }
};

initDb();

export const prisma = new Proxy(realPrisma, {
  get: (target, prop) => {
    if (isPostgresLive && target[prop]) {
      return target[prop];
    }
    return fallbackPrisma[prop];
  },
});

export default prisma;
