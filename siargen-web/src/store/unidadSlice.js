import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';

export const fetchUnidades = createAsyncThunk(
    'unidades/fetchPaginated',
    async (params, { rejectWithValue }) => {
        try {
            // usamos per_page: -1 para obtener todos los registros sin paginación
            const queryParams = { ...params, per_page: -1 };
            const response = await api.get('/unidades-administrativas', { params: queryParams });
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Error al cargar unidades');
        }
    },
    {
        condition: (params, { getState }) => {
            const { unidades } = getState();
            const now = Date.now();
            if (unidades.loading) return false;
            
            // Ignora la caché si se incluyen parámetros de búsqueda o filtrado.
            const hasParams = params && (params.search || params.activo !== '');
            if (hasParams) return true;

            // no recargar el listado general si los datos tienen menos de 10 segundos
            if (unidades.lastFetch && (now - unidades.lastFetch < 10000)) return false;
        }
    }
);

export const fetchUnidadesCatalog = createAsyncThunk(
    'unidades/fetchCatalog',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/usuarios/unidades');
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Error al cargar catálogo de unidades');
        }
    },
    {
        condition: (_, { getState }) => {
            const { unidades } = getState();
            const now = Date.now();
            if (unidades.catalogLoading) return false;
            // si el catálogo ya tiene datos y es reciente, no pedir
            if (unidades.catalog.length > 0 && unidades.lastFetch && (now - unidades.lastFetch < 30000)) {
                return false;
            }
        }
    }
);

export const createUnidad = createAsyncThunk(
    'unidades/create',
    async (formData, { rejectWithValue }) => {
        try {
            const response = await api.post('/unidades-administrativas', formData);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Error al crear unidad');
        }
    }
);

export const updateUnidad = createAsyncThunk(
    'unidades/update',
    async ({ id, formData }, { rejectWithValue }) => {
        try {
            const response = await api.put(`/unidades-administrativas/${id}`, formData);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Error al actualizar unidad');
        }
    }
);

export const toggleUnidadStatus = createAsyncThunk(
    'unidades/toggleStatus',
    async (id, { rejectWithValue }) => {
        try {
            const response = await api.patch(`/unidades-administrativas/${id}/status`);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Error al cambiar estatus');
        }
    }
);

export const deleteUnidad = createAsyncThunk(
    'unidades/delete',
    async (id, { rejectWithValue }) => {
        try {
            await api.delete(`/unidades-administrativas/${id}`);
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Error al eliminar unidad');
        }
    }
);

const unidadSlice = createSlice({
    name: 'unidades',
    initialState: {
        items: [],
        catalog: [],
        pagination: {
            current_page: 1,
            last_page: 1,
            total: 0
        },
        loading: false,
        catalogLoading: false,
        actionLoading: false,
        error: null,
        validationErrors: null,
        lastFetch: null
    },
    reducers: {
        clearValidationErrors: (state) => {
            state.validationErrors = null;
        },
        invalidateUnidadesCache: (state) => {
            state.lastFetch = null;
            state.items = []; // Limpia la caché de unidades para forzar la sincronización.
            state.catalog = [];
        }
    },
    extraReducers: (builder) => {
        builder
            // obtener paginado
            .addCase(fetchUnidades.pending, (state) => {
                state.loading = state.items.length === 0; 
                state.error = null;
            })
            .addCase(fetchUnidades.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload.data;
                state.pagination = {
                    current_page: action.payload.meta?.current_page || 1,
                    last_page: action.payload.meta?.last_page || 1,
                    total: action.payload.meta?.total || 0
                };
                state.lastFetch = Date.now();
            })
            .addCase(fetchUnidades.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // obtener catalogo
            .addCase(fetchUnidadesCatalog.pending, (state) => {
                state.catalogLoading = true;
            })
            .addCase(fetchUnidadesCatalog.fulfilled, (state, action) => {
                state.catalogLoading = false;
                state.catalog = action.payload;
            })
            .addCase(fetchUnidadesCatalog.rejected, (state) => {
                state.catalogLoading = false;
            })
            // crear
            .addCase(createUnidad.pending, (state) => {
                state.actionLoading = true;
                state.validationErrors = null;
            })
            .addCase(createUnidad.fulfilled, (state, action) => {
                state.actionLoading = false;
                // desenvolver datos de laravel (jsonresource suele envolver en 'data')
                const unidad = action.payload.data || action.payload;
                
                // añadir a la lista principal
                state.items.unshift(unidad);
                // añadir al catálogo para dropdowns si está activa
                if (unidad.activo) {
                    state.catalog.push(unidad);
                    state.catalog.sort((a, b) => a.nombre.localeCompare(b.nombre));
                }
            })
            .addCase(createUnidad.rejected, (state, action) => {
                state.actionLoading = false;
                if (typeof action.payload === 'object' && action.payload.errors) {
                    state.validationErrors = action.payload.errors;
                } else {
                    state.error = action.payload;
                }
            })
            // actualizar
            .addCase(updateUnidad.pending, (state) => {
                state.actionLoading = true;
                state.validationErrors = null;
            })
            .addCase(updateUnidad.fulfilled, (state, action) => {
                state.actionLoading = false;
                const unidad = action.payload.data || action.payload;

                // actualizar en la lista principal
                const index = state.items.findIndex(item => item.id === unidad.id);
                if (index !== -1) {
                    state.items[index] = unidad;
                }
                // actualizar en el catálogo
                const catIndex = state.catalog.findIndex(item => item.id === unidad.id);
                if (catIndex !== -1) {
                    if (!unidad.activo) {
                        state.catalog.splice(catIndex, 1);
                    } else {
                        state.catalog[catIndex] = unidad;
                        state.catalog.sort((a, b) => a.nombre.localeCompare(b.nombre));
                    }
                } else if (unidad.activo) {
                    state.catalog.push(unidad);
                    state.catalog.sort((a, b) => a.nombre.localeCompare(b.nombre));
                }
            })
            .addCase(updateUnidad.rejected, (state, action) => {
                state.actionLoading = false;
                if (typeof action.payload === 'object' && action.payload.errors) {
                    state.validationErrors = action.payload.errors;
                } else {
                    state.error = action.payload;
                }
            })
            // toggle status
            .addCase(toggleUnidadStatus.fulfilled, (state, action) => {
                const unidad = action.payload.data || action.payload;
                
                const index = state.items.findIndex(item => item.id === unidad.id);
                if (index !== -1) {
                    state.items[index] = unidad;
                }
                // también actualizar el catálogo si es necesario
                const catIndex = state.catalog.findIndex(item => item.id === unidad.id);
                if (catIndex !== -1) {
                    if (!unidad.activo) {
                        state.catalog.splice(catIndex, 1);
                    } else {
                        state.catalog[catIndex] = unidad;
                    }
                } else if (unidad.activo) {
                    state.catalog.push(unidad);
                    state.catalog.sort((a, b) => a.nombre.localeCompare(b.nombre));
                }
            })
            // delete
            .addCase(deleteUnidad.fulfilled, (state, action) => {
                state.items = state.items.filter(item => item.id !== action.payload);
                state.catalog = state.catalog.filter(item => item.id !== action.payload);
            });
    }
});

export const { clearValidationErrors, invalidateUnidadesCache } = unidadSlice.actions;
export default unidadSlice.reducer;
