import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';

const roleHome: Record<string, string> = {
  ADMIN: '/admin',
  SCHOOL_ADMIN: '/school',
  TEACHER: '/teacher',
  STUDENT: '/my-lessons',
};

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const location = useLocation();
  const { initialized, isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  if (!initialized) return null;

  if (!isAuthenticated || !user) {
    const returnTo = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={`/login?redirect=${encodeURIComponent(returnTo)}`} replace />;
  }

  if (allowedRoles && (!user.role || !allowedRoles.includes(user.role))) {
    return <Navigate to={user.role ? roleHome[user.role] || '/' : '/'} replace />;
  }

  return children;
};

export default ProtectedRoute;
