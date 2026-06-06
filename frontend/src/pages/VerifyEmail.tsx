import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { CheckCircle, XCircle, Loader2, ArrowRight, Youtube } from 'lucide-react';
import { motion } from 'motion/react';
import { useToast } from '../context/ToastContext';

const VerifyEmail: React.FC = () => {
  const { showToast } = useToast();
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  const hasCalled = React.useRef(false);

  useEffect(() => {
    if (hasCalled.current) return;
    hasCalled.current = true;

    const verifyToken = async () => {
      try {
        const response = await api.get(`/users/verify/${token}`);
        setStatus('success');
        setMessage(response.data.message);
        showToast('Email verified successfully!', 'success');
      } catch (err: any) {
        setStatus('error');
        const msg = err.response?.data?.message || 'Verification failed. The link may be invalid or expired.';
        setMessage(msg);
        showToast(msg, 'error');
      }
    };
    verifyToken();
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans selection:bg-[#2563EB] selection:text-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 p-10 text-center"
      >
        <Link to="/" className="flex flex-col items-center mb-10 group">
          <img 
            src="/logo_removebg.png" 
            alt="Signify Logo" 
            className="h-20 object-contain group-hover:scale-105 transition-transform mb-4"
          />
        </Link>

        {status === 'loading' && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <Loader2 className="w-16 h-16 text-[#2563EB] animate-spin" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Xác minh tài khoản...</h1>
            <p className="text-slate-500 font-medium px-6">Vui lòng đợi trong giây lát khi chúng tôi bảo mật tài khoản của bạn.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-8 animate-scale-up">
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-emerald-50 rounded-[2rem] flex items-center justify-center border-2 border-emerald-100 shadow-inner">
                <CheckCircle className="w-12 h-12 text-emerald-500" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Xác minh thành công!</h1>
              <p className="text-slate-500 font-medium px-4 leading-relaxed">{message}</p>
            </div>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-3 w-full bg-[#2563EB] text-white font-black py-5 rounded-2xl hover:bg-[#4F46E5] shadow-2xl shadow-[#2563EB]/30 transition-all active:scale-[0.98] group"
            >
              Đăng nhập ngay
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-8 animate-shake">
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-red-50 rounded-[2rem] flex items-center justify-center border-2 border-red-100 shadow-inner">
                <XCircle className="w-12 h-12 text-red-500" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Xác minh lỗi</h1>
              <p className="text-red-500/80 font-bold px-4 leading-relaxed">{message}</p>
            </div>
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-3 w-full bg-slate-50 border-2 border-slate-100 text-slate-600 font-black py-5 rounded-2xl hover:bg-slate-100 transition-all active:scale-[0.98]"
            >
              Thử đăng ký lại
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
