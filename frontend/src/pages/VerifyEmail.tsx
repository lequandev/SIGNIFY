import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { CheckCircle, XCircle, Loader2, ArrowRight, Youtube } from 'lucide-react';

const VerifyEmail: React.FC = () => {
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
      } catch (err: any) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed. The link may be invalid or expired.');
      }
    };
    verifyToken();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0c1a] bg-grid p-6 overflow-hidden relative">
      {/* Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-[#3B82F6]/20 blur-[130px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-[#A855F7]/20 blur-[130px] rounded-full animate-pulse delay-1000" />

      <div className="w-full max-w-[480px] glass rounded-[2.5rem] p-10 shadow-2xl animate-slow-fade relative z-10 text-center">
        <Link to="/" className="inline-flex flex-col items-center group mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-[#3B82F6] to-[#A855F7] rounded-2xl mb-3 shadow-lg shadow-indigo-500/30 group-hover:rotate-6 transition-transform duration-500">
            <Youtube className="text-white w-8 h-8" />
          </div>
          <span className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 uppercase opacity-70 group-hover:opacity-100 transition-opacity">
            SIGNIFY
          </span>
        </Link>

        {status === 'loading' && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <Loader2 className="w-16 h-16 text-[#3B82F6] animate-spin" />
            </div>
            <h1 className="text-3xl font-black text-white">Verifying your email...</h1>
            <p className="text-gray-400 font-medium">Please wait while we secure your account.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6 animate-scale-up">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
            </div>
            <h1 className="text-3xl font-black text-white">Email Verified!</h1>
            <p className="text-gray-400 font-medium leading-relaxed">{message}</p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 w-full bg-gradient-to-r from-[#3B82F6] to-[#6366F1] text-white font-bold py-4 rounded-2xl hover:brightness-110 shadow-xl shadow-blue-500/30 transition-all active:scale-[0.98]"
            >
              Sign In to Your Account
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6 animate-shake">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center border border-red-500/30">
                <XCircle className="w-12 h-12 text-red-500" />
              </div>
            </div>
            <h1 className="text-3xl font-black text-white">Verification Failed</h1>
            <p className="text-red-400/80 font-medium leading-relaxed">{message}</p>
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 w-full bg-white/10 border border-white/20 text-white font-bold py-4 rounded-2xl hover:bg-white/20 transition-all"
            >
              Try Registering Again
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
