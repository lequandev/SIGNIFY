import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, Users, Target, Award, Globe, Zap } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const fadeUpVariant = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1,
    y: 0,
    transition: { duration: 0.8 }
  }
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

const AboutPage = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [location.pathname]);

  return (
    <div className="bg-surface text-on-surface font-sans selection:bg-primary/20 selection:text-primary overflow-hidden">
      <Header />
      
      <main>
        {/* HERO SECTION */}
        <section className="relative w-full min-h-[60vh] md:min-h-[80vh] flex items-center pt-24 md:pt-28 pb-16 overflow-hidden">
          {/* Abstract Glows */}
          <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] md:w-[600px] md:h-[600px] bg-primary/20 rounded-full blur-[70px] md:blur-[120px] mix-blend-multiply opacity-70 animate-[pulse_6s_ease-in-out_infinite]" />
          <div className="absolute bottom-1/4 right-1/4 translate-x-1/4 translate-y-1/4 w-[260px] h-[260px] md:w-[500px] md:h-[500px] bg-secondary/15 rounded-full blur-[60px] md:blur-[100px] mix-blend-multiply opacity-60" />
          
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 w-full relative z-10">
            <motion.div 
              className="text-center"
              initial="hidden" animate="visible" variants={staggerContainer}
            >
              <motion.div variants={fadeUpVariant} className="inline-block px-4 py-2 rounded-full bg-primary-container text-on-primary-container text-xs font-bold tracking-wider mb-6">
                VỀ CHÚNG TÔI
              </motion.div>
              <motion.h1 variants={fadeUpVariant} className="text-3xl md:text-4xl lg:text-5xl leading-[1.1] font-black tracking-tight text-on-surface mb-6">
                Kết nối <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-tertiary">ngôn ngữ</span>, <br />
                lan tỏa <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-tertiary">tri thức</span>
              </motion.h1>
              <motion.p variants={fadeUpVariant} className="text-base md:text-lg text-on-surface-variant font-medium leading-relaxed max-w-3xl mx-auto mb-8">
                Signify được xây dựng với sứ mệnh xóa bỏ rào cản thông tin cho người khiếm thính, mang lại sự bình đẳng trong việc tiếp cận tri thức thông qua công nghệ Ngôn ngữ Ký hiệu Việt Nam.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* MISSION SECTION */}
        <section className="py-16 md:py-24 relative bg-surface-container-lowest">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
              className="text-center mb-16"
            >
              <motion.h2 variants={fadeUpVariant} className="text-3xl md:text-4xl font-black mb-6 tracking-tight">
                Sứ mệnh của chúng tôi
              </motion.h2>
              <motion.p variants={fadeUpVariant} className="text-lg text-on-surface-variant font-medium max-w-2xl mx-auto">
                Sử dụng công nghệ để tạo ra một thế giới nơi mọi người đều có thể tiếp cận thông tin một cách bình đẳng.
              </motion.p>
            </motion.div>

            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {[
                { icon: Heart, title: 'Đam mê', desc: 'Chúng tôi đam mê tạo ra sự thay đổi tích cực cho cộng đồng người khiếm thính.' },
                { icon: Users, title: 'Cộng đồng', desc: 'Xây dựng một cộng đồng hỗ trợ lẫn nhau và cùng phát triển.' },
                { icon: Target, title: 'Mục tiêu', desc: 'Mục tiêu của chúng tôi là xóa bỏ mọi rào cản trong việc tiếp cận thông tin.' }
              ].map((item, i) => (
                <motion.div key={i} variants={itemVariant} className="bg-surface-container-low border border-outline-variant/30 rounded-[2rem] p-6 md:p-8 hover:shadow-xl transition-all duration-300 group">
                  <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <item.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-on-surface">{item.title}</h3>
                  <p className="text-on-surface-variant text-base font-medium">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* VALUES SECTION */}
        <section className="py-16 md:py-24 bg-surface">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
              className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center"
            >
              <motion.div variants={fadeUpVariant}>
                <h2 className="text-2xl md:text-3xl font-black mb-6 tracking-tight">
                  Giá trị cốt lõi
                </h2>
                <p className="text-base text-on-surface-variant font-medium mb-8 leading-relaxed">
                  Chúng tôi tin rằng công nghệ nên phục vụ con người, tạo ra sự bình đẳng và cơ hội cho mọi người.
                </p>
                <div className="space-y-6">
                  {[
                    'Bình đẳng trong việc tiếp cận thông tin',
                    'Sáng tạo và đổi mới không ngừng',
                    'Tôn trọng và thấu hiểu người dùng',
                    'Minh bạch và trách nhiệm'
                  ].map((value, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + (i * 0.1), duration: 0.5 }}
                      className="flex items-center gap-4"
                    >
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      <span className="text-base font-medium text-on-surface">{value}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div 
                variants={itemVariant}
                className="relative"
              >
                <div className="absolute -inset-4 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-[3rem] blur-2xl -z-10 animate-pulse"></div>
                <div className="bg-surface-container-low rounded-[2rem] p-6 md:p-8 border border-outline-variant/30">
                  <div className="grid grid-cols-2 gap-6">
                    {[
                      { icon: Globe, label: '10K+', desc: 'Người dùng' },
                      { icon: Award, label: '98%', desc: 'Độ hài lòng' },
                      { icon: Zap, label: '24/7', desc: 'Hỗ trợ' },
                      { icon: Users, label: '50+', desc: 'Đối tác' }
                    ].map((stat, i) => (
                      <div key={i} className="text-center p-4">
                        <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mx-auto mb-3">
                          <stat.icon className="w-6 h-6" />
                        </div>
                        <div className="text-xl font-black text-on-surface mb-1">{stat.label}</div>
                        <div className="text-sm text-on-surface-variant font-medium">{stat.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* TEAM SECTION */}
        <section className="py-16 md:py-24 bg-surface-container-lowest">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
              className="text-center mb-16"
            >
              <motion.h2 variants={fadeUpVariant} className="text-2xl md:text-3xl font-black mb-6 tracking-tight">
                Đội ngũ của chúng tôi
              </motion.h2>
              <motion.p variants={fadeUpVariant} className="text-base text-on-surface-variant font-medium max-w-2xl mx-auto">
                Một đội ngũ đam mê, giàu kinh nghiệm và luôn nỗ lực để tạo ra sản phẩm tốt nhất.
              </motion.p>
            </motion.div>

            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8"
            >
              {[
                { name: 'Nguyễn Văn A', role: 'CEO & Founder', desc: '10 năm kinh nghiệm trong lĩnh vực công nghệ' },
                { name: 'Trần Thị B', role: 'CTO', desc: 'Chuyên gia AI và Machine Learning' },
                { name: 'Lê Văn C', role: 'Lead Developer', desc: '5 năm kinh nghiệm phát triển sản phẩm' },
                { name: 'Phạm Thị D', role: 'UX Designer', desc: 'Chuyên gia thiết kế trải nghiệm người dùng' }
              ].map((member, i) => (
                <motion.div key={i} variants={itemVariant} className="bg-surface-container-low border border-outline-variant/30 rounded-[2rem] p-6 hover:shadow-xl transition-all duration-300 group text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-black">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <h3 className="text-base font-bold mb-1 text-on-surface">{member.name}</h3>
                  <p className="text-sm font-bold text-primary mb-2">{member.role}</p>
                  <p className="text-sm text-on-surface-variant font-medium">{member.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="py-20 md:py-32 px-4 sm:px-6 bg-on-background text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/10 mix-blend-overlay"></div>
          <div className="max-w-[800px] mx-auto text-center relative z-10">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-2xl md:text-3xl font-black mb-8 tracking-tight">Tham gia cùng chúng tôi</h2>
              <p className="text-white/90 text-sm md:text-base mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
                Hãy cùng nhau tạo ra sự thay đổi tích cực cho cộng đồng người khiếm thính.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-6">
                <Link to="/contact" className="h-14 px-8 bg-primary rounded-2xl text-base font-bold flex items-center justify-center hover:scale-105 transition-transform shadow-xl shadow-primary/30">
                  Liên hệ ngay
                </Link>
                <Link to="/packages" className="h-14 px-8 bg-white/10 rounded-2xl text-base font-bold flex items-center justify-center hover:bg-white/20 transition-colors border border-white/10">
                  Xem gói dịch vụ
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
};

export default AboutPage;
