import api from './axios';

export const correspondenciaService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/correspondencia?${params}`);
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/correspondencia/${id}`);
    return response.data;
  },
  create: async (formData) => {
    const response = await api.post('/correspondencia', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  update: async (id, formData) => {
    // Utiliza POST con _method=PUT para actualizaciones que incluyan archivos.
    formData.append('_method', 'PUT');
    
    const response = await api.post(`/correspondencia/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/correspondencia/${id}`);
    return response.data;
  },
  archivar: async (id, expedienteId) => {
    const response = await api.post(`/correspondencia/${id}/archivar`, { expediente_id: expedienteId });
    return response.data;
  }
};
