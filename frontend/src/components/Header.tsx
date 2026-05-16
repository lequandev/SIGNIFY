import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Users, LogOut, User as UserIcon } from 'lucide-react';
import { setLogout } from '../store/authSlice';

const Header: React.FC = () => {
  const { isAuthenticated, user } = useSelector((state: any) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    dispatch(setLogout());
    navigate('/login');
  };

  return (
    <nav className="flex items-center justify-between py-6 max-w-6xl mx-auto px-8 md:px-16 w-full">
      <div className="flex items-center gap-2">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-[#2563EB] rounded-lg flex items-center justify-center shadow-md shadow-[#2563EB]/20 group-hover:scale-105 transition-transform">
            <Users className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 uppercase">SIGNIFY</span>
        </Link>
      </div>
      <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
        <Link to="/" className="hover:text-[#2563EB] transition-colors">Features</Link>
        <Link to="/pricing" className="hover:text-[#2563EB] transition-colors">Pricing</Link>
        
        {isAuthenticated ? (
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full border border-slate-200">
              <UserIcon className="w-4 h-4 text-[#2563EB]" />
              <span className="text-sm font-bold text-slate-700">{user?.fullName || 'User'}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-red-500 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        ) : (
          <>
            <Link to="/login" className="hover:text-[#2563EB] transition-colors">Login</Link>
            <Link to="/register" className="bg-[#2563EB] text-white px-5 py-2 rounded-full hover:bg-[#4F46E5] transition-all shadow-md shadow-[#2563EB]/20">
              Get Started
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Header;
