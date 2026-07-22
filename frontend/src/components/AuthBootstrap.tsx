import { useEffect, useState, type ReactNode } from 'react';
import axios from 'axios';
import { AlertCircle, Loader2, LogOut, RefreshCw } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import api from '../services/api';
import { restoreStoredSession, setLogin, setLogout, type AuthUser } from '../store/authSlice';
import type { AppDispatch, RootState } from '../store/store';

type PendingProfileRequest = {
  token: string;
  promise: Promise<AuthUser>;
};

let pendingProfileRequest: PendingProfileRequest | null = null;

const loadCurrentUser = (token: string) => {
  if (pendingProfileRequest?.token === token) return pendingProfileRequest.promise;

  const promise = api.get<AuthUser>('/users/profile')
    .then(response => response.data)
    .finally(() => {
      if (pendingProfileRequest?.promise === promise) pendingProfileRequest = null;
    });

  pendingProfileRequest = { token, promise };
  return promise;
};

const AuthBootstrap = ({ children }: { children: ReactNode }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { initialized, token } = useSelector((state: RootState) => state.auth);
  const [attempt, setAttempt] = useState(0);
  const [restoreError, setRestoreError] = useState(false);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.storageArea !== window.localStorage || event.key !== 'token' || event.newValue === token) return;
      setRestoreError(false);
      dispatch(restoreStoredSession(event.newValue));
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [dispatch, token]);

  useEffect(() => {
    if (initialized) return;
    if (!token) {
      dispatch(setLogout());
      return;
    }

    let active = true;

    void loadCurrentUser(token)
      .then(user => {
        if (active) dispatch(setLogin({ user, token }));
      })
      .catch(error => {
        if (!active) return;
        if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
          dispatch(setLogout());
          return;
        }
        setRestoreError(true);
      });

    return () => {
      active = false;
    };
  }, [attempt, dispatch, initialized, token]);

  if (initialized) return children;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-on-surface">
      <div className="flex max-w-sm flex-col items-center text-center">
        <img src="/logo_removebg.png" alt="Signify" className="h-14 w-auto object-contain" />
        {restoreError ? (
          <>
            <div className="mt-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-error/10 text-error">
              <AlertCircle className="h-6 w-6" />
            </div>
            <p className="mt-4 text-sm font-bold">Không thể tải tài khoản hiện tại.</p>
            <div className="mt-5 flex items-center gap-3">
              <button type="button" onClick={() => { setRestoreError(false); setAttempt(current => current + 1); }} className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-on-primary">
                <RefreshCw className="h-4 w-4" />Thử lại
              </button>
              <button type="button" onClick={() => dispatch(setLogout())} className="flex h-10 w-10 items-center justify-center rounded-xl border border-outline-variant text-on-surface-variant" title="Đăng xuất" aria-label="Đăng xuất">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </>
        ) : (
          <Loader2 className="mt-8 h-8 w-8 animate-spin text-primary" aria-label="Đang tải tài khoản" />
        )}
      </div>
    </main>
  );
};

export default AuthBootstrap;
