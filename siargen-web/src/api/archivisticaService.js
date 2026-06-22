import axios from './axios';

const archivisticaService = {
  // fondos
  getFondos: (params = {}) => axios.get('/archivistica/fondos', { params }),
  createFondo: (data) => axios.post('/archivistica/fondos', data),
  updateFondo: (id, data) => axios.put(`/archivistica/fondos/${id}`, data),
  deleteFondo: (id) => axios.delete(`/archivistica/fondos/${id}`),

  // secciones
  getSecciones: (params = {}) => axios.get('/archivistica/secciones', { 
    params: { ...params, with_relations: true } 
  }),
  createSeccion: (data) => axios.post('/archivistica/secciones', data),
  updateSeccion: (id, data) => axios.put(`/archivistica/secciones/${id}`, data),
  deleteSeccion: (id) => axios.delete(`/archivistica/secciones/${id}`),

  // series documentales (cadido)
  getSeries: (params = {}) => axios.get('/archivistica/series', { 
    params: { ...params, with_relations: true } 
  }),
  createSerie: (data) => axios.post('/archivistica/series', data),
  updateSerie: (id, data) => axios.put(`/archivistica/series/${id}`, data),
  deleteSerie: (id) => axios.delete(`/archivistica/series/${id}`),
};

export default archivisticaService;
