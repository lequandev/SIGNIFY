import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AdminSidebar from './AdminSidebar';

const AdminLayout = () => {
  const { isAuthenticated, user } = useSelector((state: any) => state.auth);
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  // Check if user is Admin
  if (!isAuthenticated || user?.role !== 'ADMIN') {
    // return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <AdminSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className={`flex-1 transition-all duration-500 ${isCollapsed ? 'ml-20' : 'ml-72'} p-10`}>
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
