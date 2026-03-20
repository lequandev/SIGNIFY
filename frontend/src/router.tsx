import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ServicePackage from './pages/ServicePackage';
import LandingPage from './pages/LandingPage';
import PaymentPage from './pages/PaymentPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
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
