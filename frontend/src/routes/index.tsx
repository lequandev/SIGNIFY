import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from '../App';
import AuthPage from '../pages/AuthPage';
import VerifyEmail from '../pages/VerifyEmail';
import ServicePackage from '../pages/ServicePackage';
import PaymentPage from '../pages/PaymentPage';
import AdminLayout from '../components/admin/AdminLayout';
import DashboardOverview from '../pages/admin/DashboardOverview';
import UserManagement from '../pages/admin/UserManagement';
import PackageManagement from '../pages/admin/PackageManagement';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/login',
    element: <AuthPage />,
  },
  {
    path: '/register',
    element: <AuthPage />,
  },
  {
    path: '/verify-email/:token',
    element: <VerifyEmail />,
  },
  {
    path: '/packages',
    element: <ServicePackage />,
  },
  {
    path: '/payment',
    element: <PaymentPage />,
  },
  {
    path: '/payment-success',
    element: <PaymentPage />, // Use the same component but it will show success status
  },
  {
    path: '/payment-cancel',
    element: <PaymentPage />, // Use the same component but it will show cancel status
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <DashboardOverview />,
      },
      {
        path: 'users',
        element: <UserManagement />,
      },
      {
        path: 'packages',
        element: <PackageManagement />,
      },
      {
        path: 'subscriptions',
        element: <div className="p-10 text-center font-bold text-slate-400 italic">Subscription tracking coming soon...</div>,
      },
    ],
  },
]);

