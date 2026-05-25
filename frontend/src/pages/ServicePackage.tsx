import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Check, Zap, Shield, Globe, MessageSquare, Video, Cpu, Users } from 'lucide-react';
import { useSelector } from 'react-redux';
import { getServicePackages, ServicePackage as ServicePackageType } from '../services/packageService';
import api from '../services/api';

const iconMap: { [key: string]: React.ReactNode } = {
  Cpu: <Cpu className="w-5 h-5" />,
  Zap: <Zap className="w-5 h-5" />,
  Globe: <Globe className="w-5 h-5" />,
  Shield: <Shield className="w-5 h-5" />,
  MessageSquare: <MessageSquare className="w-5 h-5" />,
  Users: <Users className="w-5 h-5" />,
  Video: <Video className="w-5 h-5" />,
};

const ServicePackage: React.FC = () => {
  const [planType, setPlanType] = useState<'individual' | 'business'>('individual');
  const [packages, setPackages] = useState<ServicePackageType[]>([]);
  const [activeSubscription, setActiveSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state: any) => state.auth);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const [packagesData, activeSubData] = await Promise.all([
          getServicePackages(),
          api.get('/v1/subscriptions/me').then(res => res.data).catch(() => null)
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

  const activePackages = packages.filter(pkg => pkg.planType === planType);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2563EB]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#2563EB] rounded-xl flex items-center justify-center shadow-lg shadow-[#2563EB]/20">
              <Users className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900 uppercase">SIGNIFY</span>
          </Link>
          <Link to="/" className="text-sm font-bold text-slate-500 hover:text-[#2563EB] transition-colors">
            Back to Home
          </Link>
        </div>

        <div className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-slate-900 mb-6"
          >
            Choose your plan
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
              Individual
            </button>
            <button
              onClick={() => setPlanType('business')}
              className={`px-8 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                planType === 'business' 
                  ? 'bg-white shadow-md text-[#2563EB]' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Business
            </button>
          </div>
          
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            {planType === 'individual' 
              ? 'Unlock the full potential of AI-powered sign language translation for personal use.' 
              : 'Empower your team with professional-grade translation and collaboration tools.'}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {activePackages.map((pkg, idx) => (
            <motion.div
              key={pkg.id || pkg.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`relative bg-white rounded-3xl p-8 border-2 transition-all duration-300 flex flex-col ${
                activeSubscription?.packageId === pkg.id
                  ? 'border-emerald-500 shadow-xl'
                  : pkg.isRecommended 
                    ? 'border-[#4F46E5] shadow-2xl scale-105 z-10' 
                    : 'border-transparent shadow-md hover:shadow-lg'
              }`}
            >
              {(pkg.badge || activeSubscription?.packageId === pkg.id) && (
                <div className={`absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-white shadow-sm ${
                  activeSubscription?.packageId === pkg.id ? 'bg-emerald-500' :
                  pkg.isRecommended ? 'bg-[#4F46E5]' : 'bg-slate-800'
                }`}>
                  {activeSubscription?.packageId === pkg.id ? 'Current Active' : pkg.badge}
                </div>
              )}

              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">{pkg.name}</h2>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-xl font-medium text-slate-500">₫</span>
                  <span className="text-4xl font-bold text-slate-900">{pkg.price}</span>
                  <span className="text-slate-500 text-sm ml-1">/ {pkg.duration}</span>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed">{pkg.description}</p>
              </div>

              <div className="space-y-4 mb-8 flex-grow">
                {pkg.features.map((feature, fIdx) => (
                  <div key={fIdx} className="flex items-start gap-3 text-slate-600">
                    <div className={`mt-0.5 ${activeSubscription?.packageId === pkg.id ? 'text-emerald-500' : pkg.isRecommended ? 'text-[#4F46E5]' : 'text-slate-400'}`}>
                      {iconMap[feature.icon] || <Check className="w-5 h-5" />}
                    </div>
                    <span className="text-sm font-medium">{feature.text}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleSelectPlan(pkg)}
                disabled={activeSubscription?.packageId === pkg.id}
                className={`w-full py-4 rounded-2xl font-semibold transition-all duration-200 ${
                  activeSubscription?.packageId === pkg.id
                    ? 'bg-emerald-50 text-emerald-600 border-2 border-emerald-100 cursor-default'
                    : pkg.isRecommended 
                      ? 'bg-[#4F46E5] hover:bg-[#7C3AED] text-white shadow-lg shadow-[#4F46E5]/20' 
                      : 'bg-slate-900 hover:bg-slate-800 text-white shadow-md'
                }`}
              >
                {activeSubscription?.packageId === pkg.id ? 'Current Active' : pkg.buttonText}
              </button>
            </motion.div>
          ))}
        </div>

        <div className="mt-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-100 mb-8">
            <Check className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-medium text-slate-600">30-day money-back guarantee</span>
          </div>
          <p className="text-slate-400 text-sm">
            © 2026 Signify AI. Empowering communication through technology.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ServicePackage;
