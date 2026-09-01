import api from './axios';

// Categories
export const getCategories = async () => {
  return api.get('/categories');
};

export const createCategory = async (data) => {
  return api.post('/categories', data);
};

export const deleteCategory = async (id) => {
  return api.delete(`/categories/${id}`);
};

// Products
export const getProducts = async (params = {}) => {
  return api.get('/products', { params });
};

export const getProductById = async (id) => {
  return api.get(`/products/${id}`);
};

export const createProduct = async (productData) => {
  return api.post('/products', productData);
};

export const updateProduct = async (id, productData) => {
  return api.put(`/products/${id}`, productData);
};

export const updateProductStock = async (id, stock) => {
  return api.patch(`/products/${id}/stock`, { stock });
};

export const deleteProduct = async (id) => {
  return api.delete(`/products/${id}`);
};
