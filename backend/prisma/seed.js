import { PrismaClient, Role, OrderStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clean existing records (in reverse relation order)
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.address.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // 2. Hash default passwords
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 3. Create Admin & Customer Users
  const admin = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@chaistore.com',
      password: passwordHash,
      role: Role.ADMIN,
    },
  });

  const customer = await prisma.user.create({
    data: {
      name: 'Jane Doe',
      email: 'customer@chaistore.com',
      password: passwordHash,
      role: Role.CUSTOMER,
      cart: {
        create: {},
      },
      addresses: {
        create: {
          addressLine: '42 Tea Garden Lane',
          city: 'Darjeeling',
          state: 'West Bengal',
          postalCode: '734101',
          country: 'India',
        },
      },
    },
  });

  console.log(`👤 Created Users: Admin (${admin.email}), Customer (${customer.email})`);

  // 4. Create Categories
  const blackTeaCategory = await prisma.category.create({
    data: {
      name: 'Black Tea',
      description: 'Full-bodied and rich loose leaf black teas sourced from premium estates.',
    },
  });

  const greenTeaCategory = await prisma.category.create({
    data: {
      name: 'Green Tea',
      description: 'Delicate, antioxidant-rich fresh green teas and matcha.',
    },
  });

  const herbalCategory = await prisma.category.create({
    data: {
      name: 'Herbal & Infusions',
      description: 'Caffeine-free botanical blends, soothing chamomile, and spices.',
    },
  });

  console.log('🏷️ Created Categories');

  // 5. Create Products
  const products = [
    {
      name: 'Royal Masala Chai Blend',
      description: 'Traditional Indian spiced black tea with crushed cardamom, cinnamon, cloves, and ginger.',
      price: 349.00,
      stock: 50,
      image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',
      categoryId: blackTeaCategory.id,
    },
    {
      name: 'Darjeeling First Flush Autumn Reserve',
      description: 'Exquisite single-estate muscatel floral tea from the high Himalayas.',
      price: 599.00,
      stock: 35,
      image: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=800&q=80',
      categoryId: blackTeaCategory.id,
    },
    {
      name: 'Organic Ceremonial Matcha',
      description: 'Stone-ground, vibrant shade-grown Uji green tea powder with smooth umami notes.',
      price: 899.00,
      stock: 20,
      image: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=800&q=80',
      categoryId: greenTeaCategory.id,
    },
    {
      name: 'Himalayan Jasmine Green Pearls',
      description: 'Hand-rolled tender green tea pearls naturally scented with midnight jasmine blossoms.',
      price: 499.00,
      stock: 40,
      image: 'https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?auto=format&fit=crop&w=800&q=80',
      categoryId: greenTeaCategory.id,
    },
    {
      name: 'Ayurvedic Ashwagandha & Tulsi Infusion',
      description: 'Restorative herbal blend designed to calm the mind and strengthen vitality.',
      price: 399.00,
      stock: 60,
      image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80',
      categoryId: herbalCategory.id,
    },
  ];

  for (const prod of products) {
    await prisma.product.create({ data: prod });
  }

  console.log(`📦 Created ${products.length} Products`);
  console.log('✅ Database seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
