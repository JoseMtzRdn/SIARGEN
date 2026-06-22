import api from './axios';

export const userService = {
  getAll: (params = {}) => api.get('/usuarios', { params }),
  getById: (id) => api.get(`/usuarios/${id}`),
  create: (data) => api.post('/usuarios', data),
  update: (id, data) => api.put(`/usuarios/${id}`, data),
  toggleActive: (id) => api.patch(`/usuarios/${id}/status`),
  getRoles: () => api.get('/usuarios/roles'),
  getUnidades: () => api.get('/usuarios/unidades'),
  checkAvailability: (field, value, excludeId = null) => api.get('/usuarios/check-availability', {
    params: { field, value, exclude: excludeId }
  })
};
