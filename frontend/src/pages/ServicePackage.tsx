import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Check, Zap, Shield, Globe, MessageSquare, Video, Cpu, Users, Star, ArrowRight, Sparkles } from 'lucide-react';
import { useSelector } from 'react-redux';
import { getServicePackages, ServicePackage as ServicePackageType } from '../services/packageService';
import api from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';

// ─── Design tokens (mirrors LandingPage) ─────────────────────────────────────

const PricingStyles: React.FC = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&family=Poppins:wght@400;500;600;700;800&display=swap');

    .pkg-root {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: linear-gradient(155deg, #f0f9ff 0%, #eff6ff 40%, #f0f9ff 100%);
      font-family: 'Open Sans', system-ui, sans-serif;
      position: relative;
    }
    .pkg-orb {
      position: fixed;
      border-radius: 50%;
      pointer-events: none;
      filter: blur(90px);
      z-index: 0;
    }
    .pkg-orb-1 {
      top: -5%;
      left: -5%;
      width: 450px; height: 450px;
      background: radial-gradient(circle, rgba(37,99,235,0.10) 0%, transparent 70%);
    }
    .pkg-orb-2 {
      bottom: -5%;
      right: -5%;
      width: 400px; height: 400px;
      background: radial-gradient(circle, rgba(29,78,216,0.08) 0%, transparent 70%);
    }

    .pkg-body {
      position: relative;
      z-index: 1;
      flex: 1;
      padding: 5rem 1rem 6rem;
    }
    .pkg-container {
      max-width: 1180px;
      margin: 0 auto;
    }

    /* ── Hero header ── */
    .pkg-hero {
      text-align: center;
      margin-bottom: 3rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }
    .pkg-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 14px;
      border-radius: 9999px;
      background: linear-gradient(135deg, rgba(37,99,235,0.10), rgba(29,78,216,0.10));
      border: 1px solid rgba(37,99,235,0.20);
      color: #2563EB;
      font-family: 'Poppins', sans-serif;
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .pkg-hero-title {
      font-family: 'Poppins', sans-serif;
      font-size: clamp(2rem, 4.5vw, 3rem);
      font-weight: 800;
      color: #1e3a8a;
      line-height: 1.12;
      letter-spacing: -0.03em;
      margin: 0;
    }
    .pkg-gradient-text {
      background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 50%, #1e40af 100%);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .pkg-hero-desc {
      font-size: 1.0625rem;
      color: #1e40af;
      opacity: 0.8;
      line-height: 1.75;
      max-width: 560px;
      margin: 0;
    }

    /* ── Toggle ── */
    .pkg-toggle-wrap {
      display: inline-flex;
      background: rgba(255,255,255,0.75);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(37,99,235,0.14);
      padding: 4px;
      border-radius: 9999px;
      box-shadow: 0 4px 16px rgba(37,99,235,0.08);
    }
    .pkg-toggle-btn {
      padding: 0.5rem 1.75rem;
      border-radius: 9999px;
      font-family: 'Poppins', sans-serif;
      font-size: 0.8125rem;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: background 200ms ease, color 200ms ease, box-shadow 200ms ease;
    }
    .pkg-toggle-active {
      background: linear-gradient(135deg, #2563EB, #1D4ED8);
      color: white;
      box-shadow: 0 4px 16px rgba(37,99,235,0.3);
    }
    .pkg-toggle-inactive {
      background: transparent;
      color: #3b82f6;
    }
    .pkg-toggle-inactive:hover { background: rgba(37,99,235,0.06); }

    /* ── Cards grid ── */
    .pkg-grid {
      display: grid;
      gap: 1.5rem;
      grid-template-columns: 1fr;
      align-items: start;
    }
    @media (min-width: 768px) { .pkg-grid { grid-template-columns: repeat(3, 1fr); } }

    .pkg-card {
      position: relative;
      background: rgba(255,255,255,0.92);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(37,99,235,0.10);
      border-radius: 24px;
      padding: 2rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      box-shadow: 0 8px 32px rgba(37,99,235,0.08);
      transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease;
      cursor: pointer;
    }
    .pkg-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 20px 56px rgba(37,99,235,0.14);
      border-color: rgba(37,99,235,0.22);
    }
    .pkg-card-recommended {
      border-color: rgba(37,99,235,0.35);
      box-shadow: 0 16px 56px rgba(37,99,235,0.18);
      transform: scale(1.02);
    }
    .pkg-card-recommended:hover {
      transform: scale(1.02) translateY(-4px);
    }
    .pkg-card-active {
      border-color: rgba(16,185,129,0.4);
      box-shadow: 0 16px 48px rgba(16,185,129,0.12);
    }

    /* Badge ribbon */
    .pkg-ribbon {
      position: absolute;
      top: -0.875rem;
      left: 50%;
      transform: translateX(-50%);
      padding: 0.25rem 0.875rem;
      border-radius: 9999px;
      font-size: 0.65rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: white;
      white-space: nowrap;
    }
    .pkg-ribbon-recommended { background: linear-gradient(135deg, #2563EB, #1D4ED8); box-shadow: 0 4px 14px rgba(37,99,235,0.4); }
    .pkg-ribbon-active { background: linear-gradient(135deg, #059669, #10b981); box-shadow: 0 4px 14px rgba(16,185,129,0.35); }
    .pkg-ribbon-normal { background: #1e3a8a; }

    /* Card header */
    .pkg-card-header { display: flex; flex-direction: column; gap: 0.875rem; }
    .pkg-card-name {
      font-family: 'Poppins', sans-serif;
      font-size: 1.25rem;
      font-weight: 700;
      color: #1e3a8a;
      margin: 0;
    }
    .pkg-price-row { display: flex; align-items: baseline; gap: 0.25rem; }
    .pkg-price-currency { font-size: 1rem; font-weight: 600; color: #3b82f6; }
    .pkg-price-amount {
      font-family: 'Poppins', sans-serif;
      font-size: 2.25rem;
      font-weight: 800;
      color: #1e3a8a;
      letter-spacing: -0.04em;
    }
    .pkg-price-period { font-size: 0.8125rem; color: #3b82f6; opacity: 0.7; margin-left: 0.25rem; }
    .pkg-card-desc { font-size: 0.875rem; color: #1e40af; opacity: 0.75; line-height: 1.65; margin: 0; }

    /* Divider */
    .pkg-card-divider { height: 1px; background: rgba(37,99,235,0.08); }

    /* Features list */
    .pkg-features { display: flex; flex-direction: column; gap: 0.75rem; flex: 1; }
    .pkg-feature-item { display: flex; align-items: flex-start; gap: 0.75rem; }
    .pkg-feature-icon {
      width: 20px; height: 20px;
      flex-shrink: 0;
      margin-top: 1px;
    }
    .pkg-feature-text { font-size: 0.875rem; color: #1e3a8a; line-height: 1.5; font-weight: 500; }

    /* CTA button */
    .pkg-btn {
      width: 100%;
      padding: 0.875rem;
      border-radius: 14px;
      font-family: 'Poppins', sans-serif;
      font-size: 0.875rem;
      font-weight: 700;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: filter 180ms ease, transform 180ms ease, box-shadow 180ms ease;
    }
    .pkg-btn-primary {
      background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
      color: white;
      box-shadow: 0 6px 24px rgba(37,99,235,0.35);
    }
    .pkg-btn-primary:hover { filter: brightness(1.08); transform: translateY(-1px); box-shadow: 0 10px 32px rgba(37,99,235,0.45); }
    .pkg-btn-secondary {
      background: rgba(238,242,255,0.8);
      border: 1px solid rgba(37,99,235,0.15);
      color: #2563EB;
    }
    .pkg-btn-secondary:hover { background: rgba(224,231,255,0.9); border-color: rgba(37,99,235,0.3); }
    .pkg-btn-active {
      background: rgba(16,185,129,0.08);
      border: 1px solid rgba(16,185,129,0.2);
      color: #059669;
      cursor: default;
    }
    .pkg-btn-arrow { transition: transform 200ms ease; }
    .pkg-btn:hover .pkg-btn-arrow { transform: translateX(3px); }

    /* ── Money-back row ── */
    .pkg-guarantee {
      display: flex;
      justify-content: center;
      margin-top: 3rem;
    }
    .pkg-guarantee-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.625rem 1.5rem;
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(37,99,235,0.12);
      border-radius: 9999px;
      font-size: 0.8125rem;
      font-weight: 600;
      color: #1e40af;
      box-shadow: 0 4px 16px rgba(37,99,235,0.08);
    }

    /* ── Loading skeleton ── */
    .pkg-loading {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(155deg, #f0f9ff 0%, #eff6ff 100%);
    }
    .pkg-spinner {
      width: 44px; height: 44px;
      border-radius: 50%;
      border: 3px solid rgba(37,99,235,0.15);
      border-top-color: #2563EB;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `}</style>
);

// ─── Icon map ─────────────────────────────────────────────────────────────────

const iconMap: { [key: string]: React.ReactNode } = {
  Cpu: <Cpu className="w-4 h-4" />,
  Zap: <Zap className="w-4 h-4" />,
  Globe: <Globe className="w-4 h-4" />,
  Shield: <Shield className="w-4 h-4" />,
  MessageSquare: <MessageSquare className="w-4 h-4" />,
  Users: <Users className="w-4 h-4" />,
  Video: <Video className="w-4 h-4" />,
};

// ─── Component ────────────────────────────────────────────────────────────────

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

  const activePackages = packages.filter(pkg => pkg.planType === planType);

  if (loading) {
    return (
      <div className="pkg-loading">
        <PricingStyles />
        <div className="pkg-spinner" />
      </div>
    );
  }

  return (
    <div className="pkg-root">
      <PricingStyles />
      <div aria-hidden="true" className="pkg-orb pkg-orb-1" />
      <div aria-hidden="true" className="pkg-orb pkg-orb-2" />
      <Header />

      <div className="pkg-body">
        <div className="pkg-container">
          {/* Hero header */}
          <motion.div
            className="pkg-hero"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="pkg-badge">
              <Star className="w-3 h-3" />
              Gói Dịch Vụ
            </span>
            <h1 className="pkg-hero-title">
              Chọn Gói Phù Hợp{' '}
              <span className="pkg-gradient-text">Với Bạn</span>
            </h1>

            {/* Toggle */}
            <div className="pkg-toggle-wrap">
              <button
                onClick={() => setPlanType('individual')}
                className={`pkg-toggle-btn ${planType === 'individual' ? 'pkg-toggle-active' : 'pkg-toggle-inactive'}`}
              >
                Cá nhân
              </button>
              <button
                onClick={() => setPlanType('business')}
                className={`pkg-toggle-btn ${planType === 'business' ? 'pkg-toggle-active' : 'pkg-toggle-inactive'}`}
              >
                Doanh nghiệp
              </button>
            </div>

            <p className="pkg-hero-desc">
              {planType === 'individual'
                ? 'Mở khóa toàn bộ tiềm năng của dịch thuật ngôn ngữ ký hiệu AI cho mục đích cá nhân.'
                : 'Trao quyền cho đội nhóm của bạn với các công cụ dịch thuật và cộng tác chuyên nghiệp.'}
            </p>
          </motion.div>

          {/* Cards */}
          <div className="pkg-grid">
            {activePackages.map((pkg, idx) => {
              const isActive = activeSubscription?.packageId === pkg.id;
              const isRecommended = pkg.isRecommended;
              return (
                <motion.div
                  key={pkg.id || pkg.name}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className={`pkg-card ${isActive ? 'pkg-card-active' : isRecommended ? 'pkg-card-recommended' : ''}`}
                  onClick={() => handleSelectPlan(pkg)}
                >
                  {/* Ribbon */}
                  {(pkg.badge || isActive) && (
                    <div className={`pkg-ribbon ${isActive ? 'pkg-ribbon-active' : isRecommended ? 'pkg-ribbon-recommended' : 'pkg-ribbon-normal'}`}>
                      {isActive ? 'Đang sử dụng' : pkg.badge}
                    </div>
                  )}

                  {/* Header */}
                  <div className="pkg-card-header">
                    <h2 className="pkg-card-name">{pkg.name}</h2>
                    <div className="pkg-price-row">
                      <span className="pkg-price-currency">₫</span>
                      <span className="pkg-price-amount">{pkg.price}</span>
                      <span className="pkg-price-period">/ {pkg.duration}</span>
                    </div>
                    <p className="pkg-card-desc">{pkg.description}</p>
                  </div>

                  <div className="pkg-card-divider" />

                  {/* Features */}
                  <ul className="pkg-features" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {pkg.features.map((feature, fIdx) => (
                      <li key={fIdx} className="pkg-feature-item">
                        <span
                          className="pkg-feature-icon"
                          style={{
                            color: isActive ? '#10b981' : isRecommended ? '#2563EB' : '#93c5fd',
                          }}
                        >
                          {iconMap[feature.icon] || <Check className="w-4 h-4" />}
                        </span>
                        <span className="pkg-feature-text">{feature.text}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSelectPlan(pkg); }}
                    disabled={isActive}
                    className={`pkg-btn ${isActive ? 'pkg-btn-active' : isRecommended ? 'pkg-btn-primary' : 'pkg-btn-secondary'}`}
                  >
                    {isActive
                      ? 'Gói đang sử dụng'
                      : pkg.buttonText || 'Chọn gói này'}
                    {!isActive && <ArrowRight className="w-4 h-4 pkg-btn-arrow" />}
                  </button>
                </motion.div>
              );
            })}
          </div>

          {/* Guarantee */}
          <div className="pkg-guarantee">
            <div className="pkg-guarantee-pill">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              Hoàn tiền trong 30 ngày nếu không hài lòng
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ServicePackage;
