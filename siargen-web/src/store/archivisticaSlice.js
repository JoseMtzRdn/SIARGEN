import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';

export const fetchFondos = createAsyncThunk('archivistica/fetchFondos', async (params, { rejectWithValue }) => {
    try {
        const response = await api.get('/archivistica/fondos', { params: { ...params, per_page: -1 } });
        return response.data.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Error al cargar fondos');
    }
});

export const createFondo = createAsyncThunk('archivistica/createFondo', async (formData, { rejectWithValue }) => {
    try {
        const response = await api.post('/archivistica/fondos', formData);
        return response.data.data;
    } catch (error) {
        return rejectWithValue(error.response?.data || 'Error al crear fondo');
    }
});

export const updateFondo = createAsyncThunk('archivistica/updateFondo', async ({ id, formData }, { rejectWithValue }) => {
    try {
        const response = await api.put(`/archivistica/fondos/${id}`, formData);
        return response.data.data;
    } catch (error) {
        return rejectWithValue(error.response?.data || 'Error al actualizar fondo');
    }
});

export const deleteFondo = createAsyncThunk('archivistica/deleteFondo', async (id, { rejectWithValue }) => {
    try {
        await api.delete(`/archivistica/fondos/${id}`);
        return id;
    } catch (error) {
        if (error.response?.status === 422 && error.response.data.errors) {
            const firstError = Object.values(error.response.data.errors)[0][0];
            return rejectWithValue(firstError);
        }
        return rejectWithValue(error.response?.data?.message || 'Error al eliminar fondo');
    }
});

export const fetchSecciones = createAsyncThunk('archivistica/fetchSecciones', async (params, { rejectWithValue }) => {
    try {
        const response = await api.get('/archivistica/secciones', { params: { ...params, per_page: -1 } });
        return response.data.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Error al cargar secciones');
    }
});

export const createSeccion = createAsyncThunk('archivistica/createSeccion', async (formData, { rejectWithValue }) => {
    try {
        const response = await api.post('/archivistica/secciones', formData);
        return response.data.data;
    } catch (error) {
        return rejectWithValue(error.response?.data || 'Error al crear sección');
    }
});

export const updateSeccion = createAsyncThunk('archivistica/updateSeccion', async ({ id, formData }, { rejectWithValue }) => {
    try {
        const response = await api.put(`/archivistica/secciones/${id}`, formData);
        return response.data.data;
    } catch (error) {
        return rejectWithValue(error.response?.data || 'Error al actualizar sección');
    }
});

export const deleteSeccion = createAsyncThunk('archivistica/deleteSeccion', async (id, { rejectWithValue }) => {
    try {
        await api.delete(`/archivistica/secciones/${id}`);
        return id;
    } catch (error) {
        if (error.response?.status === 422 && error.response.data.errors) {
            const firstError = Object.values(error.response.data.errors)[0][0];
            return rejectWithValue(firstError);
        }
        return rejectWithValue(error.response?.data?.message || 'Error al eliminar sección');
    }
});

export const fetchSeriesArchivistica = createAsyncThunk('archivistica/fetchSeries', async (params, { rejectWithValue }) => {
    try {
        const response = await api.get('/archivistica/series', { params: { ...params, per_page: -1 } });
        return response.data.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Error al cargar series');
    }
});

export const createSerie = createAsyncThunk('archivistica/createSerie', async (formData, { rejectWithValue }) => {
    try {
        const response = await api.post('/archivistica/series', formData);
        return response.data.data;
    } catch (error) {
        return rejectWithValue(error.response?.data || 'Error al crear serie');
    }
});

export const updateSerie = createAsyncThunk('archivistica/updateSerie', async ({ id, formData }, { rejectWithValue }) => {
    try {
        const response = await api.put(`/archivistica/series/${id}`, formData);
        return response.data.data;
    } catch (error) {
        return rejectWithValue(error.response?.data || 'Error al actualizar serie');
    }
});

export const deleteSerie = createAsyncThunk('archivistica/deleteSerie', async (id, { rejectWithValue }) => {
    try {
        await api.delete(`/archivistica/series/${id}`);
        return id;
    } catch (error) {
        if (error.response?.status === 422 && error.response.data.errors) {
            const firstError = Object.values(error.response.data.errors)[0][0];
            return rejectWithValue(firstError);
        }
        return rejectWithValue(error.response?.data?.message || 'Error al eliminar serie');
    }
});

export const fetchSubseries = createAsyncThunk('archivistica/fetchSubseries', async (params, { rejectWithValue }) => {
    try {
        const response = await api.get('/archivistica/subseries', { params: { ...params, per_page: -1 } });
        return response.data.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Error al cargar subseries');
    }
});

export const createSubserie = createAsyncThunk('archivistica/createSubserie', async (formData, { rejectWithValue }) => {
    try {
        const response = await api.post('/archivistica/subseries', formData);
        return response.data.data;
    } catch (error) {
        return rejectWithValue(error.response?.data || 'Error al crear subserie');
    }
});

export const updateSubserie = createAsyncThunk('archivistica/updateSubserie', async ({ id, formData }, { rejectWithValue }) => {
    try {
        const response = await api.put(`/archivistica/subseries/${id}`, formData);
        return response.data.data;
    } catch (error) {
        return rejectWithValue(error.response?.data || 'Error al actualizar subserie');
    }
});

export const deleteSubserie = createAsyncThunk('archivistica/deleteSubserie', async (id, { rejectWithValue }) => {
    try {
        await api.delete(`/archivistica/subseries/${id}`);
        return id;
    } catch (error) {
        if (error.response?.status === 422 && error.response.data.errors) {
            const firstError = Object.values(error.response.data.errors)[0][0];
            return rejectWithValue(firstError);
        }
        return rejectWithValue(error.response?.data?.message || 'Error al eliminar subserie');
    }
});

const archivisticaSlice = createSlice({
    name: 'archivistica',
    initialState: {
        fondos: { items: [], loading: false, lastFetch: null },
        secciones: { items: [], loading: false, lastFetch: null },
        series: { items: [], loading: false, lastFetch: null },
        subseries: { items: [], loading: false, lastFetch: null },
        actionLoading: false,
        validationErrors: null,
        error: null
    },
    reducers: {
        clearArchivisticaErrors: (state) => {
            state.validationErrors = null;
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // fondo handlers
            .addCase(fetchFondos.pending, (state) => { state.fondos.loading = state.fondos.items.length === 0; })
            .addCase(fetchFondos.fulfilled, (state, action) => {
                state.fondos.loading = false;
                state.fondos.items = action.payload.data || action.payload;
                state.fondos.lastFetch = Date.now();
            })
            .addCase(createFondo.fulfilled, (state, action) => {
                state.actionLoading = false;
                state.fondos.items.unshift(action.payload);
            })
            .addCase(updateFondo.fulfilled, (state, action) => {
                state.actionLoading = false;
                const index = state.fondos.items.findIndex(i => i.id === action.payload.id);
                if (index !== -1) state.fondos.items[index] = action.payload;
            })
            .addCase(deleteFondo.fulfilled, (state, action) => {
                state.fondos.items = state.fondos.items.filter(i => i.id !== action.payload);
            })

            // seccion handlers
            .addCase(fetchSecciones.pending, (state) => { state.secciones.loading = state.secciones.items.length === 0; })
            .addCase(fetchSecciones.fulfilled, (state, action) => {
                state.secciones.loading = false;
                state.secciones.items = action.payload.data || action.payload;
                state.secciones.lastFetch = Date.now();
            })
            .addCase(createSeccion.fulfilled, (state, action) => {
                state.actionLoading = false;
                state.secciones.items.unshift(action.payload);
            })
            .addCase(updateSeccion.fulfilled, (state, action) => {
                state.actionLoading = false;
                const index = state.secciones.items.findIndex(i => i.id === action.payload.id);
                if (index !== -1) state.secciones.items[index] = action.payload;
            })
            .addCase(deleteSeccion.fulfilled, (state, action) => {
                state.secciones.items = state.secciones.items.filter(i => i.id !== action.payload);
            })

            // serie handlers
            .addCase(fetchSeriesArchivistica.pending, (state) => { state.series.loading = state.series.items.length === 0; })
            .addCase(fetchSeriesArchivistica.fulfilled, (state, action) => {
                state.series.loading = false;
                state.series.items = action.payload.data || action.payload;
                state.series.lastFetch = Date.now();
            })
            .addCase(createSerie.fulfilled, (state, action) => {
                state.actionLoading = false;
                const newItem = action.payload.data || action.payload;
                state.series.items.unshift(newItem);
            })
            .addCase(updateSerie.fulfilled, (state, action) => {
                state.actionLoading = false;
                const updatedItem = action.payload.data || action.payload;
                const index = state.series.items.findIndex(i => i.id === updatedItem.id);
                if (index !== -1) state.series.items[index] = updatedItem;
            })
            .addCase(deleteSerie.fulfilled, (state, action) => {
                state.series.items = state.series.items.filter(i => i.id !== action.payload);
            })

            // subserie handlers
            .addCase(fetchSubseries.pending, (state) => { 
                state.subseries.loading = true; 
            })
            .addCase(fetchSubseries.fulfilled, (state, action) => {
                state.subseries.loading = false;
                state.subseries.items = action.payload.data || action.payload || [];
                state.subseries.lastFetch = Date.now();
            })
            .addCase(fetchSubseries.rejected, (state, action) => {
                state.subseries.loading = false;
                state.error = action.payload;
            })
            .addCase(createSubserie.fulfilled, (state, action) => {
                state.actionLoading = false;
                const newItem = action.payload.data || action.payload;
                state.subseries.items.unshift(newItem);
            })
            .addCase(updateSubserie.fulfilled, (state, action) => {
                state.actionLoading = false;
                const updatedItem = action.payload.data || action.payload;
                const index = state.subseries.items.findIndex(i => i.id === updatedItem.id);
                if (index !== -1) state.subseries.items[index] = updatedItem;
            })
            .addCase(deleteSubserie.fulfilled, (state, action) => {
                state.subseries.items = state.subseries.items.filter(i => i.id !== action.payload);
            })

            // common handlers for all actions
            .addMatcher(
                (action) => action.type.endsWith('/pending') && !action.type.includes('fetch'),
                (state) => {
                    state.actionLoading = true;
                    state.validationErrors = null;
                    state.error = null;
                }
            )
            .addMatcher(
                (action) => action.type.endsWith('/fulfilled') && !action.type.includes('fetch'),
                (state) => {
                    state.actionLoading = false;
                    state.validationErrors = null;
                }
            )
            .addMatcher(
                (action) => action.type.endsWith('/rejected') && !action.type.includes('fetch'),
                (state, action) => {
                    state.actionLoading = false;
                    if (typeof action.payload === 'object' && action.payload.errors) {
                        state.validationErrors = action.payload.errors;
                    } else {
                        state.error = action.payload;
                    }
                }
            );
    }
});

export const { clearArchivisticaErrors } = archivisticaSlice.actions;
export default archivisticaSlice.reducer;
