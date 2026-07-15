import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { LogOut, User as UserIcon, HandMetal } from 'lucide-react';
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

  // Inject fonts once
  useEffect(() => {
    const id = 'signify-header-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&family=Poppins:wght@500;600;700;800&display=swap';
    document.head.appendChild(link);
  }, []);

  return (
    <>
      <style>{`
        .hdr-root {
          width: 100%;
          position: relative;
          z-index: 50;
          font-family: 'Open Sans', system-ui, sans-serif;
        }
        .hdr-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0.625rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }
        @media (min-width: 768px) { .hdr-inner { padding: 0.625rem 4rem; } }

        /* Logo */
        .hdr-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          text-decoration: none;
          transition: opacity 200ms ease;
        }
        .hdr-logo:hover { opacity: 0.85; }
        .hdr-logo img {
          height: 52px;
          object-fit: contain;
          transition: transform 200ms ease;
        }
        .hdr-logo:hover img { transform: scale(1.04); }

        /* Nav links */
        .hdr-nav {
          display: none;
          align-items: center;
          gap: 2rem;
        }
        @media (min-width: 768px) { .hdr-nav { display: flex; } }

        .hdr-nav-link {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1e3a8a;
          opacity: 0.7;
          text-decoration: none;
          transition: color 180ms ease, opacity 180ms ease;
          letter-spacing: 0.01em;
        }
        .hdr-nav-link:hover { color: #2563EB; opacity: 1; }

        /* Auth controls */
        .hdr-user-chip {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.375rem 0.875rem 0.375rem 0.5rem;
          background: rgba(37,99,235,0.08);
          border: 1px solid rgba(37,99,235,0.18);
          border-radius: 9999px;
        }
        .hdr-user-avatar {
          width: 28px; height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #2563EB, #1D4ED8);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }
        .hdr-user-name {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #1e3a8a;
        }

        .hdr-logout-btn {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.8125rem;
          font-weight: 700;
          color: #1e3a8a;
          opacity: 0.6;
          background: none;
          border: none;
          cursor: pointer;
          transition: color 180ms ease, opacity 180ms ease;
          padding: 0.375rem 0.5rem;
          border-radius: 8px;
        }
        .hdr-logout-btn:hover { color: #ef4444; opacity: 1; }

        .hdr-login-link {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1e3a8a;
          opacity: 0.7;
          text-decoration: none;
          transition: color 180ms ease, opacity 180ms ease;
        }
        .hdr-login-link:hover { color: #2563EB; opacity: 1; }

        .hdr-cta-link {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.5rem 1.25rem;
          background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
          color: white;
          font-family: 'Poppins', sans-serif;
          font-size: 0.8125rem;
          font-weight: 600;
          border-radius: 9999px;
          text-decoration: none;
          box-shadow: 0 4px 16px rgba(37,99,235,0.30);
          transition: filter 180ms ease, transform 180ms ease, box-shadow 180ms ease;
        }
        .hdr-cta-link:hover {
          filter: brightness(1.08);
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(37,99,235,0.40);
        }
        .hdr-auth-group { display: flex; align-items: center; gap: 1.25rem; }
      `}</style>

      <nav className="hdr-root" role="navigation" aria-label="Điều hướng chính">
        <div className="hdr-inner">
          {/* Logo */}
          <Link to="/" className="hdr-logo">
            <img src="/logo_removebg.png" alt="Signify Logo" />
          </Link>

          {/* Desktop nav */}
          <div className="hdr-nav">
            <Link to="/" className="hdr-nav-link">Tính năng</Link>
            <Link to="/packages" className="hdr-nav-link">Dịch vụ</Link>

            {isAuthenticated ? (
              <div className="hdr-auth-group">
                <div className="hdr-user-chip">
                  <div className="hdr-user-avatar">
                    <UserIcon className="w-3.5 h-3.5" />
                  </div>
                  <span className="hdr-user-name">{user?.fullName || 'Người dùng'}</span>
                </div>
                <button onClick={handleLogout} className="hdr-logout-btn">
                  <LogOut className="w-3.5 h-3.5" />
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="hdr-auth-group">
                <Link to="/login" className="hdr-login-link">Đăng nhập</Link>
                <Link to="/register" className="hdr-cta-link">
                  Bắt đầu miễn phí
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Header;
