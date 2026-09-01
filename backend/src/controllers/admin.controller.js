import { prisma } from '../config/db.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getAdminAnalytics = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalProducts,
    totalOrders,
    completedOrders,
    pendingOrders,
    lowStockProducts,
    recentOrders,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.product.count(),
    prisma.order.count(),
    prisma.order.findMany({
      where: { status: { not: 'CANCELLED' } },
      select: { totalAmount: true },
    }),
    prisma.order.count({
      where: { status: { in: ['PENDING', 'CONFIRMED', 'PROCESSING'] } },
    }),
    prisma.product.findMany({
      where: { stock: { lte: 10 } },
      include: {
        category: { select: { name: true } },
      },
      orderBy: { stock: 'asc' },
      take: 10,
    }),
    prisma.order.findMany({
      include: {
        user: { select: { name: true, email: true } },
        orderItems: {
          include: {
            product: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  const totalRevenue = completedOrders.reduce(
    (acc, order) => acc + Number(order.totalAmount),
    0
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        metrics: {
          totalUsers,
          totalProducts,
          totalOrders,
          totalRevenue: Number(totalRevenue.toFixed(2)),
          pendingOrders,
          lowStockCount: lowStockProducts.length,
        },
        lowStockProducts,
        recentOrders,
      },
      'Admin analytics retrieved successfully'
    )
  );
});

export const getAdminUsers = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          orders: true,
          addresses: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return res.status(200).json(
    new ApiResponse(200, { users }, 'Admin user list retrieved successfully')
  );
});
