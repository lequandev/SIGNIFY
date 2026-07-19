import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  user: any | null;
  token: string | null;
  isAuthenticated: boolean;
}

const getStoredAuth = (): AuthState => {
  if (typeof window === 'undefined') {
    return {
      user: null,
      token: null,
      isAuthenticated: false,
    };
  }

  try {
    const storedToken = window.localStorage.getItem('token');
    const storedUser = window.localStorage.getItem('user');

    if (storedToken) {
      return {
        user: storedUser ? JSON.parse(storedUser) : null,
        token: storedToken,
        isAuthenticated: true,
      };
    }
  } catch (error) {
    console.warn('Unable to restore auth state', error);
  }

  return {
    user: null,
    token: null,
    isAuthenticated: false,
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
    setLogin: (state, action: PayloadAction<{ user: any; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      persistAuth(state);
    },
    setLogout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      persistAuth(state);
    },
  },
});

export const { setLogin, setLogout } = authSlice.actions;
export default authSlice.reducer;
