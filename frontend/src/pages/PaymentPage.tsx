import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Building2, Check, Clock, Copy, CreditCard, Loader2, Lock, QrCode, Shield, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';

const formatCurrency = (amount?: number | string) => {
  if (amount === undefined || amount === null) return '0đ';
  if (typeof amount === 'number') return `${amount.toLocaleString('vi-VN')}đ`;
  return amount.endsWith('đ') ? amount : `${amount}đ`;
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const PaymentPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedPlan = location.state?.plan || location.state?.selectedPlan || null;

  const routeStatus = useMemo<'success' | 'cancel' | null>(() => {
    if (location.pathname.includes('payment-success')) return 'success';
    if (location.pathname.includes('payment-cancel')) return 'cancel';
    return null;
  }, [location.pathname]);

  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(600);
  const [status, setStatus] = useState<'success' | 'error' | 'cancel' | null>(routeStatus);
  const [schoolName, setSchoolName] = useState('');
  const isEducationPlan = selectedPlan?.planType === 'education';
  const [paymentRequested, setPaymentRequested] = useState(false);
  const createPaymentStartedRef = useRef(false);
  const canCreatePayment = !isEducationPlan || schoolName.trim().length > 1;

  useEffect(() => {
    setStatus(routeStatus);
  }, [routeStatus]);

  useEffect(() => {
    if (!selectedPlan && !routeStatus) {
      navigate('/packages');
    }
  }, [selectedPlan, routeStatus, navigate]);

  useEffect(() => {
    if (routeStatus || !selectedPlan || paymentData || loading || createPaymentStartedRef.current) return;
    if (!paymentRequested) return;
    if (!canCreatePayment) return;

    createPaymentStartedRef.current = true;
    const createPayment = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.post('/payments/create-link', {
          packageId: selectedPlan.id || selectedPlan._id,
          name: isEducationPlan ? schoolName.trim() : selectedPlan.name,
        });
        setPaymentData(response.data);
        setTimeLeft(600);
      } catch (err: any) {
        const message = err?.response?.data?.message || err?.message || 'Không thể tạo liên kết thanh toán. Vui lòng thử lại.';
        setError(message);
        setPaymentRequested(false);
        createPaymentStartedRef.current = false;
        if (err?.response?.status === 401) {
          navigate('/login', { state: { from: location } });
        }
      } finally {
        setLoading(false);
      }
    };

    createPayment();
  }, [selectedPlan, routeStatus, paymentData, loading, navigate, location, isEducationPlan, paymentRequested, canCreatePayment, schoolName]);

  useEffect(() => {
    if (!paymentData || status || timeLeft <= 0) return;

    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          setError('Phiên thanh toán đã hết hạn. Vui lòng tạo lại giao dịch.');
          setStatus('error');
          setPaymentData(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [paymentData, status, timeLeft]);

  useEffect(() => {
    if (!paymentData?.orderCode || status) return;

    const poll = window.setInterval(async () => {
      try {
        const response = await api.get(`/payments/check-status/${paymentData.orderCode}`);
        const currentStatus = response.data.status;

        if (currentStatus === 'paid') {
          navigate('/payment-success', { state: { plan: selectedPlan } });
        } else if (currentStatus === 'cancelled') {
          navigate('/payment-cancel', { state: { plan: selectedPlan } });
        }
      } catch (err) {
        console.error('Payment status polling failed:', err);
      }
    }, 5000);

    return () => window.clearInterval(poll);
  }, [paymentData, status, navigate, selectedPlan]);

  useEffect(() => {
    if (status === 'success') {
      const targetPath = selectedPlan?.planType === 'education' ? '/school' : '/profile';
      const timer = window.setTimeout(() => navigate(targetPath), 4000);
      return () => window.clearTimeout(timer);
    }
    if (status === 'cancel' || status === 'error') {
      const timer = window.setTimeout(() => navigate('/packages'), 4000);
      return () => window.clearTimeout(timer);
    }
  }, [status, navigate, selectedPlan]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    window.setTimeout(() => setCopiedField(null), 1800);
  };

  const handleRetry = () => {
    setPaymentData(null);
    setError(null);
    setStatus(null);
    setPaymentRequested(false);
    createPaymentStartedRef.current = false;
    setTimeLeft(600);
  };

  const handleStartPayment = () => {
    if (!canCreatePayment) {
      setError('Vui lòng nhập tên trường trước khi tạo thanh toán.');
      return;
    }
    setError(null);
    setPaymentRequested(true);
  };

  const handleCancel = () => {
    setPaymentData(null);
    createPaymentStartedRef.current = false;
    navigate('/payment-cancel', { state: { plan: selectedPlan } });
  };

  const paymentDetails = paymentData ? [
    { label: 'Chủ tài khoản', value: paymentData.accountName, key: 'name' },
    { label: 'Số tài khoản', value: paymentData.accountNumber, key: 'account' },
    { label: 'Số tiền', value: formatCurrency(paymentData.amount), key: 'amount' },
    { label: 'Nội dung chuyển khoản', value: paymentData.description, key: 'description' },
  ] : [];

  return (
    <div className="bg-background text-on-surface font-sans min-h-screen flex flex-col selection:bg-primary/20 selection:text-primary">
      <Header />

      <main className="pt-28 flex-grow">
        <div className="max-w-[1200px] mx-auto px-6 py-10">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Link to="/packages" className="inline-flex items-center gap-2 text-sm font-bold text-on-surface-variant hover:text-primary transition-colors w-fit">
              <span className="w-9 h-9 rounded-xl bg-surface-container-lowest border border-outline-variant/60 flex items-center justify-center shadow-sm">
                <ArrowLeft className="w-4 h-4" />
              </span>
              Quay lại gói dịch vụ
            </Link>
            <div className="inline-flex items-center gap-2 rounded-full bg-surface-container-lowest border border-outline-variant/60 px-4 py-2 text-xs font-bold text-on-surface-variant shadow-sm w-fit">
              <Lock className="w-4 h-4 text-primary" />
              Thanh toán bảo mật qua PayOS
            </div>
          </div>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-surface-container-lowest border border-outline-variant/60 rounded-[24px] shadow-md overflow-hidden mb-6"
          >
            <div className="relative bg-gradient-to-r from-primary via-primary-container to-secondary p-8 text-white">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.2),_transparent_50%)] pointer-events-none" />

              <div className="relative flex flex-col lg:flex-row lg:items-start gap-6">
                <div className="w-24 h-24 rounded-full border-4 border-white/40 bg-white/10 overflow-hidden shadow-xl backdrop-blur flex items-center justify-center shrink-0">
                  <CreditCard className="w-11 h-11" />
                </div>

                <div className="flex-grow text-center lg:text-left">
                  <h1 className="text-2xl md:text-3xl font-extrabold mb-2 tracking-tight">Hoàn tất thanh toán gói dịch vụ</h1>
                  <p className="text-white/80 text-sm mb-3">Quét mã QR PayOS và giữ nguyên nội dung chuyển khoản để hệ thống tự động kích hoạt gói.</p>
                  <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-xs font-bold backdrop-blur">
                      <Shield className="w-3 h-3" />
                      Thanh toán bảo mật
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-xs font-bold backdrop-blur">
                      <QrCode className="w-3 h-3" />
                      PayOS QR
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur text-center lg:text-left w-full lg:w-64">
                  <div className="flex items-center gap-2 text-xs text-white/80 mb-1">
                    <CreditCard className="w-4 h-4" />
                    Tổng thanh toán
                  </div>
                  <p className="text-2xl font-black">{formatCurrency(selectedPlan?.price)}</p>
                  <p className="text-xs font-bold text-white/75 mt-1">{selectedPlan?.name || 'Gói Signify'}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6 bg-surface-container/30">
              <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant mb-2">
                  <CreditCard className="w-4 h-4 text-primary" />
                  Gói đã chọn
                </div>
                <p className="text-base font-bold text-on-surface">{selectedPlan?.name || 'Gói Signify'}</p>
              </div>

              <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant mb-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Thời hạn
                </div>
                <p className="text-base font-bold text-on-surface">{selectedPlan?.duration || 'Theo gói'}</p>
              </div>

              <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant mb-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  Loại gói
                </div>
                <p className="text-base font-bold text-on-surface">{isEducationPlan ? 'Giáo dục' : 'Cá nhân'}</p>
              </div>
            </div>
          </motion.section>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
            <motion.section
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="bg-surface-container-lowest border border-outline-variant/60 rounded-[24px] shadow-md p-6 md:p-8 min-h-[520px] flex items-center justify-center"
            >
              {loading ? (
                <div className="text-center max-w-sm">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                  <h2 className="text-2xl font-black tracking-tight mb-2">Đang tạo mã QR...</h2>
                  <p className="text-sm font-medium text-on-surface-variant leading-relaxed">
                    Hệ thống đang kết nối PayOS để tạo giao dịch thanh toán an toàn.
                  </p>
                </div>
              ) : paymentData ? (
                <div className="w-full">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
                    <div>
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black tracking-wider mb-4">
                        <QrCode className="w-4 h-4" />
                        LIVE QR PAYMENT
                      </div>
                      <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-2">Quét mã QR để thanh toán</h2>
                      <p className="text-sm md:text-base text-on-surface-variant font-medium">
                        Sử dụng ứng dụng ngân hàng để quét mã bên dưới.
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-4 py-2 text-sm font-bold w-fit">
                      <Clock className="w-4 h-4" />
                      {formatTime(timeLeft)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-[260px_minmax(0,1fr)] gap-6 items-start">
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative p-5 rounded-[24px] bg-surface-container border border-outline-variant/60 shadow-inner">
                        <div className="bg-white rounded-2xl p-4 shadow-md">
                          <QRCodeSVG value={paymentData.qrCode} size={210} level="H" includeMargin={false} />
                        </div>
                        <span className="absolute -top-3 -right-3 rounded-full bg-primary text-on-primary px-3 py-1 text-[10px] font-black tracking-wider shadow-lg">
                          LIVE
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {paymentDetails.map(item => (
                        <div key={item.key} className="rounded-2xl border border-outline-variant/60 bg-surface-container-low p-4">
                          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-on-surface-variant mb-2">{item.label}</p>
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm md:text-base font-black text-on-surface break-all">{item.value}</p>
                            <button
                              onClick={() => copyToClipboard(String(item.value), item.key)}
                              className="w-9 h-9 rounded-xl bg-surface-container-lowest border border-outline-variant/60 flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary/40 transition-colors shrink-0"
                            >
                              {copiedField === item.key ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8 rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3 flex items-start gap-3 text-sm font-semibold text-green-700">
                    <Shield className="w-5 h-5 shrink-0 mt-0.5" />
                    Giao dịch được xử lý qua PayOS. Vui lòng không sửa nội dung chuyển khoản để hệ thống nhận diện đúng giao dịch.
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-md">
                  {isEducationPlan ? (
                    <div className="text-left">
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5">
                        <Building2 className="w-8 h-8" />
                      </div>
                      <h2 className="text-2xl font-black tracking-tight mb-2">Thông tin trường học</h2>
                      <p className="text-sm font-medium text-on-surface-variant leading-relaxed mb-6">
                        Nhập tên trường để Signify tạo workspace giáo dục sau khi thanh toán thành công.
                      </p>

                      <label className="block text-xs font-black uppercase tracking-[0.16em] text-on-surface-variant mb-2">
                        Tên trường
                      </label>
                      <input
                        type="text"
                        value={schoolName}
                        onChange={(event) => {
                          setSchoolName(event.target.value);
                          if (error) setError(null);
                        }}
                        placeholder="Ví dụ: ABC school"
                        className="w-full rounded-2xl border border-outline-variant/60 bg-surface-container-low px-4 py-3 text-sm font-bold text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all"
                      />

                      {error && (
                        <div className="mt-4 rounded-2xl border border-error/20 bg-error-container/60 px-4 py-3 text-sm font-bold text-error flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          {error}
                        </div>
                      )}

                      <button
                        onClick={handleStartPayment}
                        disabled={!canCreatePayment}
                        className="mt-6 w-full rounded-xl bg-primary text-on-primary px-6 py-3 text-sm font-bold shadow-lg shadow-primary/25 hover:bg-primary-container hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
                      >
                        Tạo mã QR thanh toán
                      </button>
                    </div>
                  ) : error ? (
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-error-container text-error flex items-center justify-center mb-5">
                        <AlertCircle className="w-8 h-8" />
                      </div>
                      <h2 className="text-2xl font-black tracking-tight mb-2">Không thể tạo thanh toán</h2>
                      <p className="text-sm font-semibold text-error mb-6 leading-relaxed">{error}</p>
                      <button
                        onClick={handleRetry}
                        className="w-full sm:w-auto rounded-xl bg-primary text-on-primary px-6 py-3 text-sm font-bold shadow-lg shadow-primary/25 hover:bg-primary-container hover:-translate-y-0.5 active:scale-95 transition-all"
                      >
                        Tạo lại mã QR
                      </button>
                    </div>
                  ) : (
                    <div className="text-center max-w-sm mx-auto">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5">
                        <QrCode className="w-8 h-8" />
                      </div>
                      <h2 className="text-2xl font-black tracking-tight mb-2">Sẵn sàng tạo mã QR</h2>
                      <p className="text-sm font-medium text-on-surface-variant leading-relaxed mb-6">
                        Bấm nút bên dưới để tạo giao dịch PayOS cho gói đã chọn.
                      </p>
                      <button
                        onClick={handleStartPayment}
                        className="w-full rounded-xl bg-primary text-on-primary px-6 py-3 text-sm font-bold shadow-lg shadow-primary/25 hover:bg-primary-container hover:-translate-y-0.5 active:scale-95 transition-all"
                      >
                        Tạo mã QR thanh toán
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.section>

            <motion.aside
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-surface-container-lowest border border-outline-variant/60 rounded-[24px] shadow-md overflow-hidden"
            >
              <div className="bg-surface-container p-6 border-b border-outline-variant/50">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-primary mb-2">Chi tiết đơn hàng</p>
                <h2 className="text-xl font-black tracking-tight text-on-surface">{selectedPlan?.name || 'Gói Signify'}</h2>
                <p className="text-sm font-semibold text-on-surface-variant mt-1">Thanh toán theo {selectedPlan?.duration || 'gói'}</p>
              </div>

              <div className="p-6 space-y-5">
                {selectedPlan?.badge && (
                  <span className="inline-flex rounded-full bg-primary/10 text-primary px-3 py-1 text-[10px] font-black uppercase tracking-wider">
                    {selectedPlan.badge}
                  </span>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span className="text-on-surface-variant">Tạm tính</span>
                    <span>{formatCurrency(selectedPlan?.price)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span className="text-on-surface-variant">Thuế</span>
                    <span>0đ</span>
                  </div>
                  <div className="h-px bg-outline-variant/50" />
                  <div className="flex items-end justify-between gap-4">
                    <span className="text-sm font-black uppercase tracking-wider text-on-surface-variant">Tổng cộng</span>
                    <span className="text-3xl font-black text-primary">{formatCurrency(selectedPlan?.price)}</span>
                  </div>
                </div>

                {isEducationPlan && (
                  <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4 flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-primary mb-1">Giáo dục</p>
                      <p className="text-sm font-bold text-on-surface">
                        {schoolName.trim() || 'Chưa nhập tên trường'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-3 pt-5 border-t border-outline-variant/50">
                  <div className="flex items-start gap-3 text-sm font-semibold text-on-surface-variant">
                    <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    Kích hoạt tự động sau khi thanh toán thành công.
                  </div>
                  <div className="flex items-start gap-3 text-sm font-semibold text-on-surface-variant">
                    <CreditCard className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    Thanh toán qua PayOS với QR chuyển khoản.
                  </div>
                </div>

                {paymentData && (
                  <button
                    onClick={handleCancel}
                    className="w-full rounded-xl border border-outline-variant/60 text-on-surface px-4 py-3 text-sm font-bold hover:bg-error/10 hover:text-error hover:border-error/30 transition-all flex items-center justify-center gap-2"
                  >
                    Hủy giao dịch
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.aside>
          </div>
        </div>
      </main>

      <Footer />

      <AnimatePresence>
        {status && (
          <motion.div
            className="fixed inset-0 z-[999] flex items-center justify-center bg-on-background/60 backdrop-blur-md p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.94 }}
              className="w-full max-w-md rounded-[28px] bg-surface-container-lowest border border-outline-variant/60 shadow-2xl p-8 text-center"
            >
              <div className={`w-20 h-20 rounded-[24px] mx-auto mb-5 flex items-center justify-center ${status === 'success' ? 'bg-green-500/10 text-green-600' : status === 'cancel' ? 'bg-amber-500/10 text-amber-600' : 'bg-error-container text-error'}`}>
                {status === 'success' ? <Check className="w-10 h-10" /> : status === 'cancel' ? <AlertCircle className="w-10 h-10" /> : <X className="w-10 h-10" />}
              </div>
              <h2 className="text-2xl font-black tracking-tight mb-3">
                {status === 'success' ? 'Thanh toán thành công!' : status === 'cancel' ? 'Đã hủy giao dịch' : 'Thanh toán thất bại'}
              </h2>
              <p className="text-sm font-medium text-on-surface-variant leading-relaxed mb-6">
                {status === 'success'
                  ? selectedPlan?.planType === 'education' ? 'Gói dịch vụ đã được kích hoạt. Hệ thống sẽ chuyển bạn về trang trường học.' : 'Gói dịch vụ đã được kích hoạt. Hệ thống sẽ chuyển bạn về trang hồ sơ.'
                  : status === 'cancel'
                    ? 'Giao dịch đã được hủy. Hệ thống sẽ chuyển bạn về trang gói dịch vụ.'
                    : error || 'Có lỗi xảy ra trong quá trình thanh toán. Hệ thống sẽ chuyển bạn về trang gói dịch vụ.'}
              </p>
              <div className="h-1.5 rounded-full bg-surface-container overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${status === 'success' ? 'bg-green-500' : status === 'cancel' ? 'bg-amber-500' : 'bg-error'}`}
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
