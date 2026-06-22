import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';

export const fetchUsers = createAsyncThunk(
    'users/fetchPaginated',
    async (params, { rejectWithValue }) => {
        try {
            // usamos per_page: -1 para obtener todos los registros sin paginación
            const queryParams = { ...params, per_page: -1 };
            const response = await api.get('/usuarios', { params: queryParams });
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Error al cargar usuarios');
        }
    }
);

export const fetchRoles = createAsyncThunk(
    'users/fetchRoles',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/usuarios/roles');
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Error al cargar roles');
        }
    }
);

export const createUser = createAsyncThunk(
    'users/create',
    async (formData, { rejectWithValue }) => {
        try {
            const response = await api.post('/usuarios', formData);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Error al crear usuario');
        }
    }
);

export const updateUser = createAsyncThunk(
    'users/update',
    async ({ id, formData }, { rejectWithValue }) => {
        try {
            const response = await api.put(`/usuarios/${id}`, formData);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Error al actualizar usuario');
        }
    }
);

export const toggleUserStatus = createAsyncThunk(
    'users/toggleStatus',
    async (id, { rejectWithValue }) => {
        try {
            const response = await api.patch(`/usuarios/${id}/status`);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Error al cambiar estatus');
        }
    }
);

const userSlice = createSlice({
    name: 'users',
    initialState: {
        items: [],
        roles: [],
        pagination: {
            current_page: 1,
            last_page: 1,
            total: 0
        },
        loading: false,
        rolesLoading: false,
        actionLoading: false,
        error: null,
        validationErrors: null,
        lastFetch: null
    },
    reducers: {
        clearValidationErrors: (state) => {
            state.validationErrors = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // obtener paginado
            .addCase(fetchUsers.pending, (state) => {
                state.loading = state.items.length === 0; // solo carga visual si no hay datos previos
                state.error = null;
            })
            .addCase(fetchUsers.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload.data;
                state.pagination = {
                    current_page: action.payload.meta?.current_page || 1,
                    last_page: action.payload.meta?.last_page || 1,
                    total: action.payload.meta?.total || 0
                };
                state.lastFetch = Date.now();
            })
            .addCase(fetchUsers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // obtener roles
            .addCase(fetchRoles.pending, (state) => {
                state.rolesLoading = true;
            })
            .addCase(fetchRoles.fulfilled, (state, action) => {
                state.rolesLoading = false;
                state.roles = action.payload;
            })
            .addCase(fetchRoles.rejected, (state) => {
                state.rolesLoading = false;
            })
            // crear
            .addCase(createUser.pending, (state) => {
                state.actionLoading = true;
                state.validationErrors = null;
            })
            .addCase(createUser.fulfilled, (state) => {
                state.actionLoading = false;
            })
            .addCase(createUser.rejected, (state, action) => {
                state.actionLoading = false;
                if (typeof action.payload === 'object' && action.payload.errors) {
                    state.validationErrors = action.payload.errors;
                } else {
                    state.error = action.payload;
                }
            })
            // actualizar
            .addCase(updateUser.pending, (state) => {
                state.actionLoading = true;
                state.validationErrors = null;
            })
            .addCase(updateUser.fulfilled, (state) => {
                state.actionLoading = false;
            })
            .addCase(updateUser.rejected, (state, action) => {
                state.actionLoading = false;
                if (typeof action.payload === 'object' && action.payload.errors) {
                    state.validationErrors = action.payload.errors;
                } else {
                    state.error = action.payload;
                }
            })
            // toggle status
            .addCase(toggleUserStatus.fulfilled, (state, action) => {
                const index = state.items.findIndex(item => item.id === action.payload.id);
                if (index !== -1) {
                    state.items[index] = action.payload;
                }
            });
    }
});

export const { clearValidationErrors } = userSlice.actions;
export default userSlice.reducer;
