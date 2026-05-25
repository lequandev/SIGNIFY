import React from 'react';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="py-12 border-t border-slate-100 w-full mt-auto bg-white">
      <div className="max-w-6xl mx-auto px-8 md:px-16 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#2563EB] rounded flex items-center justify-center">
            <Users className="text-white w-4 h-4" />
          </div>
          <span className="text-sm font-bold tracking-tight text-slate-900 uppercase">SIGNIFY</span>
        </div>
        <p className="text-slate-400 text-xs">© 2026 Signify AI. Empowering communication through technology.</p>
        <div className="flex items-center gap-6 text-xs font-semibold text-slate-500">
          <Link to="/" className="hover:text-[#2563EB] transition-colors">Privacy Policy</Link>
          <Link to="/" className="hover:text-[#2563EB] transition-colors">Terms of Service</Link>
          <Link to="/" className="hover:text-[#2563EB] transition-colors">Contact</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
