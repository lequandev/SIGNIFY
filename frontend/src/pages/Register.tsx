import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { GoogleLogin } from '@react-oauth/google';
import api from '../lib/api';
import { setLogin } from '../features/authSlice';
import { Users, Mail, Lock, User, ArrowRight, Github, Chrome, CheckCircle } from 'lucide-react';

const Register: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/users/google-login', {
        credential: credentialResponse.credential,
      });
      const { token, ...user } = response.data;
      
      localStorage.setItem('token', token);
      dispatch(setLogin({ user, token }));
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Google login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/users/register', { 
        fullName, 
        email, 
        password
      });
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans selection:bg-[#2563EB] selection:text-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 p-10 text-center"
        >
          <div className="flex justify-center mb-10">
            <div className="w-24 h-24 bg-emerald-50 rounded-[2rem] flex items-center justify-center border-2 border-emerald-100 shadow-inner">
              <CheckCircle className="w-12 h-12 text-emerald-500" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-6 tracking-tight">Xác minh Email</h1>
          <p className="text-slate-500 font-medium leading-relaxed mb-10 px-4">
            Chúng tôi đã gửi một liên kết xác minh đến <span className="text-[#2563EB] font-black">{email}</span>. 
            Vui lòng kiểm tra hộp thư của bạn để kích hoạt tài khoản.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-3 w-full bg-[#2563EB] text-white font-black py-5 rounded-2xl hover:bg-[#4F46E5] shadow-2xl shadow-[#2563EB]/30 transition-all active:scale-[0.98] group"
          >
            Đến trang đăng nhập
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans selection:bg-[#2563EB] selection:text-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100"
      >
        <div className="p-10">
          <div className="flex flex-col items-center mb-10">
            <Link to="/" className="flex items-center gap-2 mb-6 group">
              <div className="w-12 h-12 bg-[#2563EB] rounded-2xl flex items-center justify-center shadow-xl shadow-[#2563EB]/20 group-hover:scale-105 transition-transform">
                <img 
                  src="/logo_removebg.png" 
                  alt="Signify" 
                  className="w-8 h-8 object-contain brightness-0 invert" 
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement?.insertAdjacentHTML('beforeend', '<div class="text-white font-black text-xl">S</div>');
                  }}
                />
              </div>
              <span className="text-3xl font-black tracking-tight text-slate-900 uppercase">SIGNIFY</span>
            </Link>
            <h1 className="text-2xl font-black text-slate-900 mb-2">Create Account</h1>
            <p className="text-slate-500 text-sm font-medium">Join the Signify community today</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-500 p-4 rounded-2xl mb-8 text-sm font-bold text-center animate-pulse">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Full Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#2563EB] transition-colors" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-900 font-medium placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-[#2563EB]/10 focus:border-[#2563EB] transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#2563EB] transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-900 font-medium placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-[#2563EB]/10 focus:border-[#2563EB] transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#2563EB] transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-900 font-medium placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-[#2563EB]/10 focus:border-[#2563EB] transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2563EB] text-white py-4 rounded-2xl font-black hover:bg-[#4F46E5] transition-all shadow-2xl shadow-[#2563EB]/30 flex items-center justify-center gap-3 group active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Creating account...' : (
                <>
                  Create Account
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-black tracking-[0.2em] text-slate-400">
              <span className="bg-white px-4">OR SIGN UP WITH</span>
            </div>
          </div>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google Registration Failed')}
              theme="outline"
              shape="pill"
              size="large"
              width="360"
            />
          </div>

          <p className="text-center mt-10 text-sm font-medium text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-[#2563EB] font-black hover:text-[#4F46E5] underline-offset-4 decoration-[#2563EB]/20 underline">
              Log In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
