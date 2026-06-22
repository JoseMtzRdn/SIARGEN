import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';

export const fetchSecciones = createAsyncThunk('catalogos/fetchSecciones', async (_, { rejectWithValue }) => {
    try {
        const response = await api.get('/archivistica/secciones', { params: { per_page: -1 } });
        return response.data.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Error al cargar secciones');
    }
});

export const fetchSeries = createAsyncThunk('catalogos/fetchSeries', async (params, { rejectWithValue }) => {
    try {
        const response = await api.get('/archivistica/series', { params: { ...params, per_page: -1 } });
        return response.data.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Error al cargar series');
    }
});

export const fetchSubseries = createAsyncThunk('catalogos/fetchSubseries', async (params, { rejectWithValue }) => {
    try {
        const response = await api.get('/archivistica/subseries', { params: { ...params, per_page: -1 } });
        return response.data.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Error al cargar subseries');
    }
});

const catalogoSlice = createSlice({
    name: 'catalogos',
    initialState: {
        secciones: [],
        series: [],
        subseries: [],
        loading: false,
        lastFetch: {
            secciones: null,
            series: null,
            subseries: {} // almacenar por serie_id para evitar recargas constantes
        },
        error: null
    },
    reducers: {
        clearCatalogos: (state) => {
            state.secciones = [];
            state.series = [];
            state.subseries = [];
            state.lastFetch = { secciones: null, series: null, subseries: {} };
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchSecciones.pending, (state) => { state.loading = true; })
            .addCase(fetchSecciones.fulfilled, (state, action) => {
                state.loading = false;
                state.secciones = action.payload;
                state.lastFetch.secciones = Date.now();
            })
            .addCase(fetchSeries.pending, (state) => { state.loading = true; })
            .addCase(fetchSeries.fulfilled, (state, action) => {
                state.loading = false;
                state.series = action.payload;
                state.lastFetch.series = Date.now();
            })
            .addCase(fetchSubseries.fulfilled, (state, action) => {
                state.subseries = action.payload;
                const serieId = action.meta.arg?.serie_id;
                if (serieId) {
                    state.lastFetch.subseries[serieId] = Date.now();
                }
            });
    }
});

export const { clearCatalogos } = catalogoSlice.actions;
export default catalogoSlice.reducer;
