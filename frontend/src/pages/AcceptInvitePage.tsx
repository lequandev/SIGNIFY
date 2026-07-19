import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, CheckCircle, Loader2, Shield, XCircle } from 'lucide-react';
import { acceptBusinessInvitation } from '../services/businessService';
import { useToast } from '../context/ToastContext';

const AcceptInvitePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [status, setStatus] = useState<'auth' | 'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const hasCalled = useRef(false);
  const redirectPath = token ? `/accept-invite/${token}` : '/business';
  const authQuery = `?redirect=${encodeURIComponent(redirectPath)}`;

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Lời mời không hợp lệ.');
      return;
    }

    const authToken = localStorage.getItem('token');
    if (!authToken) {
      setStatus('auth');
      setMessage('Bạn cần đăng nhập bằng email được mời để nhận lời mời doanh nghiệp.');
      return;
    }

    if (hasCalled.current) return;
    hasCalled.current = true;

    const acceptInvitation = async () => {
      try {
        await acceptBusinessInvitation(token);
        setStatus('success');
        setMessage('Bạn đã tham gia doanh nghiệp thành công.');
        showToast('Đã nhận lời mời doanh nghiệp', 'success');
        setTimeout(() => navigate('/business'), 1200);
      } catch (error: any) {
        const msg = error?.response?.data?.message || 'Không thể nhận lời mời. Liên kết có thể không hợp lệ hoặc đã hết hạn.';
        setStatus('error');
        setMessage(msg);
        showToast(msg, 'error');
      }
    };

    acceptInvitation();
  }, [token, navigate, showToast]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 font-sans selection:bg-[#2563EB] selection:text-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 p-6 sm:p-8 md:p-10 text-center"
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
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Đang nhận lời mời...</h1>
            <p className="text-slate-500 font-medium px-6">Vui lòng đợi trong giây lát khi chúng tôi thêm bạn vào doanh nghiệp.</p>
          </div>
        )}

        {status === 'auth' && (
          <div className="space-y-8">
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-blue-50 rounded-[2rem] flex items-center justify-center border-2 border-blue-100 shadow-inner">
                <Shield className="w-12 h-12 text-[#2563EB]" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Đăng nhập để nhận lời mời</h1>
              <p className="text-slate-500 font-medium px-4 leading-relaxed">{message}</p>
              <p className="text-xs font-semibold text-slate-400 px-4 leading-relaxed">Nếu chưa có tài khoản, hãy đăng ký bằng đúng email nhận được lời mời.</p>
            </div>
            <div className="space-y-3">
              <Link
                to={`/login${authQuery}`}
                className="inline-flex items-center justify-center gap-3 w-full bg-[#2563EB] text-white font-black py-5 rounded-2xl hover:bg-[#4F46E5] shadow-2xl shadow-[#2563EB]/30 transition-all active:scale-[0.98] group"
              >
                Đăng nhập
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to={`/register${authQuery}`}
                className="inline-flex items-center justify-center gap-3 w-full bg-slate-50 border-2 border-slate-100 text-slate-600 font-black py-5 rounded-2xl hover:bg-slate-100 transition-all active:scale-[0.98]"
              >
                Chưa có tài khoản? Đăng ký
              </Link>
            </div>
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
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Tham gia thành công!</h1>
              <p className="text-slate-500 font-medium px-4 leading-relaxed">{message}</p>
            </div>
            <Link
              to="/business"
              className="inline-flex items-center justify-center gap-3 w-full bg-[#2563EB] text-white font-black py-5 rounded-2xl hover:bg-[#4F46E5] shadow-2xl shadow-[#2563EB]/30 transition-all active:scale-[0.98] group"
            >
              Xem doanh nghiệp
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
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Không thể nhận lời mời</h1>
              <p className="text-red-500/80 font-bold px-4 leading-relaxed">{message}</p>
            </div>
            <Link
              to="/business"
              className="inline-flex items-center justify-center gap-3 w-full bg-slate-50 border-2 border-slate-100 text-slate-600 font-black py-5 rounded-2xl hover:bg-slate-100 transition-all active:scale-[0.98]"
            >
              Về trang doanh nghiệp
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AcceptInvitePage;
