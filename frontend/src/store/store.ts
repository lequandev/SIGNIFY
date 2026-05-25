import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import { packageApi } from '../redux/api/packageApi';

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
