import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { correspondenciaService } from '../api/correspondenciaService';
import api from '../api/axios';

export const fetchCorrespondencia = createAsyncThunk(
  'correspondencia/fetchAll',
  async (filters, { rejectWithValue }) => {
    try {
      const params = { ...filters, per_page: -1 };
      const response = await correspondenciaService.getAll(params);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al cargar correspondencia');
    }
  }
);

export const createCorrespondencia = createAsyncThunk(
  'correspondencia/create',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await correspondenciaService.create(formData);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Error al crear correspondencia');
    }
  }
);

export const updateCorrespondencia = createAsyncThunk(
  'correspondencia/update',
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await correspondenciaService.update(id, formData);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Error al actualizar correspondencia');
    }
  }
);

export const deleteCorrespondencia = createAsyncThunk(
  'correspondencia/delete',
  async ({ id, motivo }, { rejectWithValue }) => {
    try {
      await api.delete(`/correspondencia/${id}`, { data: { motivo } });
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al eliminar correspondencia');
    }
  }
);

export const archivarCorrespondencia = createAsyncThunk(
  'correspondencia/archivar',
  async ({ id, expedienteId }, { rejectWithValue }) => {
    try {
      const response = await correspondenciaService.archivar(id, expedienteId);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al archivar');
    }
  }
);

export const desarchivarCorrespondencia = createAsyncThunk(
  'correspondencia/desarchivar',
  async ({ id, motivo }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/correspondencia/${id}/desarchivar`, { motivo });
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al desarchivar');
    }
  }
);

const correspondenciaSlice = createSlice({
  name: 'correspondencia',
  initialState: {
    items: [],
    loading: false,
    actionLoading: false,
    error: null,
    validationErrors: null,
    lastFetch: null,
  },
  reducers: {
    clearValidationErrors: (state) => {
      state.validationErrors = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCorrespondencia.pending, (state) => {
        state.loading = state.items.length === 0;
        state.error = null;
      })
      .addCase(fetchCorrespondencia.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.lastFetch = Date.now();
      })
      .addCase(fetchCorrespondencia.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createCorrespondencia.pending, (state) => {
        state.actionLoading = true;
        state.validationErrors = null;
      })
      .addCase(createCorrespondencia.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.items.unshift(action.payload);
      })
      .addCase(createCorrespondencia.rejected, (state, action) => {
        state.actionLoading = false;
        if (typeof action.payload === 'object' && action.payload.errors) {
          state.validationErrors = action.payload.errors;
        } else {
          state.error = action.payload;
        }
      })
      .addCase(updateCorrespondencia.pending, (state) => {
        state.actionLoading = true;
        state.validationErrors = null;
      })
      .addCase(updateCorrespondencia.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateCorrespondencia.rejected, (state, action) => {
        state.actionLoading = false;
        if (typeof action.payload === 'object' && action.payload.errors) {
          state.validationErrors = action.payload.errors;
        } else {
          state.error = action.payload;
        }
      })
      .addCase(deleteCorrespondencia.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item.id !== action.payload);
      })
      .addCase(archivarCorrespondencia.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(desarchivarCorrespondencia.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          // forzamos la limpieza de los campos de vinculación
          state.items[index] = {
            ...action.payload,
            expediente_id: null,
            expediente: null
          };
        }
      });
  }
});

export const { clearValidationErrors, clearError } = correspondenciaSlice.actions;
export default correspondenciaSlice.reducer;
