import { prisma } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';

export const getOrCreateCart = async (userId) => {
  let cart = await prisma.cart.findUnique({
    where: { userId },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
    });
  }

  return cart;
};

export const getCartDetails = async (userId) => {
  const cart = await getOrCreateCart(userId);

  const items = await prisma.cartItem.findMany({
    where: { cartId: cart.id },
    include: {
      product: {
        include: {
          category: {
            select: { id: true, name: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  let subtotal = 0;
  let totalQuantity = 0;

  const sanitizedItems = items.map((item) => {
    const itemPrice = Number(item.product.price);
    const itemTotal = itemPrice * item.quantity;
    const isOutOfStock = item.product.stock <= 0;
    const isExceedingStock = item.quantity > item.product.stock;

    subtotal += itemTotal;
    totalQuantity += item.quantity;

    return {
      id: item.id,
      cartId: item.cartId,
      productId: item.productId,
      quantity: item.quantity,
      itemTotal,
      isOutOfStock,
      isExceedingStock,
      availableStock: item.product.stock,
      product: {
        id: item.product.id,
        name: item.product.name,
        price: itemPrice,
        stock: item.product.stock,
        image: item.product.image,
        category: item.product.category,
      },
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  });

  return {
    cartId: cart.id,
    userId: cart.userId,
    items: sanitizedItems,
    subtotal: Number(subtotal.toFixed(2)),
    totalQuantity,
  };
};

export const addItemToCart = async (userId, productId, quantity = 1) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  if (product.stock <= 0) {
    throw new ApiError(400, `Cannot add to cart. "${product.name}" is currently out of stock.`);
  }

  const cart = await getOrCreateCart(userId);

  // Check if item already exists in cart
  const existingItem = await prisma.cartItem.findUnique({
    where: {
      cartId_productId: {
        cartId: cart.id,
        productId,
      },
    },
  });

  const newQuantity = existingItem ? existingItem.quantity + quantity : quantity;

  if (newQuantity > product.stock) {
    throw new ApiError(
      400,
      `Cannot add ${quantity} more item(s). Requested total (${newQuantity}) exceeds available stock (${product.stock}).`
    );
  }

  if (existingItem) {
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: newQuantity },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        quantity,
      },
    });
  }

  return getCartDetails(userId);
};

export const updateItemQuantity = async (userId, cartItemId, quantity) => {
  const cart = await getOrCreateCart(userId);

  const cartItem = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    include: { product: true },
  });

  if (!cartItem || cartItem.cartId !== cart.id) {
    throw new ApiError(404, 'Cart item not found in your cart');
  }

  if (quantity > cartItem.product.stock) {
    throw new ApiError(
      400,
      `Requested quantity (${quantity}) exceeds available stock (${cartItem.product.stock}) for "${cartItem.product.name}".`
    );
  }

  await prisma.cartItem.update({
    where: { id: cartItemId },
    data: { quantity },
  });

  return getCartDetails(userId);
};

export const removeItemFromCart = async (userId, cartItemId) => {
  const cart = await getOrCreateCart(userId);

  const cartItem = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
  });

  if (!cartItem || cartItem.cartId !== cart.id) {
    throw new ApiError(404, 'Cart item not found in your cart');
  }

  await prisma.cartItem.delete({
    where: { id: cartItemId },
  });

  return getCartDetails(userId);
};

export const clearUserCart = async (userId) => {
  const cart = await getOrCreateCart(userId);

  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id },
  });

  return {
    cartId: cart.id,
    userId: cart.userId,
    items: [],
    subtotal: 0,
    totalQuantity: 0,
  };
};
