import React from 'react';
import { Link } from 'react-router-dom';
import { HandMetal, Mail, Globe } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <>
      <style>{`
        .ftr-root {
          width: 100%;
          background: linear-gradient(160deg, #1e3a8a 0%, #1e40af 50%, #1D4ED8 100%);
          font-family: 'Open Sans', system-ui, sans-serif;
        }
        .ftr-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 3rem 1.5rem 2rem;
        }
        @media (min-width: 768px) { .ftr-inner { padding: 3rem 4rem 2rem; } }

        .ftr-top {
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
          margin-bottom: 2.5rem;
        }
        @media (min-width: 768px) {
          .ftr-top {
            flex-direction: row;
            align-items: flex-start;
            justify-content: space-between;
          }
        }

        /* Brand column */
        .ftr-brand { display: flex; flex-direction: column; gap: 1rem; }
        .ftr-logo-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          text-decoration: none;
          transition: opacity 200ms ease;
        }
        .ftr-logo-link:hover { opacity: 0.85; }
        .ftr-logo-link img { height: 44px; object-fit: contain; filter: brightness(0) invert(1); }
        .ftr-tagline {
          font-size: 0.8125rem;
          color: rgba(191,219,254,0.75);
          line-height: 1.65;
          max-width: 260px;
          margin: 0;
        }
        .ftr-contact {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.78rem;
          color: rgba(191,219,254,0.65);
          font-weight: 500;
          text-decoration: none;
          transition: color 180ms ease;
        }
        .ftr-contact:hover { color: #93c5fd; }

        /* Links columns */
        .ftr-links-group { display: flex; gap: 3rem; flex-wrap: wrap; }
        .ftr-col { display: flex; flex-direction: column; gap: 0.75rem; }
        .ftr-col-title {
          font-family: 'Poppins', sans-serif;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: rgba(191,219,254,0.55);
          margin: 0 0 0.25rem;
        }
        .ftr-link {
          font-size: 0.8125rem;
          font-weight: 500;
          color: rgba(191,219,254,0.8);
          text-decoration: none;
          transition: color 180ms ease;
          line-height: 1;
        }
        .ftr-link:hover { color: #ffffff; }

        /* Divider */
        .ftr-divider {
          height: 1px;
          background: rgba(255,255,255,0.08);
          margin-bottom: 1.75rem;
        }

        /* Bottom bar */
        .ftr-bottom {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          align-items: center;
          text-align: center;
        }
        @media (min-width: 768px) {
          .ftr-bottom {
            flex-direction: row;
            justify-content: space-between;
            text-align: left;
          }
        }
        .ftr-copy {
          font-size: 0.75rem;
          color: rgba(191,219,254,0.45);
          margin: 0;
        }
        .ftr-bottom-links {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }
        .ftr-bottom-link {
          font-size: 0.75rem;
          font-weight: 600;
          color: rgba(191,219,254,0.55);
          text-decoration: none;
          transition: color 180ms ease;
        }
        .ftr-bottom-link:hover { color: #93c5fd; }

        /* Dot accent */
        .ftr-dot {
          width: 3px; height: 3px;
          border-radius: 50%;
          background: rgba(191,219,254,0.3);
        }
      `}</style>

      <footer className="ftr-root">
        <div className="ftr-inner">
          <div className="ftr-top">
            {/* Brand */}
            <div className="ftr-brand">
              <Link to="/" className="ftr-logo-link">
                <img src="/logo_removebg.png" alt="Signify Logo" />
              </Link>
              <p className="ftr-tagline">
                Phá vỡ rào cản giao tiếp bằng công nghệ AI ngôn ngữ ký hiệu thế hệ mới.
              </p>
              <a href="mailto:contact@signify.ai" className="ftr-contact">
                <Mail className="w-3.5 h-3.5" />
                contact@signify.ai
              </a>
            </div>

            {/* Links */}
            <div className="ftr-links-group">
              <div className="ftr-col">
                <p className="ftr-col-title">Sản phẩm</p>
                <Link to="/" className="ftr-link">Tính năng</Link>
                <Link to="/packages" className="ftr-link">Bảng giá</Link>
                <Link to="/translate" className="ftr-link">Dịch thuật</Link>
              </div>
              <div className="ftr-col">
                <p className="ftr-col-title">Công ty</p>
                <Link to="/" className="ftr-link">Về chúng tôi</Link>
                <Link to="/" className="ftr-link">Blog</Link>
                <Link to="/" className="ftr-link">Liên hệ</Link>
              </div>
              <div className="ftr-col">
                <p className="ftr-col-title">Hỗ trợ</p>
                <Link to="/" className="ftr-link">Chính sách bảo mật</Link>
                <Link to="/" className="ftr-link">Điều khoản dịch vụ</Link>
                <Link to="/" className="ftr-link">Cookie</Link>
              </div>
            </div>
          </div>

          <div className="ftr-divider" />

          <div className="ftr-bottom">
            <p className="ftr-copy">© 2026 Signify AI. Trao quyền giao tiếp qua công nghệ.</p>
            <div className="ftr-bottom-links">
              <Link to="/" className="ftr-bottom-link">Bảo mật</Link>
              <span className="ftr-dot" />
              <Link to="/" className="ftr-bottom-link">Điều khoản</Link>
              <span className="ftr-dot" />
              <Link to="/" className="ftr-bottom-link">Liên hệ</Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
