import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as orderService from '../services/order.service.js';

export const createOrder = asyncHandler(async (req, res) => {
  const { addressId } = req.body;
  const order = await orderService.createOrder(req.user.id, addressId);
  return res.status(201).json(
    new ApiResponse(201, { order }, 'Order placed successfully')
  );
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await orderService.getCustomerOrders(req.user.id);
  return res.status(200).json(
    new ApiResponse(200, { orders }, 'Orders retrieved successfully')
  );
});

export const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isAdmin = req.user.role === 'ADMIN';
  const order = await orderService.getOrderById(req.user.id, id, isAdmin);
  return res.status(200).json(
    new ApiResponse(200, { order }, 'Order details retrieved successfully')
  );
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await orderService.cancelOrder(req.user.id, id);
  return res.status(200).json(
    new ApiResponse(200, { order }, 'Order cancelled successfully')
  );
});

// Admin Controllers
export const getAllOrdersAdmin = asyncHandler(async (req, res) => {
  const orders = await orderService.getAllOrdersAdmin();
  return res.status(200).json(
    new ApiResponse(200, { orders }, 'All orders retrieved for admin')
  );
});

export const updateOrderStatusAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const order = await orderService.updateOrderStatusAdmin(id, status);
  return res.status(200).json(
    new ApiResponse(200, { order }, 'Order status updated successfully')
  );
});
