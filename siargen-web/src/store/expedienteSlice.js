import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';

export const fetchExpedientes = createAsyncThunk(
    'expedientes/fetchAll',
    async (params, { rejectWithValue }) => {
        try {
            const response = await api.get('/expedientes', { params });
            // Retornamos los datos de expedientes desde el backend.
            return response.data.data; 
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Error al cargar expedientes');
        }
    },
    {
        // prevenir llamadas simultáneas y redundantes (caché de 10s por fase o unidad)
        condition: (params, { getState }) => {
            const { expedientes } = getState();
            const now = Date.now();
            
            // si ya está cargando, abortar
            if (expedientes.loading) return false;

            const requestedFase = params?.fase || 'tramite';
            const requestedUnidad = params?.unidad_administrativa_id || null;

            if (requestedFase !== expedientes.lastFase || requestedUnidad !== expedientes.lastUnidadId) {
                return true; // Permite la descarga según la fase o unidad administrativa.
            }

            // Previene peticiones duplicadas en intervalos menores a 10 segundos.
            if (expedientes.lastFetch && (now - expedientes.lastFetch < 10000)) {
                return false;
            }
        }
    }
);

export const createExpediente = createAsyncThunk(
    'expedientes/create',
    async (data, { rejectWithValue }) => {
        try {
            const response = await api.post('/expedientes', data);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Error al crear expediente');
        }
    }
);

export const updateExpediente = createAsyncThunk(
    'expedientes/update',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const response = await api.put(`/expedientes/${id}`, data);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Error al actualizar expediente');
        }
    }
);

export const deleteExpediente = createAsyncThunk(
    'expedientes/delete',
    async (id, { rejectWithValue }) => {
        try {
            await api.delete(`/expedientes/${id}`);
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Error al eliminar expediente');
        }
    }
);

export const cerrarExpediente = createAsyncThunk(
    'expedientes/cerrar',
    async (id, { rejectWithValue }) => {
        try {
            const response = await api.post(`/expedientes/${id}/cerrar`);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Error al cerrar expediente');
        }
    }
);

export const reabrirExpediente = createAsyncThunk(
    'expedientes/reabrir',
    async ({ id, motivo }, { rejectWithValue }) => {
        try {
            const response = await api.post(`/expedientes/${id}/reabrir`, { motivo });
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Error al reabrir expediente');
        }
    }
);

export const reclasificarExpediente = createAsyncThunk(
    'expedientes/reclasificar',
    async ({ id, serie_id, subserie_id }, { rejectWithValue }) => {
        try {
            const response = await api.post(`/expedientes/${id}/reclasificar`, { serie_id, subserie_id });
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Error al reclasificar expediente');
        }
    }
);

export const updateUbicacionExpediente = createAsyncThunk(
    'expedientes/updateUbicacion',
    async ({ id, ubicacionData }, { rejectWithValue }) => {
        try {
            const response = await api.post(`/expedientes/${id}/ubicacion-subsanacion`, ubicacionData);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Error al actualizar ubicación');
        }
    }
);

const expedienteSlice = createSlice({
    name: 'expedientes',
    initialState: {
        items: [], // estandarizado a items
        pagination: {
            current_page: 1,
            last_page: 1,
            total: 0
        },
        loading: false,
        lastFetch: null, // para lógica de caché
        lastFase: null, // rastrear última fase cargada
        lastUnidadId: null, // rastrear último filtro de unidad
        lastUserId: null, // rastrear último usuario
        error: null
    },
    reducers: {
        clearExpedienteError: (state) => {
            state.error = null;
        },
        resetExpedienteState: (state) => {
            state.items = [];
            state.lastFetch = null;
            state.lastFase = null;
            state.lastUnidadId = null;
            state.lastUserId = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchExpedientes.pending, (state) => {
                state.loading = state.items.length === 0; // solo mostrar loader si no hay datos
            })
            .addCase(fetchExpedientes.fulfilled, (state, action) => {
                state.loading = false;
                state.lastFetch = Date.now();
                state.lastFase = action.meta.arg?.fase || 'tramite';
                state.lastUnidadId = action.meta.arg?.unidad_administrativa_id || null;
                
                // manejar tanto respuesta paginada como no-paginada (per_page=-1)
                if (action.payload.meta) {
                    state.items = action.payload.data;
                    state.pagination = {
                        current_page: action.payload.meta.current_page,
                        last_page: action.payload.meta.last_page,
                        total: action.payload.meta.total
                    };
                } else if (Array.isArray(action.payload)) {
                    state.items = action.payload;
                    state.pagination = {
                        current_page: 1,
                        last_page: 1,
                        total: action.payload.length
                    };
                } else {
                    // Resuelve estructuras de datos pre-formateadas.
                    state.items = action.payload.data || [];
                    state.pagination.total = state.items.length;
                }
            })
            .addCase(fetchExpedientes.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // manejo de acciones individuales para actualización en tiempo real
            .addCase(createExpediente.fulfilled, (state, action) => {
                state.items.unshift(action.payload);
                state.lastFetch = null; // forzar recarga para sincronizar contadores
            })
            .addCase(updateExpediente.fulfilled, (state, action) => {
                const index = state.items.findIndex(exp => exp.id === action.payload.id);
                if (index !== -1) state.items[index] = action.payload;
                state.lastFetch = null;
            })
            .addCase(deleteExpediente.fulfilled, (state, action) => {
                state.items = state.items.filter(exp => exp.id !== action.payload);
                state.lastFetch = null;
            })
            .addCase(cerrarExpediente.fulfilled, (state, action) => {
                const index = state.items.findIndex(exp => exp.id === action.payload.id);
                if (index !== -1) {
                    state.items[index] = action.payload; // actualizar con los datos reales del servidor
                }
                state.lastFetch = null; // Invalida la caché del estado global.
            })
            .addCase(reabrirExpediente.fulfilled, (state, action) => {
                const index = state.items.findIndex(exp => exp.id === action.payload.id);
                if (index !== -1) {
                    state.items[index] = action.payload;
                }
                state.lastFetch = null; // Invalida la caché del estado global.
            })
            // Reinicia el estado global al cerrar sesión.
            .addMatcher(
                (action) => action.type === 'auth/logout/fulfilled' || action.type === 'auth/check/rejected',
                (state) => {
                    state.items = [];
                    state.lastFetch = null;
                    state.lastFase = null;
                    state.lastUserId = null;
                }
            )
            // Invalida la caché ante actualizaciones en transferencias.
            .addMatcher(
                (action) => action.type.startsWith('transferencias/') && action.type.endsWith('/fulfilled'),
                (state) => {
                    state.lastFetch = null; // forzar recarga en la próxima visita
                }
            );
    }
});

export const { clearExpedienteError } = expedienteSlice.actions;
export default expedienteSlice.reducer;
