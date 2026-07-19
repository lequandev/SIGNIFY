import React from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#0a101f] text-slate-300 font-sans border-t border-slate-800">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-12 md:py-16">
        <div className="flex flex-col md:flex-row gap-10 md:gap-8 justify-between mb-12 md:mb-16">
          {/* Brand */}
          <div className="flex flex-col gap-5 md:gap-6 max-w-sm">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity w-fit">
              <img src="/logo_removebg.png" alt="Signify Logo" className="h-7 brightness-0 invert" />
              <span className="font-black text-xl tracking-wide text-white">Signify</span>
            </Link>
            <p className="text-sm font-medium leading-relaxed text-slate-400">
              Phá vỡ rào cản giao tiếp bằng công nghệ AI dịch thuật Ngôn ngữ Ký hiệu thế hệ mới. Trải nghiệm trực tiếp trên video YouTube.
            </p>
            <a href="mailto:contact@signify.ai" className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors w-fit break-all">
              <Mail className="w-4 h-4 shrink-0" />
              contact@signify.ai
            </a>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-3 gap-8 md:gap-12 lg:gap-16">
            <div className="flex flex-col gap-4">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Sản phẩm</p>
              <Link to="/#features" className="text-sm font-medium hover:text-white hover:translate-x-1 transition-all">Tính năng</Link>
              <Link to="/packages" className="text-sm font-medium hover:text-white hover:translate-x-1 transition-all">Bảng giá</Link>
              <Link to="/translate" className="text-sm font-medium hover:text-white hover:translate-x-1 transition-all">Dịch thuật YouTube</Link>
            </div>

            <div className="flex flex-col gap-4">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Công ty</p>
              <Link to="/about" className="text-sm font-medium hover:text-white hover:translate-x-1 transition-all">Về chúng tôi</Link>
              <Link to="/" className="text-sm font-medium hover:text-white hover:translate-x-1 transition-all">Blog</Link>
              <Link to="/contact" className="text-sm font-medium hover:text-white hover:translate-x-1 transition-all">Liên hệ</Link>
            </div>

            <div className="flex flex-col gap-4">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Hỗ trợ</p>
              <Link to="/" className="text-sm font-medium hover:text-white hover:translate-x-1 transition-all">Chính sách bảo mật</Link>
              <Link to="/" className="text-sm font-medium hover:text-white hover:translate-x-1 transition-all">Điều khoản dịch vụ</Link>
              <Link to="/" className="text-sm font-medium hover:text-white hover:translate-x-1 transition-all">Cookie</Link>
            </div>
          </div>
        </div>

        <div className="h-px w-full bg-slate-800 mb-8" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left text-xs font-medium text-slate-500">
          <p>© 2026 Signify AI. Trao quyền giao tiếp qua công nghệ.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            <Link to="/" className="hover:text-white transition-colors">Bảo mật</Link>
            <div className="w-1 h-1 rounded-full bg-slate-700" />
            <Link to="/" className="hover:text-white transition-colors">Điều khoản</Link>
            <div className="w-1 h-1 rounded-full bg-slate-700" />
            <Link to="/contact" className="hover:text-white transition-colors">Liên hệ</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
