import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Zap, Shield, Globe, MessageSquare, Video, Cpu, Users } from 'lucide-react';

const ServicePackage: React.FC = () => {
  const [planType, setPlanType] = useState<'individual' | 'business'>('individual');

  const individualPackages = [
    {
      name: 'Gói 1 Tháng',
      price: '39.000',
      duration: 'tháng',
      description: 'Linh hoạt truy cập vào tất cả các tính năng cao cấp.',
      buttonText: 'Bắt đầu ngay',
      features: [
        { icon: <Cpu className="w-5 h-5" />, text: 'Dùng giới hạn 1 tiếng / ngày' },
        { icon: <Zap className="w-5 h-5" />, text: 'Công nghệ dịch AI cơ bản' },
        { icon: <Globe className="w-5 h-5" />, text: 'Tất cả các phương ngữ' },
        { icon: <Shield className="w-5 h-5" />, text: 'Không quảng cáo' },
      ],
    },
    {
      name: 'Gói 6 Tháng',
      price: '200.000',
      duration: '6 tháng',
      description: 'Tiết kiệm hơn với gói dịch vụ nửa năm.',
      buttonText: 'Chọn Gói 6 Tháng',
      isRecommended: true,
      badge: 'Giá Trị Nhất',
      features: [
        { icon: <Zap className="w-5 h-5" />, text: 'Thời gian sử dụng không giới hạn' },
        { icon: <Users className="w-5 h-5" />, text: 'Được tùy chỉnh nhân vật' },
        { icon: <MessageSquare className="w-5 h-5" />, text: 'Được chọn giọng nói AI' },
        { icon: <Cpu className="w-5 h-5" />, text: 'Dịch AI thời gian thực' },
        { icon: <Shield className="w-5 h-5" />, text: 'Không quảng cáo' },
      ],
    },
    {
      name: 'Gói 12 Tháng',
      price: '400.000',
      duration: 'năm',
      description: 'Gói cam kết dài hạn cho sự gắn kết tối đa.',
      buttonText: 'Gói Năm',
      badge: 'Phổ Biến Nhất',
      features: [
        { icon: <Zap className="w-5 h-5" />, text: 'Thời gian sử dụng không giới hạn' },
        { icon: <Users className="w-5 h-5" />, text: 'Được tùy chỉnh nhân vật' },
        { icon: <MessageSquare className="w-5 h-5" />, text: 'Được chọn giọng nói AI' },
        { icon: <Cpu className="w-5 h-5" />, text: 'Dịch AI thời gian thực' },
        { icon: <Shield className="w-5 h-5" />, text: 'Không quảng cáo' },
        { icon: <Globe className="w-5 h-5" />, text: 'Truy cập sớm các tính năng mới' },
      ],
    },
  ];

  const businessPackages = [
    {
      name: 'Doanh nghiệp Khởi nghiệp',
      price: '500.000',
      duration: 'tháng',
      description: 'Hoàn hảo cho các nhóm nhỏ và tổ chức mới bắt đầu.',
      buttonText: 'Bắt đầu dùng thử',
      features: [
        { icon: <Users className="w-5 h-5" />, text: 'Tối đa 5 thành viên' },
        { icon: <Cpu className="w-5 h-5" />, text: 'Dịch AI nâng cao' },
        { icon: <Shield className="w-5 h-5" />, text: 'Bảng điều khiển quản trị' },
        { icon: <Globe className="w-5 h-5" />, text: 'Thư viện ký hiệu tùy chỉnh' },
      ],
    },
    {
      name: 'Doanh nghiệp Pro',
      price: '1.199.000',
      duration: 'tháng',
      description: 'Mở rộng quy mô giao tiếp trong toàn công ty.',
      buttonText: 'Nâng cấp lên Pro',
      isRecommended: true,
      badge: 'Khuyên dùng',
      features: [
        { icon: <Users className="w-5 h-5" />, text: 'Tối đa 10 thành viên' },
        { icon: <Cpu className="w-5 h-5" />, text: 'AI cấp độ doanh nghiệp' },
        { icon: <Shield className="w-5 h-5" />, text: 'SSO & Bảo mật nâng cao' },
        { icon: <Globe className="w-5 h-5" />, text: 'Hỗ trợ đa vùng' },
        { icon: <Video className="w-5 h-5" />, text: 'Truy cập API tích hợp' },
      ],
    },
    {
      name: 'Doanh nghiệp Lớn',
      price: 'Liên hệ',
      duration: 'báo giá',
      description: 'Giải pháp tùy chỉnh cho tác động quy mô lớn.',
      buttonText: 'Liên hệ kinh doanh',
      features: [
        { icon: <Users className="w-5 h-5" />, text: 'Không giới hạn thành viên' },
        { icon: <Cpu className="w-5 h-5" />, text: 'Đào tạo AI riêng biệt' },
        { icon: <Shield className="w-5 h-5" />, text: 'Hỗ trợ Premium 24/7' },
        { icon: <Globe className="w-5 h-5" />, text: 'Tùy chọn triển khai riêng' },
        { icon: <MessageSquare className="w-5 h-5" />, text: 'Quản lý tài khoản riêng' },
      ],
    },
  ];

  const activePackages = planType === 'individual' ? individualPackages : businessPackages;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 font-sans selection:bg-[#4F46E5] selection:text-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-center mb-16">
          <div className="flex items-center gap-3">
            <img 
              src="/logo_removebg.png" 
              alt="Signify Logo" 
              className="h-16 w-auto object-contain"
              onError={(e) => {
                // Fallback if logo_removebg.png is not found
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement?.insertAdjacentHTML('beforeend', '<span class="text-2xl font-bold tracking-tight text-slate-900">SIGNIFY</span>');
              }}
            />
          </div>
        </div>

        <div className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-slate-900 mb-6"
          >
            Chọn gói của bạn
          </motion.h1>
          
          <div className="inline-flex bg-slate-200 p-1 rounded-full mb-12">
            <button
              onClick={() => setPlanType('individual')}
              className={`px-8 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                planType === 'individual' 
                  ? 'bg-white shadow-md text-[#2563EB]' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cá nhân
            </button>
            <button
              onClick={() => setPlanType('business')}
              className={`px-8 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                planType === 'business' 
                  ? 'bg-white shadow-md text-[#2563EB]' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Doanh nghiệp
            </button>
          </div>
          
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            {planType === 'individual' 
              ? 'Giải phóng tiềm năng dịch ngôn ngữ ký hiệu với AI cho mục đích cá nhân.' 
              : 'Trao quyền cho đội ngũ của bạn với các công cụ dịch thuật chuyên nghiệp.'}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {activePackages.map((pkg, idx) => (
            <motion.div
              key={pkg.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`relative bg-white rounded-[32px] p-10 border-2 transition-all duration-300 flex flex-col ${
                pkg.isRecommended 
                  ? 'border-[#4F46E5]/40 shadow-[0_32px_64px_-16px_rgba(79,70,229,0.15)] scale-105 z-10' 
                  : 'border-transparent shadow-[0_12px_24px_-8px_rgba(0,0,0,0.08)] hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.12)]'
              }`}
            >
              {pkg.badge && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-sm ${
                  pkg.isRecommended ? 'bg-[#4F46E5]' : 'bg-slate-800'
                }`}>
                  {pkg.badge}
                </div>
              )}

              <div className="mb-8">
                <h2 className="text-2xl font-black tracking-tight text-slate-900 mb-6">{pkg.name}</h2>
                <div className="flex items-baseline gap-1.5 mb-2">
                  <span className="text-2xl font-bold text-slate-400">₫</span>
                  <span className="text-5xl font-black text-slate-900 tracking-tighter">
                    {pkg.price}
                  </span>
                  <span className="text-slate-400 text-sm font-semibold ml-1">/ {pkg.duration}</span>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed mt-4">{pkg.description}</p>
              </div>

              <div className="space-y-4 mb-8 flex-grow">
                {pkg.features.map((feature, fIdx) => (
                  <div key={fIdx} className="flex items-start gap-3 text-slate-600">
                    <div className={`mt-0.5 ${pkg.isRecommended ? 'text-[#4F46E5]' : 'text-slate-400'}`}>
                      {feature.icon}
                    </div>
                    <span className="text-sm font-medium">{feature.text}</span>
                  </div>
                ))}
              </div>

              <button
                className={`w-full py-4 rounded-2xl font-semibold transition-all duration-200 ${
                  pkg.isRecommended 
                    ? 'bg-[#4F46E5] hover:bg-[#7C3AED] text-white shadow-lg shadow-[#4F46E5]/20' 
                    : 'bg-slate-900 hover:bg-slate-800 text-white shadow-md'
                }`}
              >
                {pkg.buttonText}
              </button>
            </motion.div>
          ))}
        </div>

        <div className="mt-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-100 mb-8">
            <Check className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-medium text-slate-600">Cam kết hoàn tiền trong 30 ngày</span>
          </div>
          <p className="text-slate-400 text-sm">
            © 2026 Signify AI. Trao quyền giao tiếp thông qua công nghệ.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ServicePackage;
