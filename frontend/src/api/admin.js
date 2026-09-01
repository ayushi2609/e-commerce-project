import api from './axios';

export const getAdminAnalytics = async () => {
  return api.get('/admin/analytics');
};

export const getAdminUsers = async () => {
  return api.get('/admin/users');
};
