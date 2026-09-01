import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as cartService from '../services/cart.service.js';

export const getCart = asyncHandler(async (req, res) => {
  const cart = await cartService.getCartDetails(req.user.id);
  return res.status(200).json(
    new ApiResponse(200, { cart }, 'Shopping cart retrieved successfully')
  );
});

export const addItem = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  const cart = await cartService.addItemToCart(req.user.id, productId, quantity);
  return res.status(200).json(
    new ApiResponse(200, { cart }, 'Item added to cart')
  );
});

export const updateItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;
  const cart = await cartService.updateItemQuantity(req.user.id, id, quantity);
  return res.status(200).json(
    new ApiResponse(200, { cart }, 'Cart item updated')
  );
});

export const removeItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const cart = await cartService.removeItemFromCart(req.user.id, id);
  return res.status(200).json(
    new ApiResponse(200, { cart }, 'Item removed from cart')
  );
});

export const clearCart = asyncHandler(async (req, res) => {
  const cart = await cartService.clearUserCart(req.user.id);
  return res.status(200).json(
    new ApiResponse(200, { cart }, 'Cart cleared successfully')
  );
});
