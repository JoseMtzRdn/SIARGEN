import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';

export const fetchPrestamos = createAsyncThunk(
  'prestamos/fetchPrestamos',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/prestamos', { params });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al cargar préstamos');
    }
  },
  {
    condition: (params, { getState }) => {
      const { prestamos, auth } = getState();
      const now = Date.now();
      const currentUser = auth.user?.id || auth.user?.data?.id;
      
      // si ya está cargando, abortar
      if (prestamos.loading) return false;

      if (currentUser && prestamos.lastUserId && currentUser !== prestamos.lastUserId) {
        return true;
      }

      if (params?.force) return true;

      const requestedFase = params?.fase || 'concentracion';
      if (requestedFase !== prestamos.lastFase) return true;


      // si es el mismo usuario, misma fase y han pasado menos de 10s, abortar
      if (prestamos.lastFetch && (now - prestamos.lastFetch < 10000)) {
        return false;
      }
    }
  }
);

export const createPrestamo = createAsyncThunk(
  'prestamos/createPrestamo',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await api.post('/prestamos', formData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Error al generar vale de préstamo');
    }
  }
);

export const devolverPrestamo = createAsyncThunk(
  'prestamos/devolverPrestamo',
  async ({ id, observaciones, estado_devolucion }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/prestamos/${id}/devolver`, { observaciones, estado_devolucion });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al procesar devolución');
    }
  }
);

export const checkVigenciasPrestamos = createAsyncThunk(
  'prestamos/checkVigencias',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/check-vigencias-prestamos');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al verificar préstamos vencidos');
    }
  },
  {
    condition: (_, { getState }) => {
      const { prestamos } = getState();
      if (prestamos.checkingVigencias) return false;
    }
  }
);

const prestamoSlice = createSlice({
  name: 'prestamos',
  initialState: {
    items: [],
    vencidos: [], // Identifica préstamos registrados.
    vencidosCount: 0,
    pagination: null,
    loading: false,
    checkingVigencias: false,
    actionLoading: false,
    error: null,
    validationErrors: null,
    lastFetch: null,
    lastFase: null,
    lastUserId: null
  },
  reducers: {
    resetPrestamoState: (state) => {
      state.items = [];
      state.lastFetch = null;
      state.lastFase = null;
      state.lastUserId = null;
      state.vencidos = [];
      state.vencidosCount = 0;
    },
    clearPrestamoErrors: (state) => {
      state.validationErrors = null;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Valida vigencia documental.
      .addCase(checkVigenciasPrestamos.pending, (state) => {
        state.checkingVigencias = true;
      })
      .addCase(checkVigenciasPrestamos.fulfilled, (state, action) => {
        state.checkingVigencias = false;
        state.vencidos = action.payload.vencidos || [];
        state.vencidosCount = action.payload.count || 0;
      })
      .addCase(checkVigenciasPrestamos.rejected, (state) => {
        state.checkingVigencias = false;
      })
      // obtener
      .addCase(fetchPrestamos.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPrestamos.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data || action.payload;
        state.pagination = action.payload.meta || null;
        state.lastFetch = Date.now();
        state.lastFase = action.meta.arg?.fase || 'concentracion';
        // Actualiza el identificador del último usuario autenticado.
      })
      .addCase(devolverPrestamo.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.items.findIndex(i => i.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
      })
      // Reinicia el estado de préstamos al cerrar sesión.
      .addMatcher(
        (action) => action.type === 'auth/logout/fulfilled' || action.type === 'auth/check/rejected',
        (state) => {
          state.items = [];
          state.lastFetch = null;
          state.lastFase = null;
          state.lastUserId = null;
          state.vencidos = [];
          state.vencidosCount = 0;
        }
      );
  }
});

export const { clearPrestamoErrors } = prestamoSlice.actions;
export default prestamoSlice.reducer;
