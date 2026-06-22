import { configureStore, combineReducers } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import expedienteReducer from './expedienteSlice';
import catalogoReducer from './catalogoSlice';
import notificationReducer from './notificationSlice';
import transferenciaReducer from './transferenciaSlice';
import userReducer from './userSlice';
import unidadReducer from './unidadSlice';
import archivisticaReducer from './archivisticaSlice';
import correspondenciaReducer from './correspondenciaSlice';
import prestamoReducer from './prestamoSlice';

// 1.
const appReducer = combineReducers({
  auth: authReducer,
  expedientes: expedienteReducer,
  catalogos: catalogoReducer,
  notifications: notificationReducer,
  transferencias: transferenciaReducer,
  users: userReducer,
  unidades: unidadReducer,
  archivistica: archivisticaReducer,
  correspondencia: correspondenciaReducer,
  prestamos: prestamoReducer,
});

// 2.
const rootReducer = (state, action) => {
  if (action.type === 'auth/logout/fulfilled' || action.type === 'auth/logout/rejected') {
    state = undefined;
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
  // Deshabilita la verificación de serialización en Redux.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});
