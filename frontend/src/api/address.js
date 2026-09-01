import api from './axios';

export const getAddresses = async () => {
  return api.get('/addresses');
};

export const createAddress = async (addressData) => {
  return api.post('/addresses', addressData);
};

export const deleteAddress = async (id) => {
  return api.delete(`/addresses/${id}`);
};
