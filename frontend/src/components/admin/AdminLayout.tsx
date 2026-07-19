import React from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Menu } from 'lucide-react';
import AdminSidebar from './AdminSidebar';

const AdminLayout = () => {
  const { isAuthenticated, user } = useSelector((state: any) => state.auth);
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  // Check if user is Admin
  if (!isAuthenticated || user?.role !== 'ADMIN') {
    // return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <AdminSidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-16 bg-white/90 backdrop-blur border-b border-slate-100 flex items-center justify-between px-4 shadow-sm">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="w-10 h-10 rounded-xl border border-slate-200 text-slate-600 flex items-center justify-center hover:text-[#2563EB] hover:border-[#2563EB]/30 transition-colors"
          aria-label="Mở menu admin"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <img src="/logo_removebg.png" alt="Signify Logo" className="h-8 object-contain" />
          <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Admin</span>
        </div>
      </div>

      <main className={`min-w-0 transition-all duration-500 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-72'} p-4 pt-24 sm:p-6 sm:pt-24 lg:p-10`}>
        <div className="max-w-6xl mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
