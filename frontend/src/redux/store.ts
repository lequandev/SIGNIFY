import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/authSlice';
import { packageApi } from './api/packageApi';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [packageApi.reducerPath]: packageApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(packageApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
