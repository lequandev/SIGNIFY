import { createBrowserRouter } from 'react-router-dom';
import App from '../App';
import AuthPage from '../pages/AuthPage';
import VerifyEmail from '../pages/VerifyEmail';

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
]);
