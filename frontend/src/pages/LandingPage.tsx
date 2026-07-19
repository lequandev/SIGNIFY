import React, { useEffect } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Zap, Globe, Check, Play, Youtube, Chrome, Sparkles, MoveRight, Video } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const fadeUpVariant = {
  hidden: { opacity: 0, y: 40 },
  visible: (custom = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, delay: custom * 0.1 }
  })
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const itemVariant = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.6 }
  }
};

const LandingPage = () => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -150]);
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [location.pathname]);

  return (
    <div className="bg-surface text-on-surface font-sans selection:bg-primary/20 selection:text-primary overflow-hidden">
      <Header />
      
      <main>
        {/* HERO SECTION - Disruptive & Premium */}
        <section className="relative w-full min-h-[calc(100vh-72px)] lg:min-h-[95vh] flex items-center pt-24 md:pt-28 pb-16 md:pb-20 overflow-hidden">
          {/* Abstract Glows */}
          <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] md:w-[600px] md:h-[600px] bg-primary/20 rounded-full blur-[70px] md:blur-[120px] mix-blend-multiply opacity-70 animate-[pulse_6s_ease-in-out_infinite]" />
          <div className="absolute bottom-1/4 right-1/4 translate-x-1/4 translate-y-1/4 w-[260px] h-[260px] md:w-[500px] md:h-[500px] bg-secondary/15 rounded-full blur-[60px] md:blur-[100px] mix-blend-multiply opacity-60" />
          
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 w-full relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            <motion.div 
              className="lg:col-span-7 flex flex-col items-start text-left"
              initial="hidden" animate="visible" variants={staggerContainer}
            >
              <motion.div variants={fadeUpVariant} custom={0} className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-lowest border border-outline-variant/50 shadow-sm mb-8 hover:shadow-md transition-shadow">
                <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Hệ sinh thái dịch thuật VSL</span>
              </motion.div>

              <motion.h1 variants={fadeUpVariant} custom={1} className="text-3xl md:text-4xl lg:text-5xl leading-[1.1] font-black tracking-tight text-on-surface mb-8">
                Đưa ngôn ngữ <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-tertiary inline-block pb-2 relative">
                  Ký Hiệu
                  {/* Decorative underline */}
                  <motion.svg initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, delay: 0.5 }} className="absolute -bottom-1 left-0 w-full h-4 text-primary opacity-40" viewBox="0 0 100 20" preserveAspectRatio="none"><path d="M0 15 Q 50 0 100 15" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" /></motion.svg>
                </span> <br />
                vào thế giới Video
              </motion.h1>

              <motion.p variants={fadeUpVariant} custom={2} className="text-base md:text-lg text-on-surface-variant font-medium leading-relaxed max-w-2xl mb-10 md:mb-12 border-l-4 border-primary/30 pl-4 sm:pl-6">
                Xóa bỏ rào cản thông tin cho người khiếm thính. Signify tự động trích xuất phụ đề YouTube và biểu diễn qua chuỗi hoạt ảnh Ngôn ngữ Ký hiệu Việt Nam (VSL) siêu mượt mà.
              </motion.p>

              <motion.div variants={fadeUpVariant} custom={3} className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto">
                <Link to="/" className="h-14 px-8 bg-on-background text-surface-bright rounded-2xl text-base font-bold flex items-center justify-center gap-3 shadow-2xl hover:scale-[1.02] hover:bg-primary transition-all duration-300 group">
                  Trải nghiệm ngay
                  <motion.span animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}><MoveRight className="w-5 h-5" /></motion.span>
                </Link>
                <button className="h-14 px-8 bg-surface-container-lowest text-on-surface rounded-2xl text-base font-bold border border-outline-variant/60 flex items-center justify-center gap-3 hover:bg-surface-container hover:shadow-lg transition-all duration-300">
                  <Chrome className="w-5 h-5 text-primary" /> Cài đặt Extension
                </button>
              </motion.div>
            </motion.div>

            {/* Hero Visual */}
            <motion.div 
              className="lg:col-span-5 relative hidden md:block"
              initial={{ opacity: 0, scale: 0.8, rotate: -5 }} 
              animate={{ opacity: 1, scale: 1, rotate: 0 }} 
              transition={{ duration: 1, ease: "easeOut" }}
            >
              <motion.div className="relative z-10 w-full aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white bg-surface-container-low">
                <img src="/landingPage.png" alt="Video Translation" className="w-full h-full object-cover opacity-90" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8">
                </div>
              </motion.div>
              
              {/* Floating Badge */}
              <motion.div 
                className="absolute left-0 lg:-left-12 top-3/4 bg-white px-4 py-3 rounded-2xl shadow-xl border border-slate-100 z-20 flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-lg font-black text-slate-900">98.5%</p>
                  <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">Độ chính xác NLP</p>
                </div>
              </motion.div>
            </motion.div>
            
          </div>
        </section>

        {/* FEATURES BENTO - Staggered Scroll Animation */}
        <section id="features" className="py-24 relative bg-surface-container-lowest">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
            
            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
              className="mb-16 md:mb-24 flex flex-col md:flex-row justify-between items-end gap-8"
            >
              <div className="max-w-2xl">
                <h2 className="text-2xl md:text-3xl font-black tracking-tight text-on-surface mb-6">
                  Công nghệ phá vỡ <br/><span className="text-outline">sự im lặng.</span>
                </h2>
                <p className="text-lg text-on-surface-variant font-medium">
                  Kết hợp giữa Extension tiện lợi và công nghệ Xử lý Ngôn ngữ Tự nhiên (NLP) thông minh, giúp người khiếm thính tiếp cận tri thức tức thì.
                </p>
              </div>
            </motion.div>

            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-auto md:auto-rows-[320px]"
            >
              {/* Feature 1 - Large spanning */}
              <motion.div variants={itemVariant} className="md:col-span-2 bg-surface-container-low rounded-[2rem] p-6 sm:p-8 lg:p-10 overflow-hidden relative group border border-outline-variant/30 hover:shadow-2xl transition-all duration-500">
                <div className="relative z-10 w-full sm:w-2/3">
                  <div className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">
                    <Youtube className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-on-surface">Dịch trực tiếp trên YouTube</h3>
                  <p className="text-on-surface-variant text-base font-medium">Cơ chế nhúng linh hoạt giúp hiển thị khung avatar ngôn ngữ ký hiệu ngay trên giao diện video mà không phá vỡ bố cục gốc.</p>
                </div>
                <div className="absolute right-0 bottom-0 w-1/2 h-4/5 bg-gradient-to-tl from-primary/10 to-transparent rounded-tl-[100%] z-0 translate-x-10 translate-y-10 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-700" />
              </motion.div>

              {/* Feature 2 */}
              <motion.div variants={itemVariant} className="bg-surface-container-lowest border border-outline-variant/50 shadow-sm rounded-[2rem] p-6 sm:p-8 lg:p-10 flex flex-col hover:border-secondary/40 hover:shadow-xl transition-all duration-500 group">
                <div className="w-14 h-14 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <Chrome className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-on-surface">Extension Thông Minh</h3>
                <p className="text-on-surface-variant text-sm font-medium flex-grow">Chỉ 1 click cài đặt, tự động phát hiện phụ đề và kích hoạt hệ thống dịch thuật ngầm vô cùng nhẹ nhàng.</p>
              </motion.div>

              {/* Feature 3 */}
              <motion.div variants={itemVariant} className="bg-surface-container-lowest border border-outline-variant/50 shadow-sm rounded-[2rem] p-6 sm:p-8 lg:p-10 flex flex-col hover:border-tertiary/40 hover:shadow-xl transition-all duration-500 group">
                <div className="w-14 h-14 bg-tertiary/10 text-tertiary rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <Zap className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-on-surface">Tối ưu hóa Stopwords</h3>
                <p className="text-on-surface-variant text-sm font-medium flex-grow">Lọc tự động các từ nối (nè, nha, thì, là, mà) giúp câu rút gọn, giữ nguyên nghĩa cốt lõi phù hợp với ngữ pháp VSL.</p>
              </motion.div>

              {/* Feature 4 - Large spanning */}
              <motion.div variants={itemVariant} className="md:col-span-2 min-h-[320px] md:min-h-[400px] bg-[#0a101f] text-white rounded-[2rem] p-6 sm:p-8 lg:p-10 overflow-hidden relative group">
                <div className="relative z-10 w-full sm:w-2/3">
                  <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform backdrop-blur-md">
                    <Globe className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Từ Điển VSL Toàn Diện</h3>
                  <p className="text-slate-400 text-base font-medium mb-6">Liên tục cập nhật từ vựng ghép và cụm từ phức tạp, cho phép nhận diện các danh từ riêng và thành ngữ thường dùng.</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-white/10 rounded text-xs font-bold tracking-wider">COMPOUND WORDS</span>
                    <span className="px-3 py-1 bg-white/10 rounded text-xs font-bold tracking-wider">CUSTOM TOKENS</span>
                  </div>
                </div>
                <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* SHOWCASE SECTION */}
        <section className="py-24 lg:py-32 bg-surface">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-24 items-center">
            
            <motion.div 
              initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
            >
              <h2 className="text-2xl md:text-3xl font-black mb-8 text-on-surface tracking-tight">Trải nghiệm dịch <br/> <span className="text-primary italic">mượt mà như thật.</span></h2>
              <p className="text-on-surface-variant text-base mb-10 leading-relaxed font-medium">Khác với các công cụ dịch thuật tĩnh, Signify hiểu ngữ cảnh của video, xử lý phụ đề theo thời gian thực và biểu diễn các hoạt ảnh ngôn ngữ ký hiệu một cách tự nhiên nhất có thể.</p>
              
              <ul className="space-y-6">
                {[
                  'Đồng bộ hóa miligiây với tiến trình video',
                  'Thuật toán gộp từ thông minh (Compound parsing)',
                  'Hỗ trợ chế độ phát lại đoạn dịch (Replay)'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-5">
                    <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Check className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-on-surface font-bold text-lg">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-[3rem] blur-2xl -z-10 animate-pulse"></div>
              <div className="bg-white rounded-[2rem] p-4 shadow-2xl border border-outline-variant/30">
                <div className="bg-slate-900 rounded-[1.5rem] aspect-video flex flex-col justify-end p-6 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80')] opacity-40 mix-blend-overlay object-cover"></div>
                  
                  {/* Mock Video UI */}
                  <div className="relative z-10 w-full">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-16 mx-auto cursor-pointer hover:bg-white/30 transition-colors">
                      <Play className="w-8 h-8 text-white ml-1" />
                    </div>
                    
                    {/* Subtitle Box */}
                    <div className="bg-black/60 backdrop-blur-sm rounded-xl p-4 border border-white/10 text-center">
                      <p className="text-white text-lg font-medium tracking-wide">"Khám phá thế giới qua lăng kính mới..."</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </section>

        {/* BOLD CTA SECTION */}
        <section className="py-20 md:py-32 px-4 sm:px-6 bg-on-background text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/10 mix-blend-overlay"></div>
          <div className="max-w-[800px] mx-auto text-center relative z-10">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-2xl md:text-3xl font-black mb-8 tracking-tight text-white">Sẵn sàng để <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">kết nối?</span></h2>
              <p className="text-white/90 text-sm md:text-base mb-12 max-w-2xl mx-auto font-medium leading-relaxed">Tham gia cùng chúng tôi để tạo ra một không gian mạng bao trùm, nơi mọi video đều có thể được tiếp cận.</p>
              <div className="flex flex-col sm:flex-row justify-center gap-6">
                <Link to="/register" className="h-14 sm:h-16 px-8 sm:px-10 bg-primary rounded-2xl text-base sm:text-lg font-bold flex items-center justify-center hover:scale-105 transition-transform shadow-xl shadow-primary/30">
                  Đăng ký miễn phí
                </Link>
                <Link to="/translate" className="h-14 sm:h-16 px-8 sm:px-10 bg-white/10 rounded-2xl text-base sm:text-lg font-bold flex items-center justify-center hover:bg-white/20 transition-colors border border-white/10">
                  Thử nghiệm Demo
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default LandingPage;
