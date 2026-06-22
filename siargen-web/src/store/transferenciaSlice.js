import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';


export const fetchTransferencias = createAsyncThunk(
    'transferencias/fetchAll',
    async (params, { rejectWithValue }) => {
        try {
            const response = await api.get('/transferencias', { params });
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Error al cargar transferencias');
        }
    }
);

export const createTransferencia = createAsyncThunk(
    'transferencias/create',
    async (data, { rejectWithValue }) => {
        try {
            const response = await api.post('/transferencias', data);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Error al crear transferencia');
        }
    }
);

export const enviarATua = createAsyncThunk(
    'transferencias/enviarATua',
    async (id, { rejectWithValue }) => {
        try {
            const response = await api.post(`/transferencias/${id}/enviar-tua`);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Error al enviar al TUA');
        }
    }
);

export const autorizarTua = createAsyncThunk(
    'transferencias/autorizarTua',
    async (id, { rejectWithValue }) => {
        try {
            const response = await api.post(`/transferencias/${id}/autorizar-tua`);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Error al autorizar');
        }
    }
);

export const rechazarTua = createAsyncThunk(
    'transferencias/rechazarTua',
    async ({ id, motivo }, { rejectWithValue }) => {
        try {
            const response = await api.post(`/transferencias/${id}/rechazar-tua`, { motivo });
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Error al rechazar');
        }
    }
);

export const validarTransferencia = createAsyncThunk(
    'transferencias/validar',
    async (id, { rejectWithValue }) => {
        try {
            const response = await api.post(`/transferencias/${id}/validar`);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Error al validar');
        }
    }
);

export const rechazarCoordinador = createAsyncThunk(
    'transferencias/rechazarCoordinador',
    async ({ id, motivo }, { rejectWithValue }) => {
        try {
            const response = await api.post(`/transferencias/${id}/rechazar-coordinador`, { motivo });
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Error al rechazar');
        }
    }
);

export const enviarARac = createAsyncThunk(
    'transferencias/enviarARac',
    async (id, { rejectWithValue }) => {
        try {
            const response = await api.post(`/transferencias/${id}/enviar-rac`);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Error al enviar al RAC');
        }
    }
);

export const recibirTransferencia = createAsyncThunk(
    'transferencias/recibir',
    async (id, { rejectWithValue }) => {
        try {
            const response = await api.post(`/transferencias/${id}/recibir`);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Error al recibir');
        }
    }
);

export const rechazarRac = createAsyncThunk(
    'transferencias/rechazarRac',
    async ({ id, motivo }, { rejectWithValue }) => {
        try {
            const response = await api.post(`/transferencias/${id}/rechazar-rac`, { motivo });
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Error al rechazar en RAC');
        }
    }
);

export const resubmitTransfer = createAsyncThunk(
    'transferencias/resubmit',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const response = await api.post(`/transferencias/${id}/resubmit`, data);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Error al re-enviar transferencia');
        }
    }
);

export const updateSubsanacion = createAsyncThunk(
    'transferencias/updateSubsanacion',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const response = await api.post(`/transferencias/${id}/update-subsanacion`, data);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Error al guardar cambios');
        }
    }
);

export const checkVigencias = createAsyncThunk(
    'transferencias/checkVigencias',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/check-vigencias-transferencias');
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Error al Valida plazos de conservación documental.');
        }
    }
);


const transferenciaSlice = createSlice({
    name: 'transferencias',
    initialState: {
        items: [], // estandarizado a items
        vencidos: [], // Identifica expedientes incluidos en la transferencia.
        vencidosCount: 0,
        pagination: {
            current_page: 1,
            last_page: 1,
            total: 0
        },
        loading: false,
        checkingVigencias: false,
        lastFetch: null,
        error: null,
        validationErrors: null
    },
    reducers: {
        clearValidationErrors: (state) => {
            state.validationErrors = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Valida plazos de conservación documental.
            .addCase(checkVigencias.pending, (state) => {
                state.checkingVigencias = true;
            })
            .addCase(checkVigencias.fulfilled, (state, action) => {
                state.checkingVigencias = false;
                state.vencidos = action.payload.vencidos || [];
                state.vencidosCount = action.payload.count || 0;
            })
            .addCase(checkVigencias.rejected, (state) => {
                state.checkingVigencias = false;
            })
            // obtener
            .addCase(fetchTransferencias.pending, (state) => {
                state.loading = state.items.length === 0;
            })
            .addCase(fetchTransferencias.fulfilled, (state, action) => {
                state.loading = false;
                state.lastFetch = Date.now();
                
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
                    state.items = action.payload.data || [];
                    state.pagination.total = state.items.length;
                }
            })
            .addCase(fetchTransferencias.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // crear
            .addCase(createTransferencia.fulfilled, (state, action) => {
                state.items.unshift(action.payload);
                state.lastFetch = null;
            })
            // actualizar estados
            .addCase(autorizarTua.fulfilled, (state, action) => {
                const index = state.items.findIndex(i => i.id === action.payload.id);
                if (index !== -1) state.items[index] = action.payload;
                state.lastFetch = null;
            })
            .addCase(validarTransferencia.fulfilled, (state, action) => {
                const index = state.items.findIndex(i => i.id === action.payload.id);
                if (index !== -1) state.items[index] = action.payload;
                state.lastFetch = null;
            })
            .addCase(recibirTransferencia.fulfilled, (state, action) => {
                const index = state.items.findIndex(i => i.id === action.payload.id);
                if (index !== -1) state.items[index] = action.payload;
                state.lastFetch = null; // invalida caché para otros roles que consulten
            })
            // Invalida caché de transferencias y recarga vigencias.
            .addMatcher(
                (action) => action.type.startsWith('transferencias/') && action.type.endsWith('/fulfilled'),
                (state) => {
                    state.lastFetch = null;
                }
            );
    }
});

export const { clearValidationErrors } = transferenciaSlice.actions;
export default transferenciaSlice.reducer;
