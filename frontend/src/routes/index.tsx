import { createBrowserRouter } from 'react-router-dom';
import App from '../App';
import AuthPage from '../pages/AuthPage';
import VerifyEmail from '../pages/VerifyEmail';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ProfilePage from '../pages/ProfilePage';
import ServicePackage from '../pages/ServicePackage';
import PaymentPage from '../pages/PaymentPage';
import SchoolPage from '../pages/SchoolPage';
import SchoolInvitationPage from '../pages/SchoolInvitationPage';
import TeacherPage from '../pages/TeacherPage';
import MyLessonsPage from '../pages/MyLessonsPage';
import AboutPage from '../pages/AboutPage';
import ContactPage from '../pages/ContactPage';
import AdminLayout from '../components/admin/AdminLayout';
import DashboardOverview from '../pages/admin/DashboardOverview';
import UserManagement from '../pages/admin/UserManagement';
import PackageManagement from '../pages/admin/PackageManagement';
import SubscriptionManagement from '../pages/admin/SubscriptionManagement';
import SchoolManagement from '../pages/admin/SchoolManagement';

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
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/profile',
    element: <ProfilePage />,
  },
  {
    path: '/packages',
    element: <ServicePackage />,
  },
  {
    path: '/about',
    element: <AboutPage />,
  },
  {
    path: '/contact',
    element: <ContactPage />,
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
    path: '/school',
    element: <SchoolPage />,
  },
  {
    path: '/school/invitations/:token',
    element: <SchoolInvitationPage />,
  },
  {
    path: '/teacher',
    element: <TeacherPage />,
  },
  {
    path: '/teacher/classes/:id',
    element: <TeacherPage />,
  },
  {
    path: '/my-lessons',
    element: <MyLessonsPage />,
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
        element: <SubscriptionManagement />,
      },
      {
        path: 'schools',
        element: <SchoolManagement />,
      },
    ],
  },
]);

