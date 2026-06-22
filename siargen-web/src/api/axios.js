import axios from 'axios';
import Swal from 'sweetalert2';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});


api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const isInactive = error.response.data?.error === 'ACCOUNT_INACTIVE';
      
      localStorage.removeItem('token');
      
      if (isInactive) {
        await Swal.fire({
          icon: 'error',
          title: '<span class="font-black tracking-tighter text-[#7A152E] uppercase">Sesión Bloqueada</span>',
          text: error.response.data.message || 'Tu cuenta ha sido desactivada.',
          confirmButtonColor: '#7A152E',
          confirmButtonText: 'ENTENDIDO',
          background: '#ffffff',
          customClass: {
            popup: 'rounded-[3rem] shadow-2xl border-none',
            title: 'text-2xl py-10',
            confirmButton: 'px-10 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em]'
          }
        });
      }
      
      window.location.href = '/login';
    }
    
    // estandarizar mensaje de error para el frontend
    if (!error.response) {
      error.message = 'No se pudo establecer conexión con el servidor. Verifique su internet.';
    } else if (error.response.status === 500) {
      error.message = 'Error interno del servidor. Por favor, contacte al administrador.';
    }
    
    return Promise.reject(error);
  }
);

export default api;
