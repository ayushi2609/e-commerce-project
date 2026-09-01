import api from './axios';

export const createOrder = async (orderData) => {
  return api.post('/orders', orderData);
};

export const getMyOrders = async () => {
  return api.get('/orders/my-orders');
};

export const getOrderById = async (id) => {
  return api.get(`/orders/${id}`);
};

export const cancelOrder = async (id) => {
  return api.post(`/orders/${id}/cancel`);
};

export const getAllOrdersAdmin = async () => {
  return api.get('/orders/admin/all');
};

export const updateOrderStatusAdmin = async (id, status) => {
  return api.patch(`/orders/admin/${id}/status`, { status });
};
