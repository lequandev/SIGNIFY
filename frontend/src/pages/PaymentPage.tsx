import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Users, CreditCard, Shield, Lock, Check, ArrowLeft, QrCode, Copy, X, AlertCircle, Loader2 } from 'lucide-react';
import api from '../services/api';
import { QRCodeSVG } from 'qrcode.react';

const PaymentPage = () => {
  console.log('PaymentPage mounted');
  const location = useLocation();
  console.log('Location state:', location.state);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Detect if we've been redirected back from PayOS
  const isSuccess = location.pathname.includes('payment-success');
  const isCancel = location.pathname.includes('payment-cancel');
  const orderCodeFromUrl = searchParams.get('orderCode');

  const selectedPlan = location.state?.plan || null;

  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(600); // 10 minutes
  const [status, setStatus] = useState<'success' | 'error' | 'cancel' | null>(null);

  useEffect(() => {
    if (location.pathname.includes('payment-success')) {
      setStatus('success');
    } else if (location.pathname.includes('payment-cancel')) {
      setStatus('cancel');
    }
  }, [location.pathname]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => navigate('/'), 4000);
      return () => clearTimeout(timer);
    }
    if (status === 'cancel' || status === 'error') {
      const timer = setTimeout(() => {
        setStatus(null);
        navigate('/packages');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [status, navigate]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (paymentData && timeLeft > 0 && !status) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && !status && paymentData) {
      setStatus('error');
      setError('Phiên thanh toán đã hết hạn. Vui lòng thử lại.');
      setPaymentData(null);
    }
    return () => clearInterval(timer);
  }, [paymentData, timeLeft, status]);

  // Status Polling
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;

    const checkStatus = async () => {
      if (!paymentData?.orderCode || status) return;

      try {
        const response = await api.get(`/payments/check-status/${paymentData.orderCode}`);
        const currentStatus = response.data.status;

        if (currentStatus === 'paid') {
          navigate('/payment-success');
        } else if (currentStatus === 'cancelled') {
          navigate('/payment-cancel');
        }
      } catch (err) {
        console.error('Polling Error:', err);
      }
    };

    if (paymentData && !status) {
      pollInterval = setInterval(checkStatus, 5000);
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [paymentData, status]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCreatePayment = async () => {
    if (!selectedPlan) {
      setError('Vui lòng chọn gói dịch vụ trước.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/payments/create-link', { 
        packageId: selectedPlan.id || selectedPlan._id,
        name: selectedPlan.name
      });
      
      setPaymentData(response.data);
      setTimeLeft(600); 
    } catch (err: any) {
      console.error('Payment Error:', err);
      setError(err.response?.data?.message || err.message || 'Không thể tạo liên kết thanh toán. Vui lòng thử lại sau.');
      
      if (err.response?.status === 401) {
        navigate('/login', { state: { from: location } });
      }
    } finally {
      setLoading(false);
    }
  };

  // Automatically initiate payment link creation on mount if not a redirect
  useEffect(() => {
    if (!status && selectedPlan) {
      handleCreatePayment();
    } else if (!status && !selectedPlan) {
      navigate('/packages');
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 font-sans selection:bg-[#2563EB] selection:text-white">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <Link to="/packages" className="flex items-center gap-2 group">
            <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-[#2563EB] transition-colors" />
            <span className="text-sm font-black text-slate-500 group-hover:text-[#2563EB] transition-colors uppercase tracking-wider">Quay lại Gói Dịch Vụ</span>
          </Link>
          <div className="flex items-center gap-2 group">
            <img src="/logo_removebg.png" alt="Signify Logo" className="h-12 object-contain group-hover:scale-110 transition-transform" />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Left Column: Payment Details */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[3rem] p-10 shadow-2xl border border-slate-100 min-h-[550px] flex flex-col items-center justify-center text-center relative overflow-hidden"
            >
              {loading ? (
                <div className="space-y-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-[#2563EB]/10 blur-2xl rounded-full" />
                    <Loader2 className="w-16 h-16 text-[#2563EB] animate-spin mx-auto relative z-10" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Đang tạo mã QR...</h2>
                    <p className="text-slate-500 font-medium px-8">Vui lòng đợi trong khi chúng tôi thiết lập giao dịch an toàn với PayOS.</p>
                  </div>
                </div>
              ) : error ? (
                <div className="space-y-6 max-w-sm">
                  <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner border border-red-100">
                    <Shield className="w-10 h-10" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-slate-900">Lỗi Thanh toán</h2>
                    <p className="text-red-500 font-bold">{error}</p>
                  </div>
                  <button 
                    onClick={handleCreatePayment}
                    className="w-full bg-[#2563EB] text-white px-8 py-4 rounded-2xl font-black hover:bg-[#4F46E5] transition-all shadow-xl shadow-[#2563EB]/30"
                  >
                    Thử lại
                  </button>
                </div>
              ) : paymentData ? (
                <div className="w-full space-y-10">
                  <div className="space-y-3">
                    <h2 className="text-3xl font-black text-slate-900 flex items-center justify-center gap-3 tracking-tight">
                      <QrCode className="w-8 h-8 text-[#2563EB]" />
                      Quét mã để thanh toán
                    </h2>
                    <p className="text-slate-500 font-medium">Sử dụng ứng dụng ngân hàng của bạn để quét mã QR bên dưới.</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-12 w-full pt-4">
                    {/* QR Code Column */}
                    <div className="space-y-6 flex flex-col items-center">
                      <div className="relative group p-6 bg-slate-50 rounded-[2.5rem] border-2 border-slate-100 shadow-inner">
                        <div className="bg-white p-4 rounded-[1.5rem] shadow-sm flex items-center justify-center">
                          <QRCodeSVG 
                            value={paymentData.qrCode}
                            size={224}
                            level="H"
                            includeMargin={false}
                            className="rounded-lg"
                          />
                        </div>
                        <div className="absolute -top-3 -right-3 px-4 py-2 bg-slate-900 text-white rounded-2xl text-[10px] font-black tracking-widest uppercase shadow-xl animate-pulse">
                          Live QR
                        </div>
                      </div>
                      <div className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#2563EB]/5 text-[#2563EB] rounded-full text-sm font-black border border-[#2563EB]/10 shadow-sm">
                        Hết hạn sau: {formatTime(timeLeft)}
                      </div>
                    </div>

                    {/* Transfer Details Column */}
                    <div className="space-y-4 text-left">
                      <div className="bg-slate-50 rounded-[2.5rem] p-6 border border-slate-100 space-y-6 shadow-inner">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Chủ tài khoản</label>
                          <div className="flex items-center justify-between group">
                            <span className="text-sm font-black text-slate-900">{paymentData.accountName}</span>
                            <button onClick={() => copyToClipboard(paymentData.accountName, 'name')} className="p-2 bg-white rounded-xl shadow-sm text-slate-400 hover:text-[#2563EB] transition-all">
                              {copiedField === 'name' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Số tài khoản (Vietcombank)</label>
                          <div className="flex items-center justify-between group">
                            <span className="text-lg font-black text-slate-900 font-mono tracking-tight">{paymentData.accountNumber}</span>
                            <button onClick={() => copyToClipboard(paymentData.accountNumber, 'acc')} className="p-2 bg-white rounded-xl shadow-sm text-slate-400 hover:text-[#2563EB] transition-all">
                              {copiedField === 'acc' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Số tiền</label>
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-black text-[#2563EB]">₫{paymentData.amount.toLocaleString('vi-VN')}</span>
                            <button onClick={() => copyToClipboard(paymentData.amount.toString(), 'amount')} className="p-2 bg-white rounded-xl shadow-sm text-slate-400 hover:text-[#2563EB] transition-all">
                              {copiedField === 'amount' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5 pt-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Nội dung chuyển khoản</label>
                          <div className="flex items-center justify-between bg-[#2563EB]/5 p-4 rounded-2xl border border-[#2563EB]/10 group">
                            <span className="text-sm font-black text-[#2563EB] tracking-wider">{paymentData.description}</span>
                            <button onClick={() => copyToClipboard(paymentData.description, 'content')} className="p-2 bg-white rounded-xl shadow-sm text-slate-400 hover:text-[#2563EB] transition-all">
                              {copiedField === 'content' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-emerald-50 text-emerald-700 p-5 rounded-[2rem] text-sm font-bold flex items-center gap-4 max-w-3xl mx-auto border border-emerald-100">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm text-emerald-500">
                      <Shield className="w-5 h-5" />
                    </div>
                    <span className="text-left">Giao dịch được bảo mật bởi PayOS. Sau khi thanh toán thành công, hệ thống sẽ tự động cập nhật trạng thái trong giây lát.</span>
                  </div>
                </div>
              ) : (
                <div className="animate-pulse flex flex-col items-center">
                  <div className="w-16 h-16 bg-slate-200 rounded-2xl mb-4" />
                  <div className="w-48 h-6 bg-slate-200 rounded-full mb-2" />
                  <div className="w-32 h-4 bg-slate-100 rounded-full" />
                </div>
              )}
            </motion.div>

            <div className="flex items-center justify-center gap-12 py-8 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
              <Shield className="w-10 h-10" />
              <Lock className="w-10 h-10" />
              <CreditCard className="w-10 h-10" />
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl sticky top-12 border border-slate-800"
            >
              <h3 className="text-xl font-black mb-10 tracking-tight uppercase">Chi tiết đơn hàng</h3>
              
              <div className="bg-white/5 rounded-[2rem] p-8 mb-10 border border-white/10 backdrop-blur-md">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Gói đã chọn</span>
                  {selectedPlan?.badge && (
                    <span className="text-[10px] font-bold bg-[#2563EB] px-3 py-1 rounded-full uppercase tracking-widest">
                      {selectedPlan.badge}
                    </span>
                  )}
                </div>
                <div className="text-3xl font-black mb-2 tracking-tight">{selectedPlan?.name || 'Gói Dịch Vụ'}</div>
                <div className="text-white/40 text-sm font-bold uppercase tracking-wider">Thanh toán theo {selectedPlan?.duration || 'tháng'}</div>
              </div>

              <div className="space-y-5 mb-10">
                <div className="flex justify-between text-sm font-bold">
                  <span className="opacity-40 uppercase tracking-widest">Tạm tính</span>
                  <span className="tracking-tight">₫{selectedPlan?.price || '0'}</span>
                </div>
                <div className="flex justify-between text-sm font-bold">
                  <span className="opacity-40 uppercase tracking-widest">Thuế (0%)</span>
                  <span className="tracking-tight">₫0</span>
                </div>
                <div className="h-px bg-white/10 my-6"></div>
                <div className="flex justify-between items-baseline">
                  <span className="text-lg font-black uppercase tracking-widest">Tổng cộng</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm opacity-40 font-bold">₫</span>
                    <span className="text-4xl font-black text-[#2563EB] tracking-tighter shadow-blue-500/20">{selectedPlan?.price || '0'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <div className="flex items-start gap-4 text-xs font-bold text-white/40">
                  <div className="w-6 h-6 bg-emerald-500/10 rounded-lg flex items-center justify-center shrink-0 text-emerald-400">
                    <Check className="w-4 h-4" />
                  </div>
                  <span>Kích hoạt ngay lập tức sau khi hoàn tất thanh toán.</span>
                </div>
                <div className="flex items-start gap-4 text-xs font-bold text-white/40">
                  <div className="w-6 h-6 bg-[#2563EB]/10 rounded-lg flex items-center justify-center shrink-0 text-[#2563EB]">
                    <Shield className="w-4 h-4" />
                  </div>
                  <span>Xử lý thanh toán được mã hóa SSL 256-bit an toàn.</span>
                </div>
              </div>

              {paymentData && (
                <div className="mt-12 pt-10 border-t border-white/5">
                  <button 
                    onClick={() => {
                      setStatus('cancel');
                      setPaymentData(null);
                    }}
                    className="w-full bg-white/5 text-white/60 py-5 rounded-[1.5rem] font-black hover:bg-red-500/10 hover:text-red-500 border border-white/5 transition-all flex items-center justify-center gap-3 group"
                  >
                    Hủy giao dịch
                    <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Status Notification Modal */}
        <AnimatePresence>
          {status && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 30 }}
                className="bg-white rounded-[3.5rem] p-12 max-w-md w-full shadow-2xl text-center space-y-8 border border-slate-100"
              >
                <div className={`w-24 h-24 mx-auto rounded-[2rem] flex items-center justify-center shadow-inner ${
                  status === 'success' ? 'bg-emerald-50 text-emerald-500 border-2 border-emerald-100' : 
                  status === 'cancel' ? 'bg-amber-50 text-amber-500 border-2 border-amber-100' : 
                  'bg-red-50 text-red-500 border-2 border-red-100'
                }`}>
                  {status === 'success' ? <Check className="w-12 h-12" /> : 
                   status === 'cancel' ? <AlertCircle className="w-12 h-12" /> : <X className="w-12 h-12" />}
                </div>

                <div className="space-y-3">
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                    {status === 'success' ? 'Thanh toán Thành công!' : 
                     status === 'cancel' ? 'Đã hủy Giao dịch' : 'Lỗi Thanh toán'}
                  </h3>
                  <p className="text-slate-500 font-medium px-4">
                    {status === 'success' ? 'Đăng ký của bạn đã được kích hoạt. Đang chuyển hướng về trang chủ...' : 
                     status === 'cancel' ? 'Bạn đã hủy yêu cầu thanh toán. Đang quay lại trang pricing...' : 
                     error || 'Đã có lỗi xảy ra. Đang quay lại trang pricing...'}
                  </p>
                </div>

                <div className="pt-4">
                  <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 4, ease: "linear" }}
                      className={`h-full ${
                        status === 'success' ? 'bg-emerald-500' : 
                        status === 'cancel' ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                    />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-16 text-center">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest opacity-60">
            Bằng việc hoàn tất thanh toán, bạn đồng ý với <Link to="/" className="underline hover:text-[#2563EB]">Điều khoản Dịch vụ</Link> và <Link to="/" className="underline hover:text-[#2563EB]">Chính sách Bảo mật</Link> của Signify AI.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
