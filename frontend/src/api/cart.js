import api from './axios';

export const getCart = async () => {
  return api.get('/cart');
};

export const addToCartApi = async (productId, quantity = 1) => {
  return api.post('/cart/items', { productId, quantity });
};

export const updateCartItemApi = async (cartItemId, quantity) => {
  return api.put(`/cart/items/${cartItemId}`, { quantity });
};

export const removeCartItemApi = async (cartItemId) => {
  return api.delete(`/cart/items/${cartItemId}`);
};

export const clearCartApi = async () => {
  return api.delete('/cart');
};
