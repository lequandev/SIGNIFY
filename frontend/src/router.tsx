import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import ServicePackage from './pages/ServicePackage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/packages',
    element: <ServicePackage />,
  },
]);
