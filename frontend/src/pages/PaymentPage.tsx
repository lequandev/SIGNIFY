import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, Lock, Check, ArrowLeft, QrCode, Copy, X, AlertCircle, Loader2, CreditCard, Clock } from 'lucide-react';
import api from '../services/api';
import { QRCodeSVG } from 'qrcode.react';

// ─── Design tokens (mirrors LandingPage) ─────────────────────────────────────

const PaymentStyles: React.FC = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&family=Poppins:wght@400;500;600;700;800&display=swap');

    .pay-root {
      min-height: 100vh;
      background: linear-gradient(155deg, #f0f9ff 0%, #eff6ff 40%, #f0f9ff 100%);
      padding: 3rem 1rem 4rem;
      font-family: 'Open Sans', system-ui, sans-serif;
      position: relative;
    }
    .pay-orb {
      position: fixed;
      border-radius: 50%;
      pointer-events: none;
      filter: blur(80px);
      z-index: 0;
    }
    .pay-orb-1 {
      top: -5%;
      left: -5%;
      width: 400px; height: 400px;
      background: radial-gradient(circle, rgba(37,99,235,0.10) 0%, transparent 70%);
    }
    .pay-orb-2 {
      bottom: -5%;
      right: -5%;
      width: 350px; height: 350px;
      background: radial-gradient(circle, rgba(29,78,216,0.08) 0%, transparent 70%);
    }

    .pay-container {
      position: relative;
      z-index: 1;
      max-width: 1100px;
      margin: 0 auto;
    }

    /* Header */
    .pay-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 2.5rem;
    }
    .pay-back {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #3b82f6;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      text-decoration: none;
      transition: color 200ms ease;
    }
    .pay-back:hover { color: #2563EB; }
    .pay-back-icon {
      width: 34px; height: 34px;
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(37,99,235,0.15);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: border-color 200ms ease, box-shadow 200ms ease;
    }
    .pay-back:hover .pay-back-icon {
      border-color: rgba(37,99,235,0.4);
      box-shadow: 0 4px 16px rgba(37,99,235,0.15);
    }

    /* Layout */
    .pay-grid {
      display: grid;
      gap: 2rem;
    }
    @media (min-width: 1024px) {
      .pay-grid { grid-template-columns: 1fr 360px; gap: 2.5rem; }
    }

    /* Glass card base */
    .pay-card {
      background: rgba(255,255,255,0.92);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(37,99,235,0.12);
      border-radius: 24px;
      box-shadow: 0 20px 60px rgba(37,99,235,0.10);
    }

    /* Main payment panel */
    .pay-main {
      min-height: 520px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2.5rem;
    }

    /* Loading state */
    .pay-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.25rem;
      text-align: center;
    }
    .pay-loading-ring {
      position: relative;
    }
    .pay-loading-ring::before {
      content: '';
      position: absolute;
      inset: -8px;
      border-radius: 50%;
      background: rgba(37,99,235,0.08);
      filter: blur(16px);
    }
    .pay-loading-title {
      font-family: 'Poppins', sans-serif;
      font-size: 1.25rem;
      font-weight: 700;
      color: #1e3a8a;
      margin: 0;
    }
    .pay-loading-desc { font-size: 0.875rem; color: #1e40af; opacity: 0.8; margin: 0; max-width: 320px; line-height: 1.6; }

    /* Error state */
    .pay-error-wrap { display: flex; flex-direction: column; align-items: center; gap: 1.25rem; text-align: center; max-width: 320px; }
    .pay-error-icon {
      width: 72px; height: 72px;
      background: rgba(239,68,68,0.08);
      border: 1px solid rgba(239,68,68,0.15);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .pay-error-title { font-family: 'Poppins', sans-serif; font-size: 1.375rem; font-weight: 700; color: #1e3a8a; margin: 0; }
    .pay-error-msg { font-size: 0.875rem; color: #dc2626; font-weight: 500; margin: 0; }
    .pay-btn-retry {
      width: 100%;
      padding: 0.875rem;
      background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
      color: white;
      font-family: 'Poppins', sans-serif;
      font-size: 0.875rem;
      font-weight: 700;
      border: none;
      border-radius: 14px;
      cursor: pointer;
      box-shadow: 0 8px 24px rgba(37,99,235,0.35);
      transition: filter 180ms ease, transform 180ms ease;
    }
    .pay-btn-retry:hover { filter: brightness(1.08); transform: translateY(-1px); }

    /* QR section */
    .pay-qr-section { width: 100%; display: flex; flex-direction: column; gap: 2rem; }
    .pay-qr-heading {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-family: 'Poppins', sans-serif;
      font-size: 1.375rem;
      font-weight: 700;
      color: #1e3a8a;
      margin: 0;
    }
    .pay-qr-sub { font-size: 0.875rem; color: #1e40af; opacity: 0.8; margin: 0.25rem 0 0; }

    .pay-qr-grid {
      display: grid;
      gap: 2rem;
    }
    @media (min-width: 640px) { .pay-qr-grid { grid-template-columns: 1fr 1fr; gap: 2.5rem; } }

    /* QR code box */
    .pay-qr-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }
    .pay-qr-frame {
      position: relative;
      padding: 1.25rem;
      background: rgba(238,242,255,0.6);
      border-radius: 20px;
      border: 1px solid rgba(37,99,235,0.12);
    }
    .pay-qr-inner {
      background: white;
      padding: 1rem;
      border-radius: 14px;
      box-shadow: 0 4px 16px rgba(37,99,235,0.08);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .pay-qr-live-badge {
      position: absolute;
      top: -0.75rem;
      right: -0.75rem;
      padding: 0.25rem 0.75rem;
      background: linear-gradient(135deg, #1e3a8a, #2563EB);
      color: white;
      border-radius: 9999px;
      font-size: 0.65rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      box-shadow: 0 4px 12px rgba(37,99,235,0.4);
      animation: livePulse 2s ease-in-out infinite;
    }
    @keyframes livePulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    .pay-timer {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: rgba(37,99,235,0.06);
      border: 1px solid rgba(37,99,235,0.12);
      border-radius: 9999px;
      font-size: 0.8125rem;
      font-weight: 700;
      color: #2563EB;
    }

    /* Transfer details */
    .pay-details {
      background: rgba(238,242,255,0.5);
      border: 1px solid rgba(37,99,235,0.10);
      border-radius: 18px;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .pay-detail-row { display: flex; flex-direction: column; gap: 0.25rem; }
    .pay-detail-label {
      font-size: 0.65rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.18em;
      color: #3b82f6;
      opacity: 0.7;
    }
    .pay-detail-value-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }
    .pay-detail-value {
      font-size: 0.9375rem;
      font-weight: 700;
      color: #1e3a8a;
      font-family: 'Poppins', sans-serif;
    }
    .pay-detail-value-large {
      font-size: 1.375rem;
      font-weight: 800;
      color: #2563EB;
      font-family: 'Poppins', sans-serif;
    }
    .pay-detail-desc-box {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      background: rgba(37,99,235,0.06);
      border: 1px solid rgba(37,99,235,0.12);
      padding: 0.75rem 1rem;
      border-radius: 12px;
    }
    .pay-detail-desc-text {
      font-size: 0.875rem;
      font-weight: 700;
      color: #2563EB;
      font-family: 'Poppins', monospace;
    }
    .pay-copy-btn {
      width: 34px; height: 34px;
      background: rgba(255,255,255,0.85);
      border: 1px solid rgba(37,99,235,0.12);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #93c5fd;
      transition: color 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
      flex-shrink: 0;
    }
    .pay-copy-btn:hover { color: #2563EB; border-color: rgba(37,99,235,0.3); box-shadow: 0 4px 12px rgba(37,99,235,0.12); }

    /* Security notice */
    .pay-security {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: rgba(16,185,129,0.06);
      border: 1px solid rgba(16,185,129,0.15);
      border-radius: 14px;
      font-size: 0.8125rem;
      font-weight: 500;
      color: #065f46;
      line-height: 1.55;
    }
    .pay-security-icon {
      width: 38px; height: 38px;
      background: white;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #10b981;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(16,185,129,0.12);
    }

    /* Trust icons */
    .pay-trust {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2rem;
      padding: 1.5rem 0;
      opacity: 0.25;
      transition: opacity 500ms ease;
    }
    .pay-trust:hover { opacity: 0.6; }

    /* ── Order summary sidebar ── */
    .pay-summary {
      position: sticky;
      top: 1.5rem;
    }
    .pay-summary-card {
      background: linear-gradient(145deg, #1e3a8a 0%, #1e3a8a 50%, #1e3a8a 100%);
      border-radius: 24px;
      padding: 2rem;
      color: white;
      box-shadow: 0 24px 64px rgba(30,27,75,0.35);
      border: 1px solid rgba(255,255,255,0.06);
    }
    .pay-summary-title {
      font-family: 'Poppins', sans-serif;
      font-size: 0.875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: rgba(191,219,254,0.7);
      margin: 0 0 1.5rem;
    }
    .pay-plan-box {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .pay-plan-label {
      font-size: 0.65rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      color: rgba(191,219,254,0.5);
      margin: 0 0 0.5rem;
    }
    .pay-plan-badge {
      display: inline-block;
      padding: 0.2rem 0.625rem;
      background: linear-gradient(135deg, #2563EB, #1D4ED8);
      border-radius: 9999px;
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: white;
      margin-bottom: 0.5rem;
    }
    .pay-plan-name {
      font-family: 'Poppins', sans-serif;
      font-size: 1.5rem;
      font-weight: 800;
      color: white;
      margin: 0 0 0.25rem;
    }
    .pay-plan-duration { font-size: 0.75rem; font-weight: 600; color: rgba(191,219,254,0.5); text-transform: uppercase; letter-spacing: 0.08em; }

    .pay-line { display: flex; justify-content: space-between; font-size: 0.8125rem; font-weight: 600; }
    .pay-line-label { color: rgba(191,219,254,0.5); text-transform: uppercase; letter-spacing: 0.08em; }
    .pay-line-value { color: rgba(255,255,255,0.85); }
    .pay-divider { height: 1px; background: rgba(255,255,255,0.06); margin: 1rem 0; }
    .pay-total-row { display: flex; justify-content: space-between; align-items: baseline; }
    .pay-total-label { font-family: 'Poppins', sans-serif; font-size: 0.875rem; font-weight: 700; color: rgba(191,219,254,0.7); text-transform: uppercase; letter-spacing: 0.08em; }
    .pay-total-amount {
      font-family: 'Poppins', sans-serif;
      font-size: 2rem;
      font-weight: 900;
      color: #93c5fd;
      letter-spacing: -0.03em;
    }

    .pay-benefit-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      font-size: 0.78rem;
      font-weight: 500;
      color: rgba(191,219,254,0.55);
      line-height: 1.5;
    }
    .pay-benefit-icon {
      width: 24px; height: 24px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .pay-cancel-btn {
      width: 100%;
      padding: 0.875rem;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 14px;
      color: rgba(255,255,255,0.5);
      font-family: 'Poppins', sans-serif;
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: background 180ms ease, color 180ms ease, border-color 180ms ease;
    }
    .pay-cancel-btn:hover {
      background: rgba(239,68,68,0.1);
      color: #fca5a5;
      border-color: rgba(239,68,68,0.2);
    }

    /* Footer note */
    .pay-footer-note {
      text-align: center;
      margin-top: 3rem;
      font-size: 0.7rem;
      color: #3b82f6;
      opacity: 0.55;
    }
    .pay-footer-note a { color: inherit; text-decoration: underline; }
    .pay-footer-note a:hover { opacity: 0.8; }

    /* ── Status modal ── */
    .pay-modal-overlay {
      position: fixed;
      inset: 0;
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      background: rgba(30,27,75,0.55);
      backdrop-filter: blur(16px);
    }
    .pay-modal-card {
      background: rgba(255,255,255,0.96);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(37,99,235,0.12);
      border-radius: 24px;
      padding: 3rem 2.5rem;
      max-width: 420px;
      width: 100%;
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      box-shadow: 0 40px 100px rgba(30,27,75,0.3);
    }
    .pay-modal-icon {
      width: 88px; height: 88px;
      border-radius: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto;
    }
    .pay-modal-title {
      font-family: 'Poppins', sans-serif;
      font-size: 1.5rem;
      font-weight: 800;
      color: #1e3a8a;
      margin: 0;
    }
    .pay-modal-desc { font-size: 0.9rem; color: #1e40af; opacity: 0.8; margin: 0; line-height: 1.65; }
    .pay-progress-bar { width: 100%; height: 4px; background: rgba(37,99,235,0.08); border-radius: 9999px; overflow: hidden; }
    .pay-progress-fill { height: 100%; border-radius: 9999px; }

    /* Skeleton */
    .pay-skeleton { display: flex; flex-direction: column; align-items: center; gap: 1rem; }
    .pay-skeleton-box { border-radius: 14px; background: linear-gradient(90deg, rgba(37,99,235,0.06) 25%, rgba(37,99,235,0.10) 50%, rgba(37,99,235,0.06) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  `}</style>
);

// ─── Component ────────────────────────────────────────────────────────────────

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const selectedPlan = location.state?.plan || null;

  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(600);
  const [status, setStatus] = useState<'success' | 'error' | 'cancel' | null>(null);

  useEffect(() => {
    if (location.pathname.includes('payment-success')) setStatus('success');
    else if (location.pathname.includes('payment-cancel')) setStatus('cancel');
  }, [location.pathname]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (status === 'success') {
      const t = setTimeout(() => navigate('/'), 4000);
      return () => clearTimeout(t);
    }
    if (status === 'cancel' || status === 'error') {
      const t = setTimeout(() => { setStatus(null); navigate('/packages'); }, 4000);
      return () => clearTimeout(t);
    }
  }, [status, navigate]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (paymentData && timeLeft > 0 && !status) {
      timer = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    } else if (timeLeft === 0 && !status && paymentData) {
      setStatus('error');
      setError('Phiên thanh toán đã hết hạn. Vui lòng thử lại.');
      setPaymentData(null);
    }
    return () => clearInterval(timer);
  }, [paymentData, timeLeft, status]);

  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    const checkStatus = async () => {
      if (!paymentData?.orderCode || status) return;
      try {
        const response = await api.get(`/payments/check-status/${paymentData.orderCode}`);
        const currentStatus = response.data.status;
        if (currentStatus === 'paid') navigate('/payment-success');
        else if (currentStatus === 'cancelled') navigate('/payment-cancel');
      } catch (err) { console.error('Polling Error:', err); }
    };
    if (paymentData && !status) pollInterval = setInterval(checkStatus, 5000);
    return () => { if (pollInterval) clearInterval(pollInterval); };
  }, [paymentData, status]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCreatePayment = async () => {
    if (!selectedPlan) { setError('Vui lòng chọn gói dịch vụ trước.'); return; }
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/payments/create-link', {
        packageId: selectedPlan.id || selectedPlan._id,
        name: selectedPlan.name,
      });
      setPaymentData(response.data);
      setTimeLeft(600);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Không thể tạo liên kết thanh toán. Vui lòng thử lại.');
      if (err.response?.status === 401) navigate('/login', { state: { from: location } });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!status && selectedPlan) handleCreatePayment();
    else if (!status && !selectedPlan) navigate('/packages');
  }, []);

  return (
    <div className="pay-root">
      <PaymentStyles />
      <div aria-hidden="true" className="pay-orb pay-orb-1" />
      <div aria-hidden="true" className="pay-orb pay-orb-2" />

      <div className="pay-container">
        {/* Header */}
        <div className="pay-header">
          <Link to="/packages" className="pay-back">
            <div className="pay-back-icon"><ArrowLeft className="w-4 h-4" /></div>
            Quay lại Gói Dịch Vụ
          </Link>
          <img src="/logo_removebg.png" alt="Signify Logo" style={{ height: 56, objectFit: 'contain' }} />
        </div>

        <div className="pay-grid">
          {/* ── Left: Payment panel ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <motion.div
              className="pay-card pay-main"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              {loading ? (
                <div className="pay-loading">
                  <div className="pay-loading-ring">
                    <Loader2 className="w-14 h-14 text-indigo-500 animate-spin" style={{ position: 'relative', zIndex: 1 }} />
                  </div>
                  <div>
                    <p className="pay-loading-title">Đang tạo mã QR...</p>
                    <p className="pay-loading-desc">Vui lòng đợi trong khi chúng tôi thiết lập giao dịch an toàn với PayOS.</p>
                  </div>
                </div>
              ) : error ? (
                <div className="pay-error-wrap">
                  <div className="pay-error-icon">
                    <Shield className="w-9 h-9 text-red-500" />
                  </div>
                  <p className="pay-error-title">Lỗi Thanh toán</p>
                  <p className="pay-error-msg">{error}</p>
                  <button onClick={handleCreatePayment} className="pay-btn-retry">Thử lại</button>
                </div>
              ) : paymentData ? (
                <div className="pay-qr-section">
                  <div>
                    <h2 className="pay-qr-heading">
                      <QrCode className="w-6 h-6 text-indigo-500" />
                      Quét mã để thanh toán
                    </h2>
                    <p className="pay-qr-sub">Sử dụng ứng dụng ngân hàng của bạn để quét mã QR bên dưới.</p>
                  </div>

                  <div className="pay-qr-grid">
                    {/* QR column */}
                    <div className="pay-qr-box">
                      <div className="pay-qr-frame">
                        <div className="pay-qr-inner">
                          <QRCodeSVG value={paymentData.qrCode} size={200} level="H" includeMargin={false} />
                        </div>
                        <div className="pay-qr-live-badge">Live QR</div>
                      </div>
                      <div className="pay-timer">
                        <Clock className="w-3.5 h-3.5" />
                        Hết hạn sau: {formatTime(timeLeft)}
                      </div>
                    </div>

                    {/* Details column */}
                    <div className="pay-details">
                      <div className="pay-detail-row">
                        <span className="pay-detail-label">Chủ tài khoản</span>
                        <div className="pay-detail-value-row">
                          <span className="pay-detail-value">{paymentData.accountName}</span>
                          <button className="pay-copy-btn" onClick={() => copyToClipboard(paymentData.accountName, 'name')}>
                            {copiedField === 'name' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      <div className="pay-detail-row">
                        <span className="pay-detail-label">Số tài khoản (Vietcombank)</span>
                        <div className="pay-detail-value-row">
                          <span className="pay-detail-value" style={{ fontFamily: 'monospace', fontSize: '1.0625rem' }}>{paymentData.accountNumber}</span>
                          <button className="pay-copy-btn" onClick={() => copyToClipboard(paymentData.accountNumber, 'acc')}>
                            {copiedField === 'acc' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      <div className="pay-detail-row">
                        <span className="pay-detail-label">Số tiền</span>
                        <div className="pay-detail-value-row">
                          <span className="pay-detail-value-large">₫{paymentData.amount.toLocaleString('vi-VN')}</span>
                          <button className="pay-copy-btn" onClick={() => copyToClipboard(paymentData.amount.toString(), 'amount')}>
                            {copiedField === 'amount' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      <div className="pay-detail-row">
                        <span className="pay-detail-label">Nội dung chuyển khoản</span>
                        <div className="pay-detail-desc-box">
                          <span className="pay-detail-desc-text">{paymentData.description}</span>
                          <button className="pay-copy-btn" onClick={() => copyToClipboard(paymentData.description, 'content')}>
                            {copiedField === 'content' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pay-security">
                    <div className="pay-security-icon"><Shield className="w-5 h-5" /></div>
                    Giao dịch được bảo mật bởi PayOS. Sau khi thanh toán thành công, hệ thống sẽ tự động cập nhật trạng thái trong giây lát.
                  </div>
                </div>
              ) : (
                <div className="pay-skeleton">
                  <div className="pay-skeleton-box" style={{ width: 64, height: 64, borderRadius: 16 }} />
                  <div className="pay-skeleton-box" style={{ width: 220, height: 20, borderRadius: 8 }} />
                  <div className="pay-skeleton-box" style={{ width: 160, height: 14, borderRadius: 8 }} />
                </div>
              )}
            </motion.div>

            {/* Trust icons */}
            <div className="pay-trust">
              <Shield className="w-8 h-8 text-indigo-400" />
              <Lock className="w-8 h-8 text-indigo-400" />
              <CreditCard className="w-8 h-8 text-indigo-400" />
            </div>
          </div>

          {/* ── Right: Order summary ── */}
          <div className="pay-summary">
            <motion.div
              className="pay-summary-card"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="pay-summary-title">Chi tiết đơn hàng</p>

              <div className="pay-plan-box">
                <p className="pay-plan-label">Gói đã chọn</p>
                {selectedPlan?.badge && <span className="pay-plan-badge">{selectedPlan.badge}</span>}
                <p className="pay-plan-name">{selectedPlan?.name || 'Gói Dịch Vụ'}</p>
                <p className="pay-plan-duration">Thanh toán theo {selectedPlan?.duration || 'tháng'}</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div className="pay-line">
                  <span className="pay-line-label">Tạm tính</span>
                  <span className="pay-line-value">₫{selectedPlan?.price || '0'}</span>
                </div>
                <div className="pay-line">
                  <span className="pay-line-label">Thuế (0%)</span>
                  <span className="pay-line-value">₫0</span>
                </div>
                <div className="pay-divider" />
                <div className="pay-total-row">
                  <span className="pay-total-label">Tổng cộng</span>
                  <span className="pay-total-amount">₫{selectedPlan?.price || '0'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="pay-benefit-item">
                  <div className="pay-benefit-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  Kích hoạt ngay lập tức sau khi hoàn tất thanh toán.
                </div>
                <div className="pay-benefit-item">
                  <div className="pay-benefit-icon" style={{ background: 'rgba(37,99,235,0.15)' }}>
                    <Shield className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  Xử lý thanh toán được mã hóa SSL 256-bit an toàn.
                </div>
              </div>

              {paymentData && (
                <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <button
                    onClick={() => { setStatus('cancel'); setPaymentData(null); }}
                    className="pay-cancel-btn"
                  >
                    Hủy giao dịch
                    <X className="w-4 h-4" style={{ transition: 'transform 200ms ease' }} />
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <p className="pay-footer-note">
          Bằng việc hoàn tất thanh toán, bạn đồng ý với{' '}
          <Link to="/">Điều khoản Dịch vụ</Link> và{' '}
          <Link to="/">Chính sách Bảo mật</Link> của Signify AI.
        </p>
      </div>

      {/* ── Status modal ── */}
      <AnimatePresence>
        {status && (
          <motion.div className="pay-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              className="pay-modal-card"
              initial={{ scale: 0.88, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 30 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className={`pay-modal-icon ${
                status === 'success' ? 'bg-emerald-50 border-2 border-emerald-100' :
                status === 'cancel' ? 'bg-amber-50 border-2 border-amber-100' :
                'bg-red-50 border-2 border-red-100'
              }`}>
                {status === 'success'
                  ? <Check className="w-11 h-11 text-emerald-500" />
                  : status === 'cancel'
                  ? <AlertCircle className="w-11 h-11 text-amber-500" />
                  : <X className="w-11 h-11 text-red-500" />
                }
              </div>

              <p className="pay-modal-title">
                {status === 'success' ? 'Thanh toán Thành công!' :
                 status === 'cancel' ? 'Đã hủy Giao dịch' : 'Lỗi Thanh toán'}
              </p>
              <p className="pay-modal-desc">
                {status === 'success' ? 'Đăng ký của bạn đã được kích hoạt. Đang chuyển hướng về trang chủ...' :
                 status === 'cancel' ? 'Bạn đã hủy yêu cầu thanh toán. Đang quay lại trang gói dịch vụ...' :
                 error || 'Đã có lỗi xảy ra. Đang quay lại trang gói dịch vụ...'}
              </p>

              <div className="pay-progress-bar">
                <motion.div
                  className={`pay-progress-fill ${
                    status === 'success' ? 'bg-emerald-500' :
                    status === 'cancel' ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 4, ease: 'linear' }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PaymentPage;
