import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface AuthUser {
  id?: string;
  _id?: string;
  fullName?: string;
  email?: string;
  username?: string;
  phoneNumber?: string;
  address?: string;
  avatarUrl?: string;
  role?: string;
  status?: string;
  createdAt?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  initialized: boolean;
}

const getStoredAuth = (): AuthState => {
  if (typeof window === 'undefined') {
    return {
      user: null,
      token: null,
      isAuthenticated: false,
      initialized: true,
    };
  }

  try {
    const storedToken = window.localStorage.getItem('token');
    if (storedToken) {
      return {
        user: null,
        token: storedToken,
        isAuthenticated: false,
        initialized: false,
      };
    }
  } catch (error) {
    console.warn('Unable to restore auth state', error);
  }

  return {
    user: null,
    token: null,
    isAuthenticated: false,
    initialized: true,
  };
};

const persistAuth = (auth: AuthState) => {
  if (typeof window === 'undefined') return;

  if (auth.token && auth.user) {
    window.localStorage.setItem('token', auth.token);
    window.localStorage.setItem('user', JSON.stringify(auth.user));
  } else {
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('user');
  }
};

const initialState: AuthState = getStoredAuth();

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLogin: (state, action: PayloadAction<{ user: AuthUser; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.initialized = true;
      persistAuth(state);
    },
    restoreStoredSession: (state, action: PayloadAction<string | null>) => {
      state.user = null;
      state.token = action.payload;
      state.isAuthenticated = false;
      state.initialized = action.payload === null;
    },
    setLogout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.initialized = true;
      persistAuth(state);
    },
  },
});

export const { restoreStoredSession, setLogin, setLogout } = authSlice.actions;
export default authSlice.reducer;
