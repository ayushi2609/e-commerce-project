import { prisma } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';

export const createOrder = async (userId, addressId) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Verify address ownership
    const address = await tx.address.findUnique({
      where: { id: addressId },
    });

    if (!address || address.userId !== userId) {
      throw new ApiError(404, 'Invalid shipping address selected');
    }

    // 2. Fetch cart with items
    const cart = await tx.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new ApiError(400, 'Cannot place order: your cart is empty');
    }

    // 3. Verify stock availability and calculate total securely on the server
    let itemsSubtotal = 0;
    const orderItemsData = [];

    for (const item of cart.items) {
      const currentProduct = await tx.product.findUnique({
        where: { id: item.productId },
      });

      if (!currentProduct) {
        throw new ApiError(404, `Product "${item.product.name}" is no longer available`);
      }

      if (currentProduct.stock < item.quantity) {
        throw new ApiError(
          400,
          `Insufficient stock for "${currentProduct.name}". Available: ${currentProduct.stock}, Requested: ${item.quantity}`
        );
      }

      const itemPrice = Number(currentProduct.price);
      itemsSubtotal += itemPrice * item.quantity;

      orderItemsData.push({
        productId: item.productId,
        quantity: item.quantity,
        price: currentProduct.price,
      });

      // 4. Reduce stock
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    // Shipping logic: Free shipping over ₹999, else ₹99
    const shipping = itemsSubtotal > 999 ? 0 : 99;
    const totalAmount = itemsSubtotal + shipping;

    // 5. Create Order
    const order = await tx.order.create({
      data: {
        userId,
        addressId,
        totalAmount,
        status: 'CONFIRMED',
        orderItems: {
          create: orderItemsData,
        },
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: { id: true, name: true, image: true, price: true },
            },
          },
        },
        address: true,
      },
    });

    // 6. Clear user cart
    await tx.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return order;
  });
};

export const getCustomerOrders = async (userId) => {
  return await prisma.order.findMany({
    where: { userId },
    include: {
      orderItems: {
        include: {
          product: {
            select: { id: true, name: true, image: true },
          },
        },
      },
      address: true,
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const getOrderById = async (userId, orderId, isAdmin = false) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      orderItems: {
        include: {
          product: true,
        },
      },
      address: true,
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  if (!isAdmin && order.userId !== userId) {
    throw new ApiError(403, 'You do not have permission to view this order');
  }

  return order;
};

export const cancelOrder = async (userId, orderId) => {
  return await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { orderItems: true },
    });

    if (!order || order.userId !== userId) {
      throw new ApiError(404, 'Order not found');
    }

    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
      throw new ApiError(
        400,
        `Cannot cancel order in "${order.status}" status. Only PENDING or CONFIRMED orders can be cancelled.`
      );
    }

    // Restore inventory stock
    for (const item of order.orderItems) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            increment: item.quantity,
          },
        },
      });
    }

    // Update order status
    return await tx.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
      include: {
        orderItems: {
          include: { product: true },
        },
        address: true,
      },
    });
  });
};

export const getAllOrdersAdmin = async () => {
  return await prisma.order.findMany({
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      orderItems: {
        include: {
          product: {
            select: { id: true, name: true, image: true },
          },
        },
      },
      address: true,
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const updateOrderStatusAdmin = async (orderId, status) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  return await prisma.order.update({
    where: { id: orderId },
    data: { status },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      orderItems: {
        include: { product: true },
      },
      address: true,
    },
  });
};
