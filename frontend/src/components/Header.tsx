import React, { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { LogOut, Menu, User as UserIcon, X } from 'lucide-react';
import { setLogout } from '../store/authSlice';
import type { RootState } from '../store/store';

const Header: React.FC = () => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [openMenuPath, setOpenMenuPath] = useState<string | null>(null);
  const isMenuOpen = openMenuPath === location.pathname;
  const isStudent = user?.role === 'STUDENT';

  const handleLogout = () => {
    localStorage.removeItem('token');
    dispatch(setLogout());
    setOpenMenuPath(null);
    navigate('/login');
  };

  const navItems = isStudent
    ? []
    : [
        { to: '/', label: 'Tính năng' },
        { to: '/packages', label: 'Dịch vụ' },
        { to: '/about', label: 'Về chúng tôi' },
        { to: '/contact', label: 'Liên hệ' },
      ];

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors duration-200 ${isActive ? 'text-primary font-semibold' : 'text-on-surface-variant hover:text-primary'}`;

  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-2xl px-4 py-3 text-sm font-bold transition-all ${isActive ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:bg-surface-container hover:text-primary'}`;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-[72px] bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant flex items-center justify-center font-sans">
      <div className="w-full max-w-[1400px] px-4 sm:px-6 lg:px-12 flex items-center justify-between gap-3">
        {/* Logo */}
        <Link to={isStudent ? '/my-lessons' : '/'} className="flex items-center gap-4 shrink-0 hover:opacity-85 transition-opacity">
          <img src="/logo_removebg.png" alt="Signify Logo" className="h-9 sm:h-10 object-contain hover:scale-105 transition-transform" />
        </Link>

        {/* Centered Navigation */}
        <nav className="hidden lg:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClass}>{item.label}</NavLink>
          ))}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {isAuthenticated ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link to="/profile" className="group flex items-center gap-2 rounded-full border border-primary-container/20 bg-primary-container/10 p-1.5 transition-all hover:bg-primary-container/20 sm:pr-2">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold shrink-0 shadow-sm overflow-hidden">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : user?.fullName ? (
                    user.fullName.charAt(0).toUpperCase()
                  ) : (
                    <UserIcon className="w-4 h-4" />
                  )}
                </div>
              </Link>
              <button onClick={handleLogout} className="hidden sm:flex items-center gap-1.5 text-sm font-bold text-on-surface/60 hover:text-error transition-colors px-2 py-1.5 rounded-lg">
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">Đăng xuất</span>
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2 sm:gap-4">
              <Link to="/login" className="text-sm text-on-surface-variant font-semibold hover:text-primary px-4 py-2 rounded-lg transition-all duration-200 hover:bg-surface-container-low hidden md:inline-block">Đăng nhập</Link>
              <Link to="/register" className="text-sm bg-primary text-on-primary px-4 lg:px-6 py-2.5 h-[42px] rounded-xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 transform hover:scale-[1.02] active:scale-95 flex items-center justify-center whitespace-nowrap">Bắt đầu miễn phí</Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setOpenMenuPath(isMenuOpen ? null : location.pathname)}
            className="lg:hidden w-10 h-10 rounded-xl border border-outline-variant/60 bg-surface-container-lowest text-on-surface flex items-center justify-center shadow-sm hover:text-primary hover:border-primary/40 transition-colors"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
            aria-label={isMenuOpen ? 'Đóng menu điều hướng' : 'Mở menu điều hướng'}
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="lg:hidden absolute inset-x-0 top-[72px] border-b border-outline-variant bg-surface-container-lowest/95 backdrop-blur-xl shadow-xl" id="mobile-navigation">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-4">
            <nav className="grid gap-2">
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} className={mobileNavLinkClass}>{item.label}</NavLink>
              ))}
            </nav>

            <div className="mt-4 border-t border-outline-variant/50 pt-4">
              {isAuthenticated ? (
                <div className="grid gap-2">
                  {!isStudent && <NavLink to="/profile" className={mobileNavLinkClass}>Hồ sơ cá nhân</NavLink>}
                  <button onClick={handleLogout} className="rounded-2xl px-4 py-3 text-left text-sm font-bold text-error hover:bg-error/10 transition-all flex items-center gap-2">
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Link to="/login" className="rounded-xl border border-outline-variant/60 px-4 py-3 text-center text-sm font-bold text-on-surface-variant hover:text-primary hover:border-primary/40 transition-colors">Đăng nhập</Link>
                  <Link to="/register" className="rounded-xl bg-primary px-4 py-3 text-center text-sm font-bold text-on-primary shadow-lg shadow-primary/20">Bắt đầu miễn phí</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
