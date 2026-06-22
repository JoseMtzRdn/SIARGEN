import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';

export const fetchNotifications = createAsyncThunk(
    'notifications/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/notifications');
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Error al cargar notificaciones');
        }
    },
    {
        condition: (_, { getState }) => {
            const { notifications } = getState();
            if (notifications.loading) return false;
        }
    }
);

export const markNotificationAsRead = createAsyncThunk(
    'notifications/markAsRead',
    async (id, { rejectWithValue }) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Error');
        }
    }
);

const notificationSlice = createSlice({
    name: 'notifications',
    initialState: {
        list: [],
        unreadCount: 0,
        loading: false
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchNotifications.pending, (state) => { state.loading = true; })
            .addCase(fetchNotifications.fulfilled, (state, action) => {
                state.loading = false;
                state.list = action.payload;
                state.unreadCount = action.payload.filter(n => !n.read).length;
            })
            .addCase(markNotificationAsRead.fulfilled, (state, action) => {
                const notif = state.list.find(n => n.id === action.payload);
                if (notif && !notif.read) {
                    notif.read = true;
                    state.unreadCount--;
                }
            });
    }
});

export default notificationSlice.reducer;
