import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Users, Zap, Globe, MessageSquare, ArrowRight, Shield, Video, Cpu, LogIn, UserPlus, LogOut, User as UserIcon } from 'lucide-react';
import { setLogout } from '../features/authSlice';

const LandingPage: React.FC = () => {
  const { isAuthenticated, user } = useSelector((state: any) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    dispatch(setLogout());
    navigate('/login');
  };

  const features = [
    {
      icon: <Cpu className="w-6 h-6 text-[#2563EB]" />,
      title: "Real-time AI Translation",
      description: "Advanced neural networks translate sign language to text and speech instantly."
    },
    {
      icon: <Globe className="w-6 h-6 text-[#4F46E5]" />,
      title: "Global Dialect Support",
      description: "Support for ASL, BSL, VSL, and many other regional sign language dialects."
    },
    {
      icon: <MessageSquare className="w-6 h-6 text-[#7C3AED]" />,
      title: "Two-way Communication",
      description: "Seamlessly bridge the gap between signers and non-signers in any environment."
    },
    {
      icon: <Shield className="w-6 h-6 text-[#2563EB]" />,
      title: "Privacy First",
      description: "Your video data is processed securely and never stored without your explicit consent."
    }
  ];

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-[#2563EB] selection:text-white">
      {/* Navigation */}
      <nav className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto text-slate-900 font-bold">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm group-hover:scale-105 transition-transform">
              <img 
                src="/logo_removebg.png" 
                alt="Signify Logo" 
                className="w-full h-full object-contain p-1 bg-white"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement?.insertAdjacentHTML('beforeend', '<div class="w-full h-full bg-[#2563EB] flex items-center justify-center text-white font-black">S</div>');
                }}
              />
            </div>
            <span className="text-xl font-black tracking-tight uppercase">SIGNIFY</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-600">
            <Link to="/features" className="hover:text-[#2563EB] transition-colors">Tính năng</Link>
            <Link to="/packages" className="hover:text-[#2563EB] transition-colors">Bảng giá</Link>
            
            <div className="h-6 w-px bg-slate-200" />
            
            {isAuthenticated ? (
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-50 rounded-full border border-slate-200">
                  <UserIcon className="w-4 h-4 text-[#2563EB]" />
                  <span className="text-sm font-bold text-slate-700">{user?.fullName || 'Người dùng'}</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-red-500 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="flex items-center gap-2 hover:text-[#2563EB] transition-colors">
                  <LogIn className="w-4 h-4" />
                  Đăng nhập
                </Link>
                <Link to="/register" className="bg-[#2563EB] text-white px-6 py-2.5 rounded-full hover:bg-[#4F46E5] transition-all shadow-lg shadow-[#2563EB]/20 flex items-center gap-2 active:scale-95">
                  <UserPlus className="w-4 h-4 text-white" />
                  Bắt đầu ngay
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden bg-gradient-to-b from-slate-50/50 to-white">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#2563EB]/10 text-[#2563EB] rounded-full text-xs font-black uppercase tracking-widest mb-8 border border-[#2563EB]/20">
              <Zap className="w-3.5 h-3.5" />
              <span>CÔNG NGHỆ AI THẾ HỆ MỚI</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1] mb-8 tracking-tighter">
              Xóa Bỏ Rào Cản Với <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] via-[#4F46E5] to-[#7C3AED]">
                Dịch Thuật AI
              </span>
            </h1>
            <p className="text-xl text-slate-600 mb-12 max-w-lg leading-relaxed font-medium">
              Signify sử dụng thị giác máy tính và AI tiên tiến để dịch ngôn ngữ ký hiệu theo thời gian thực, 
              giúp cộng đồng người khiếm thính giao tiếp dễ dàng hơn bao giờ hết.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {!isAuthenticated ? (
                <Link to="/register" className="w-full sm:w-auto bg-[#2563EB] text-white px-10 py-5 rounded-2xl font-black hover:bg-[#4F46E5] transition-all shadow-2xl shadow-[#2563EB]/30 flex items-center justify-center gap-3 group active:scale-95">
                  Bắt đầu dịch ngay
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <Link to="/translate" className="w-full sm:w-auto bg-[#2563EB] text-white px-10 py-5 rounded-2xl font-black hover:bg-[#4F46E5] transition-all shadow-2xl shadow-[#2563EB]/30 flex items-center justify-center gap-3 group active:scale-95">
                  Trải nghiệm dịch
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
              <Link to="/packages" className="w-full sm:w-auto bg-white text-slate-900 px-10 py-5 rounded-2xl font-black hover:bg-slate-50 transition-all border-2 border-slate-200 flex items-center justify-center">
                Xem bảng giá
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "circOut" }}
            className="relative"
          >
            <div className="relative z-10 bg-slate-900 rounded-[3rem] p-4 shadow-[0_40px_100px_-20px_rgba(37,99,235,0.25)] overflow-hidden aspect-video flex items-center justify-center border-4 border-white">
              <div className="absolute inset-0 bg-gradient-to-br from-[#2563EB]/30 to-[#7C3AED]/30 mix-blend-overlay" />
              <Video className="w-24 h-24 text-white/10" />
              
              <div className="absolute bottom-8 left-8 right-8 bg-black/40 backdrop-blur-xl border border-white/20 rounded-2xl p-5 flex items-center gap-5">
                <div className="w-12 h-12 bg-[#2563EB] rounded-full flex items-center justify-center shadow-lg shadow-[#2563EB]/40 animate-pulse">
                  <Zap className="text-white w-6 h-6" />
                </div>
                <div>
                  <div className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em]">TRẠNG THÁI AI</div>
                  <div className="text-white font-bold text-lg">Đang dịch ASL...</div>
                </div>
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -top-16 -right-16 w-64 h-64 bg-[#2563EB]/10 rounded-full blur-[80px]" />
            <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-[#7C3AED]/10 rounded-full blur-[80px]" />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">Giao Tiếp Không Giới Hạn</h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium">
              Công nghệ của chúng tôi được thiết kế để mang lại tốc độ, độ chính xác và khả năng tiếp cận cho tất cả mọi người.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
              >
                <div className="mb-8 w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center shadow-inner group-hover:bg-[#2563EB]/10 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-4">{feature.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed font-medium">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-10 text-slate-600">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-100">
                <img src="/logo_removebg.png" alt="Signify" className="w-full h-full object-contain" />
              </div>
              <span className="text-lg font-black tracking-tight text-slate-900 uppercase">SIGNIFY</span>
            </div>
            <p className="text-sm opacity-60">© 2026 Signify AI. Trao quyền giao tiếp thông qua công nghệ.</p>
          </div>
          
          <div className="flex items-center gap-10 text-xs font-black uppercase tracking-wider">
            <Link to="/" className="hover:text-[#2563EB] transition-colors">Chính sách bảo mật</Link>
            <Link to="/" className="hover:text-[#2563EB] transition-colors">Điều khoản dịch vụ</Link>
            <Link to="/" className="hover:text-[#2563EB] transition-colors">Liên hệ</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
