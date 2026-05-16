import { createBrowserRouter } from 'react-router-dom';
import App from '../App';
import AuthPage from '../pages/AuthPage';
import VerifyEmail from '../pages/VerifyEmail';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
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
]);
