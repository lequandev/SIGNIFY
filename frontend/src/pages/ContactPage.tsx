import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useLocation } from 'react-router-dom';
import { Mail, Phone, MapPin, Send, MessageSquare, Clock } from 'lucide-react';
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

const ContactPage = () => {
  const location = useLocation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [location.pathname]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setFormData({ name: '', email: '', subject: '', message: '' });
      alert('Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất.');
    }, 1500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="bg-surface text-on-surface font-sans selection:bg-primary/20 selection:text-primary overflow-hidden">
      <Header />
      
      <main>
        {/* HERO SECTION */}
        <section className="relative w-full min-h-[50vh] md:min-h-[60vh] flex items-center pt-24 md:pt-28 pb-16 overflow-hidden">
          {/* Abstract Glows */}
          <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] md:w-[600px] md:h-[600px] bg-primary/20 rounded-full blur-[70px] md:blur-[120px] mix-blend-multiply opacity-70 animate-[pulse_6s_ease-in-out_infinite]" />
          <div className="absolute bottom-1/4 right-1/4 translate-x-1/4 translate-y-1/4 w-[260px] h-[260px] md:w-[500px] md:h-[500px] bg-secondary/15 rounded-full blur-[60px] md:blur-[100px] mix-blend-multiply opacity-60" />
          
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 w-full relative z-10">
            <motion.div 
              className="text-center"
              initial="hidden" animate="visible" variants={staggerContainer}
            >
              <motion.div variants={fadeUpVariant} className="inline-block px-4 py-2 rounded-full bg-primary-container text-on-primary-container text-xs font-bold tracking-wider mb-6">
                LIÊN HỆ
              </motion.div>
              <motion.h1 variants={fadeUpVariant} className="text-3xl md:text-4xl lg:text-5xl leading-[1.1] font-black tracking-tight text-on-surface mb-6">
                Kết nối với <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-tertiary">chúng tôi</span>
              </motion.h1>
              <motion.p variants={fadeUpVariant} className="text-base md:text-lg text-on-surface-variant font-medium leading-relaxed max-w-3xl mx-auto mb-8">
                Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn. Hãy liên hệ với chúng tôi để được tư vấn và giải đáp mọi thắc mắc.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* CONTACT INFO SECTION */}
        <section className="py-16 md:py-24 bg-surface-container-lowest">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
            >
              {[
                { icon: Mail, title: 'Email', value: 'contact@signify.ai', desc: 'Phản hồi trong 24h' },
                { icon: Phone, title: 'Điện thoại', value: '+84 123 456 789', desc: 'Thứ 2 - Thứ 6' },
                { icon: MapPin, title: 'Địa chỉ', value: 'Hà Nội, Việt Nam', desc: 'Văn phòng chính' }
              ].map((item, i) => (
                <motion.div key={i} variants={itemVariant} className="bg-surface-container-low border border-outline-variant/30 rounded-[2rem] p-6 md:p-8 hover:shadow-xl transition-all duration-300 group text-center">
                  <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <item.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-on-surface">{item.title}</h3>
                  <p className="text-base font-semibold text-primary mb-1">{item.value}</p>
                  <p className="text-sm text-on-surface-variant font-medium">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* CONTACT FORM */}
            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
              className="max-w-3xl mx-auto"
            >
              <motion.div variants={fadeUpVariant} className="bg-surface-container-low border border-outline-variant/30 rounded-[2rem] p-6 md:p-8 md:p-12">
                <h2 className="text-xl md:text-2xl font-black mb-6 tracking-tight text-center">Gửi tin nhắn cho chúng tôi</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-on-surface mb-2">Họ và tên</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Nguyễn Văn A"
                        required
                        className="w-full bg-white border border-outline-variant/60 rounded-xl px-4 py-3 text-base text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-on-surface mb-2">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="email@example.com"
                        required
                        className="w-full bg-white border border-outline-variant/60 rounded-xl px-4 py-3 text-base text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-on-surface mb-2">Chủ đề</label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full bg-white border border-outline-variant/60 rounded-xl px-4 py-3 text-base text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    >
                      <option value="">Chọn chủ đề</option>
                      <option value="support">Hỗ trợ kỹ thuật</option>
                      <option value="sales">Tư vấn dịch vụ</option>
                      <option value="partnership">Hợp tác kinh doanh</option>
                      <option value="feedback">Góp ý</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-on-surface mb-2">Nội dung</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Nhập nội dung tin nhắn của bạn..."
                      required
                      rows={6}
                      className="w-full bg-white border border-outline-variant/60 rounded-xl px-4 py-3 text-base text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-primary text-white text-base font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/30 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Đang gửi...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Gửi tin nhắn
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section className="py-16 md:py-24 bg-surface">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
              className="text-center mb-16"
            >
              <motion.h2 variants={fadeUpVariant} className="text-2xl md:text-3xl font-black mb-6 tracking-tight">
                Câu hỏi thường gặp
              </motion.h2>
              <motion.p variants={fadeUpVariant} className="text-base text-on-surface-variant font-medium max-w-2xl mx-auto">
                Tìm câu trả lời cho các thắc mắc phổ biến về dịch vụ của chúng tôi.
              </motion.p>
            </motion.div>

            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto"
            >
              {[
                { q: 'Signify là gì?', a: 'Signify là nền tảng dịch thuật video sang ngôn ngữ ký hiệu Việt Nam, giúp người khiếm thính tiếp cận thông tin dễ dàng hơn.' },
                { q: 'Làm sao để sử dụng?', a: 'Bạn có thể cài đặt extension Chrome của chúng tôi hoặc sử dụng trang web để dịch thuật video YouTube.' },
                { q: 'Có phí không?', a: 'Chúng tôi có gói miễn phí và các gói trả phí với nhiều tính năng nâng cao. Xem bảng giá để biết chi tiết.' },
                { q: 'Hỗ trợ ngôn ngữ nào?', a: 'Hiện tại chúng tôi hỗ trợ tiếng Việt và đang phát triển thêm nhiều ngôn ngữ khác.' }
              ].map((faq, i) => (
                <motion.div key={i} variants={itemVariant} className="bg-surface-container-low border border-outline-variant/30 rounded-[1.5rem] p-6 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold mb-2 text-on-surface">{faq.q}</h3>
                      <p className="text-base text-on-surface-variant font-medium">{faq.a}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* WORKING HOURS SECTION */}
        <section className="py-16 md:py-24 bg-surface-container-lowest">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
              className="bg-gradient-to-r from-primary to-secondary rounded-[2rem] p-6 md:p-8 md:p-12 text-white text-center"
            >
              <motion.div variants={fadeUpVariant} className="flex flex-col md:flex-row items-center justify-center gap-8">
                <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Clock className="w-10 h-10" />
                </div>
                <div className="text-center md:text-left">
                  <h3 className="text-xl md:text-2xl font-black mb-2">Giờ làm việc</h3>
                  <p className="text-base font-medium opacity-90">Thứ 2 - Thứ 6: 8:00 - 18:00</p>
                  <p className="text-base font-medium opacity-90">Thứ 7: 9:00 - 12:00</p>
                  <p className="text-base font-medium opacity-75 mt-1">Chủ nhật: Nghỉ</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="py-20 md:py-32 px-4 sm:px-6 bg-on-background text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/10 mix-blend-overlay"></div>
          <div className="max-w-[800px] mx-auto text-center relative z-10">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-2xl md:text-3xl font-black mb-8 tracking-tight">Sẵn sàng bắt đầu?</h2>
              <p className="text-white/90 text-sm md:text-base mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
                Đăng ký ngay để trải nghiệm dịch vụ dịch thuật video sang ngôn ngữ ký hiệu tốt nhất.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-6">
                <a href="/register" className="h-14 px-8 bg-primary rounded-2xl text-base font-bold flex items-center justify-center hover:scale-105 transition-transform shadow-xl shadow-primary/30">
                  Đăng ký miễn phí
                </a>
                <a href="/packages" className="h-14 px-8 bg-white/10 rounded-2xl text-base font-bold flex items-center justify-center hover:bg-white/20 transition-colors border border-white/10">
                  Xem gói dịch vụ
                </a>
              </div>
            </motion.div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
};

export default ContactPage;
