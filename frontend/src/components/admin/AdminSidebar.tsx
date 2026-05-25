import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setLogout } from '../../store/authSlice';
import { useToast } from '../../context/ToastContext';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  CreditCard, 
  Settings, 
  LogOut,
  ChevronRight,
  Menu,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Overview', path: '/admin' },
    { icon: Users, label: 'Users', path: '/admin/users' },
    { icon: Package, label: 'Packages', path: '/admin/packages' },
    { icon: CreditCard, label: 'Subscriptions', path: '/admin/subscriptions' },
  ];

  const handleLogout = () => {
    dispatch(setLogout());
    localStorage.removeItem('token');
    showToast('Logged out successfully', 'info');
    navigate('/login');
  };

  return (
    <div className="fixed left-0 top-0 z-50 flex h-screen">
      <motion.div 
        animate={{ width: isCollapsed ? 84 : 288 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="bg-white h-full border-r border-slate-100 flex flex-col relative shadow-sm"
      >
        {/* Toggle Button - Outside/Edge */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-10 w-6 h-6 bg-white border border-slate-100 rounded-full flex items-center justify-center shadow-md hover:text-[#2563EB] transition-colors z-[60] group"
        >
          {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>

        <div className={`p-6 flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} mb-4 h-24`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-[#2563EB] rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg shadow-[#2563EB]/20">
              <span className="text-white font-black text-xl">S</span>
            </div>
            {!isCollapsed && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="overflow-hidden"
              >
                <h1 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic leading-none truncate">SIGNIFY</h1>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 truncate">Admin Panel</p>
              </motion.div>
            )}
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              className={({ isActive }) => `
                flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-4 py-4 rounded-2xl transition-all group relative
                ${isActive 
                  ? 'bg-[#2563EB]/5 text-[#2563EB]' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
              `}
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-4 min-w-0">
                    <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-[#2563EB]' : 'text-slate-400 group-hover:text-slate-900'} transition-colors`} />
                    {!isCollapsed && (
                      <motion.span 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="font-bold text-sm tracking-tight whitespace-nowrap overflow-hidden truncate"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </div>
                  {!isCollapsed && isActive && (
                    <motion.div layoutId="active-pill">
                      <ChevronRight className="w-4 h-4 flex-shrink-0" />
                    </motion.div>
                  )}
                  
                  {isCollapsed && (
                    <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[100] shadow-xl">
                      {item.label}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className={`p-4 border-t border-slate-50 ${isCollapsed ? 'flex justify-center' : ''}`}>
          <button 
            onClick={handleLogout}
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-4'} w-full px-4 py-4 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all group relative`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0 group-hover:rotate-180 transition-transform duration-500" />
            {!isCollapsed && <span className="font-bold text-sm tracking-tight">Logout</span>}
            {isCollapsed && (
              <div className="absolute left-full ml-4 px-3 py-2 bg-red-500 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[100] shadow-xl">
                Logout
              </div>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminSidebar;
