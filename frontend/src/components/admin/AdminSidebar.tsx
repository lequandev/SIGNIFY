import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setLogout } from '../../store/authSlice';
import { useToast } from '../../context/ToastContext';
import {
  LayoutDashboard,
  Users,
  Package,
  CreditCard,
  LogOut,
  ChevronRight,
  ChevronLeft,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isCollapsed, setIsCollapsed, isMobileOpen = false, setIsMobileOpen }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Overview', path: '/admin' },
    { icon: Users, label: 'Users', path: '/admin/users' },
    { icon: Package, label: 'Packages', path: '/admin/packages' },
    { icon: CreditCard, label: 'Subscriptions', path: '/admin/subscriptions' },
  ];

  const closeMobileMenu = () => setIsMobileOpen?.(false);

  const handleLogout = () => {
    dispatch(setLogout());
    localStorage.removeItem('token');
    showToast('Logged out successfully', 'info');
    closeMobileMenu();
    navigate('/login');
  };

  const renderNavItems = (mobile = false) => (
    <nav className={`${mobile ? 'px-4 py-4' : 'flex-1 px-4 py-4'} space-y-2`}>
      {menuItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/admin'}
          onClick={mobile ? closeMobileMenu : undefined}
          className={({ isActive }) => `
            flex items-center ${!mobile && isCollapsed ? 'justify-center' : 'justify-between'} px-4 py-4 rounded-2xl transition-all group relative
            ${isActive
              ? 'bg-[#2563EB]/5 text-[#2563EB]'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
          `}
        >
          {({ isActive }) => (
            <>
              <div className="flex items-center gap-4 min-w-0">
                <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-[#2563EB]' : 'text-slate-400 group-hover:text-slate-900'} transition-colors`} />
                {(mobile || !isCollapsed) && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="font-bold text-sm tracking-tight whitespace-nowrap overflow-hidden truncate"
                  >
                    {item.label}
                  </motion.span>
                )}
              </div>
              {(mobile || !isCollapsed) && isActive && (
                <motion.div layoutId={mobile ? 'active-mobile-pill' : 'active-pill'}>
                  <ChevronRight className="w-4 h-4 flex-shrink-0" />
                </motion.div>
              )}

              {!mobile && isCollapsed && (
                <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[100] shadow-xl">
                  {item.label}
                </div>
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );

  const renderLogout = (mobile = false) => (
    <div className={`p-4 border-t border-slate-50 ${!mobile && isCollapsed ? 'flex justify-center' : ''}`}>
      <button
        onClick={handleLogout}
        className={`flex items-center ${!mobile && isCollapsed ? 'justify-center' : 'gap-4'} w-full px-4 py-4 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all group relative`}
      >
        <LogOut className="w-5 h-5 flex-shrink-0 group-hover:rotate-180 transition-transform duration-500" />
        {(mobile || !isCollapsed) && <span className="font-bold text-sm tracking-tight">Logout</span>}
        {!mobile && isCollapsed && (
          <div className="absolute left-full ml-4 px-3 py-2 bg-red-500 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[100] shadow-xl">
            Logout
          </div>
        )}
      </button>
    </div>
  );

  return (
    <>
      <div className="hidden lg:flex fixed left-0 top-0 z-50 h-screen">
        <motion.div
          animate={{ width: isCollapsed ? 84 : 288 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="bg-white h-full border-r border-slate-100 flex flex-col relative shadow-sm"
        >
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-10 w-6 h-6 bg-white border border-slate-100 rounded-full flex items-center justify-center shadow-md hover:text-[#2563EB] transition-colors z-[60] group"
            aria-label={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
          </button>

          <div className={`p-6 flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} mb-4 h-24`}>
            <div className="flex items-center gap-3 min-w-0">
              <img
                src="/logo_removebg.png"
                alt="Signify Logo"
                className={`${isCollapsed ? 'h-10 w-10' : 'h-12'} object-contain flex-shrink-0`}
              />
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="overflow-hidden"
                >
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 truncate bg-slate-50 px-2 py-1 rounded-md border border-slate-100">Admin Panel</p>
                </motion.div>
              )}
            </div>
          </div>

          {renderNavItems(false)}
          {renderLogout(false)}
        </motion.div>
      </div>

      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.button
              type="button"
              className="lg:hidden fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobileMenu}
              aria-label="Đóng menu admin"
            />
            <motion.aside
              className="lg:hidden fixed left-0 top-0 bottom-0 z-[60] w-[min(82vw,320px)] bg-white border-r border-slate-100 shadow-2xl flex flex-col"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="h-20 px-5 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-3 min-w-0">
                  <img src="/logo_removebg.png" alt="Signify Logo" className="h-10 object-contain" />
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] truncate bg-slate-50 px-2 py-1 rounded-md border border-slate-100">Admin Panel</p>
                </div>
                <button
                  onClick={closeMobileMenu}
                  className="w-10 h-10 rounded-xl border border-slate-100 flex items-center justify-center text-slate-500 hover:text-[#2563EB] transition-colors"
                  aria-label="Đóng menu admin"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {renderNavItems(true)}
              </div>
              {renderLogout(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default AdminSidebar;
