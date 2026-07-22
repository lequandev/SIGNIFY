import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Building2, CheckCircle, User } from 'lucide-react';
import { useSelector } from 'react-redux';
import { getServicePackages, ServicePackage as ServicePackageType } from '../services/packageService';
import api from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';

const ServicePackage: React.FC = () => {
  const [planType, setPlanType] = useState<'individual' | 'education'>('individual');
  const [packages, setPackages] = useState<ServicePackageType[]>([]);
  const [activeSubscription, setActiveSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useSelector((state: any) => state.auth);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [location.pathname]);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const [packagesData, activeSubData] = await Promise.all([
          getServicePackages(),
          api.get('/v1/subscriptions/me').then(res => res.data).catch(() => null),
        ]);
        setPackages(packagesData);
        setActiveSubscription(activeSubData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, []);

  const handleSelectPlan = (pkg: ServicePackageType) => {
    if (activeSubscription?.packageId === pkg.id) return;
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/packages', plan: pkg } });
      return;
    }
    if (pkg.price === 'Liên hệ') {
      window.location.href = 'mailto:contact@signify.ai';
      return;
    }
    navigate('/payment', { state: { plan: pkg } });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  const fallbackPackages: Record<'individual' | 'education', ServicePackageType[]> = {
    individual: [
      {
        id: 'fallback-personal-30',
        planType: 'individual',
        name: 'Gói Cá nhân - 1 tháng',
        description: 'Truy cập đầy đủ Signify trong 1 tháng với thời gian sử dụng không giới hạn mỗi ngày.',
        price: '49,000',
        duration: 'tháng',
        durationDays: 30,
        buttonText: 'Chọn gói 1 tháng',
        isRecommended: false,
        badge: null,
        fullFeatures: true,
        features: [
          { icon: 'Zap', text: 'Sử dụng không giới hạn thời gian mỗi ngày' },
          { icon: 'Cpu', text: 'Truy cập đầy đủ các tính năng của Signify' },
          { icon: 'Sparkles', text: 'Nhận các cập nhật tính năng mới trong thời gian gói còn hiệu lực' },
        ],
      },
      {
        id: 'fallback-personal-180',
        planType: 'individual',
        name: 'Gói Cá nhân - 6 tháng',
        description: 'Tiết kiệm hơn khi sử dụng đầy đủ các tính năng Signify trong 6 tháng.',
        price: '250,000',
        duration: '6 tháng',
        durationDays: 180,
        buttonText: 'Chọn gói 6 tháng',
        isRecommended: true,
        badge: 'Tiết kiệm',
        fullFeatures: true,
        features: [
          { icon: 'Zap', text: 'Sử dụng không giới hạn thời gian mỗi ngày' },
          { icon: 'Cpu', text: 'Truy cập đầy đủ các tính năng của Signify' },
          { icon: 'Sparkles', text: 'Nhận các cập nhật tính năng mới trong thời gian gói còn hiệu lực' },
        ],
      },
      {
        id: 'fallback-personal-365',
        planType: 'individual',
        name: 'Gói Cá nhân - 12 tháng',
        description: 'Gói cá nhân tốt nhất cho người dùng muốn sử dụng Signify lâu dài.',
        price: '489,000',
        duration: '12 tháng',
        durationDays: 365,
        buttonText: 'Chọn gói 12 tháng',
        isRecommended: false,
        badge: 'Tốt nhất',
        fullFeatures: true,
        features: [
          { icon: 'Zap', text: 'Sử dụng không giới hạn thời gian mỗi ngày' },
          { icon: 'Cpu', text: 'Truy cập đầy đủ các tính năng của Signify' },
          { icon: 'Sparkles', text: 'Nhận các cập nhật tính năng mới trong thời gian gói còn hiệu lực' },
        ],
      },
    ],
    education: [
      {
        id: 'fallback-education-30',
        planType: 'education',
        name: 'Gói Giáo dục - 1 tháng',
        description: 'Quản lý giáo viên, học sinh và lớp học trong một trường.',
        price: '500,000',
        duration: 'tháng',
        durationDays: 30,
        buttonText: 'Chọn Giáo dục 1 tháng',
        isRecommended: false,
        badge: null,
        maxAccounts: 20,
        fullFeatures: true,
        features: [
          { icon: 'Users', text: 'Tối đa 50 tài khoản giáo viên và học sinh' },
          { icon: 'Shield', text: '01 tài khoản School Admin quản lý toàn trường' },
          { icon: 'UserCog', text: 'Admin có thể thêm, xóa, kích hoạt hoặc vô hiệu hóa tài khoản thành viên' },
        ],
      },
      {
        id: 'fallback-education-180',
        planType: 'education',
        name: 'Gói Giáo dục - 6 tháng',
        description: 'Giải pháp giáo dục 6 tháng cho trường học quản lý lớp và bài học tập trung.',
        price: '2,799,000',
        duration: '6 tháng',
        durationDays: 180,
        buttonText: 'Chọn Giáo dục 6 tháng',
        isRecommended: true,
        badge: 'Trường học chọn',
        maxAccounts: 20,
        fullFeatures: true,
        features: [
          { icon: 'Users', text: 'Tối đa 50 tài khoản giáo viên và học sinh' },
          { icon: 'Shield', text: '01 tài khoản School Admin quản lý toàn trường' },
          { icon: 'UserCog', text: 'Admin có thể thêm, xóa, kích hoạt hoặc vô hiệu hóa tài khoản thành viên' },
        ],
      },
      {
        id: 'fallback-education-365',
        planType: 'education',
        name: 'Gói Giáo dục - 12 tháng',
        description: 'Giải pháp dài hạn cho trường học với lớp, bài tập và tiến độ học tập.',
        price: '5,500,000',
        duration: '12 tháng',
        durationDays: 365,
        buttonText: 'Chọn Giáo dục 12 tháng',
        isRecommended: false,
        badge: 'Dài hạn',
        maxAccounts: 20,
        fullFeatures: true,
        features: [
          { icon: 'Users', text: 'Tối đa 50 tài khoản giáo viên và học sinh' },
          { icon: 'Shield', text: '01 tài khoản School Admin quản lý toàn trường' },
          { icon: 'UserCog', text: 'Admin có thể thêm, xóa, kích hoạt hoặc vô hiệu hóa tài khoản thành viên' },
        ],
      },
    ],
  };

  const allowedDurations = [30, 180, 365];
  const visiblePackages = allowedDurations.map((durationDays) => {
    const matched = packages.find(pkg =>
      pkg.planType === planType &&
      pkg.durationDays === durationDays &&
      pkg.name?.toLowerCase().includes(planType === 'individual' ? 'cá nhân' : 'giáo dục')
    ) || packages.find(pkg =>
      pkg.planType === planType &&
      pkg.durationDays === durationDays
    );

    const fallback = fallbackPackages[planType].find(pkg => pkg.durationDays === durationDays)!;
    return matched ? { ...fallback, ...matched, features: Array.isArray(matched.features) ? matched.features : fallback.features } : fallback;
  });

  const planTitle = planType === 'individual' ? 'Gói Cá nhân' : 'Gói Giáo dục';
  const planDescription = planType === 'individual'
    ? 'Lựa chọn phù hợp cho người dùng cá nhân muốn sử dụng đầy đủ Signify theo từng chu kỳ.'
    : 'Giải pháp cho trường học quản lý giáo viên, học sinh, lớp và video bài học.';

  return (
    <div className="bg-background text-on-surface font-sans min-h-screen flex flex-col selection:bg-primary/20 selection:text-primary">
      <Header />
      <main className="pt-28 flex-grow">
        {/* Pricing Header Section */}
        <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-block px-4 py-1.5 bg-gradient-to-r from-primary to-secondary text-white rounded-full text-xs font-bold tracking-wider mb-5 shadow-lg shadow-primary/30">
              BẢNG GIÁ DỊCH VỤ
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold mb-4 tracking-tight text-on-surface">Chọn gói dịch vụ hoàn hảo cho bạn</h1>
            <p className="text-on-surface-variant text-sm md:text-base max-w-2xl mx-auto mb-8 font-medium leading-relaxed">
              {planDescription}
            </p>

            {/* Plan Type Toggle */}
            <div className="flex items-center justify-center gap-3 mb-10">
              <button
                onClick={() => setPlanType('individual')}
                className={`inline-flex items-center gap-2 px-4 sm:px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${planType === 'individual' ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/30' : 'bg-surface-container-lowest border border-outline-variant/60 text-on-surface-variant hover:text-primary hover:border-primary/40 hover:-translate-y-0.5'}`}
              >
                <User className="w-4 h-4" />
                Gói Cá nhân
              </button>
              <button
                onClick={() => setPlanType('education')}
                className={`inline-flex items-center gap-2 px-4 sm:px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${planType === 'education' ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/30' : 'bg-surface-container-lowest border border-outline-variant/60 text-on-surface-variant hover:text-primary hover:border-primary/40 hover:-translate-y-0.5'}`}
              >
                <Building2 className="w-4 h-4" />
                Giáo dục
              </button>
            </div>
          </motion.div>
        </section>

        {/* Pricing Cards Section */}
        <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pb-20">
          <div className="text-center mb-8">
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-on-surface">{planTitle}</h2>
            <p className="text-sm text-on-surface-variant font-medium mt-2">
              {planType === 'individual'
                ? 'Chọn chu kỳ thanh toán phù hợp với nhu cầu cá nhân.'
                : 'Chọn chu kỳ thanh toán phù hợp với quy mô trường học.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-primary-container/10 blur-[80px] rounded-full pointer-events-none -z-10" />

            {visiblePackages.map((pkg: any, idx: number) => {
              const isActive = activeSubscription?.packageId === pkg.id;
              const isRecommended = pkg.isRecommended || idx === 1;

              return (
                <motion.div
                  key={`${planType}-${pkg.durationDays || idx}-${pkg.id}`}
                  initial={{ opacity: 0, y: 24, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.35, delay: idx * 0.06 }}
                  className={`${isRecommended ? 'bg-on-background text-surface-bright border-2 border-primary shadow-[0_15px_40px_rgba(37,99,235,0.25)] md:-translate-y-2' : 'bg-surface-container-lowest border border-outline-variant/60 text-on-surface shadow-md'} p-8 rounded-[24px] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col`}
                >
                  {isRecommended && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4, duration: 0.4 }}
                      className="absolute top-5 right-[-35px] bg-primary text-on-primary text-[0.6rem] py-1 px-10 rotate-45 font-bold shadow-md tracking-widest uppercase"
                    >
                      Phổ biến
                    </motion.div>
                  )}

                  <div className="mb-5">
                    <h3 className="text-xl font-bold mb-1 tracking-tight">{pkg.name}</h3>
                    <p className={`text-sm font-medium ${isRecommended ? 'text-outline-variant' : 'text-on-surface-variant'}`}>{pkg.description || 'Giải pháp tốt nhất cho bạn.'}</p>
                  </div>

                  <div className="mb-6 flex items-baseline">
                    <span className="text-3xl font-black tracking-tight">{pkg.price === '0' || pkg.price === 'Liên hệ' ? pkg.price : `${pkg.price}₫`}</span>
                    {pkg.price !== 'Liên hệ' && pkg.price !== 'Custom' && <span className={`text-sm ml-1 font-medium ${isRecommended ? 'text-outline-variant' : 'text-on-surface-variant'}`}>/{pkg.duration || 'tháng'}</span>}
                  </div>

                  <ul className="space-y-4 mb-8 flex-grow">
                    {pkg.features?.map((f: any, i: number) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 + (i * 0.1), duration: 0.4 }}
                        className="flex items-center gap-2"
                      >
                        <CheckCircle className={`w-4 h-4 shrink-0 ${isRecommended ? 'text-primary-fixed' : 'text-primary'}`} />
                        <span className="text-sm font-medium">{f.text}</span>
                      </motion.li>
                    ))}
                  </ul>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectPlan(pkg)}
                    disabled={isActive}
                    className={`w-full py-3 px-5 rounded-xl text-sm font-bold transition-all duration-200 ${isActive ? 'bg-green-500/10 text-green-600 border border-green-500/20' : isRecommended ? 'bg-primary text-on-primary hover:bg-primary-container hover:shadow-lg hover:-translate-y-0.5 active:scale-95' : 'border border-outline-variant/60 text-on-surface hover:bg-surface-container-low hover:-translate-y-0.5 active:scale-95'}`}
                  >
                    {isActive ? 'Đang sử dụng' : (pkg.buttonText || 'Chọn gói này')}
                  </motion.button>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Comparison Table Section */}
        <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 mb-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-extrabold mb-4 tracking-tight">So sánh tính năng</h2>
            <p className="text-on-surface-variant text-base font-medium">Khám phá chi tiết quyền lợi giữa gói Cá nhân và gói Giáo dục.</p>
          </div>
          <div className="overflow-hidden rounded-[24px] border border-outline-variant/60 bg-surface-container-lowest shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="bg-surface-container">
                  <tr>
                    <th className="p-5 text-xs font-bold text-on-surface tracking-wider uppercase">Tính năng</th>
                    <th className="p-5 text-xs font-bold text-primary tracking-wider uppercase text-center bg-primary/5 w-1/3">Gói Cá nhân</th>
                    <th className="p-5 text-xs font-bold text-on-surface tracking-wider uppercase text-center w-1/3">Giáo dục</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/40">
                  <tr className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="p-5 text-sm font-medium">Thời gian sử dụng mỗi ngày</td>
                    <td className="p-5 text-sm font-bold text-center bg-primary/5 text-primary">Không giới hạn</td>
                    <td className="p-5 text-sm font-semibold text-center text-on-surface-variant">Không giới hạn</td>
                  </tr>
                  <tr className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="p-5 text-sm font-medium">Truy cập tính năng Signify</td>
                    <td className="p-5 text-sm font-bold text-center bg-primary/5 text-primary">Đầy đủ</td>
                    <td className="p-5 text-sm font-semibold text-center text-on-surface-variant">Đầy đủ cho toàn bộ thành viên</td>
                  </tr>
                  <tr className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="p-5 text-sm font-medium">Số tài khoản</td>
                    <td className="p-5 text-sm font-bold text-center bg-primary/5 text-primary">01 tài khoản</td>
                    <td className="p-5 text-sm font-semibold text-center text-on-surface-variant">Tối đa 20 tài khoản</td>
                  </tr>
                  <tr className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="p-5 text-sm font-medium">Quản lý thành viên</td>
                    <td className="p-5 text-sm font-bold text-center bg-primary/5 text-primary">Không</td>
                    <td className="p-5 text-sm font-semibold text-center text-on-surface-variant">Có School Admin</td>
                  </tr>
                  <tr className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="p-5 text-sm font-medium">Cập nhật tính năng mới</td>
                    <td className="p-5 text-sm font-bold text-center bg-primary/5 text-primary">Có</td>
                    <td className="p-5 text-sm font-semibold text-center text-on-surface-variant">Có</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 mb-20">
          <div className="relative rounded-[32px] overflow-hidden bg-primary p-10 md:p-14 text-center shadow-2xl">
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent" />
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-extrabold text-on-primary mb-4 tracking-tight leading-tight">Sẵn sàng để nâng tầm <br className="hidden md:block" />trải nghiệm của bạn?</h2>
              <p className="text-base text-on-primary/90 mb-8 font-medium">
                Chọn gói phù hợp để mở khóa trải nghiệm dịch thuật ngôn ngữ ký hiệu mượt mà hơn.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button onClick={() => setPlanType('individual')} className="bg-surface-bright text-primary text-sm font-bold px-8 py-3.5 rounded-xl shadow-xl hover:bg-surface-container-highest transition-all hover:-translate-y-0.5 active:scale-95">Xem gói Cá nhân</button>
                <button onClick={() => setPlanType('education')} className="border border-on-primary/30 text-on-primary text-sm font-bold px-8 py-3.5 rounded-xl hover:bg-on-primary/10 transition-all hover:-translate-y-0.5 active:scale-95">Xem gói Giáo dục</button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ServicePackage;
