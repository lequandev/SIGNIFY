import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { GoogleLogin } from '@react-oauth/google';
import api from '../lib/api';
import { setLogin } from '../features/authSlice';
import { Users, Mail, Lock, ArrowRight, Github, Chrome } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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
      const response = await api.post('/users/login', { email, password });
      const { token, ...user } = response.data;
      
      localStorage.setItem('token', token);
      dispatch(setLogin({ user, token }));
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans selection:bg-[#2563EB] selection:text-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
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
            <h1 className="text-2xl font-black text-slate-900 mb-2">Welcome Back</h1>
            <p className="text-slate-500 text-sm font-medium">Log in to your Signify account</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-500 p-4 rounded-2xl mb-8 text-sm font-bold text-center animate-pulse">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
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
              <div className="flex items-center justify-between ml-1">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Password</label>
                <Link to="/forgot-password" title="Forgot Password?" className="text-[10px] font-black uppercase tracking-wider text-[#2563EB] hover:text-[#4F46E5] transition-colors">
                  Forgot?
                </Link>
              </div>
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
              {loading ? 'Processing...' : (
                <>
                  Log In
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
              <span className="bg-white px-4">OR CONTINUE WITH</span>
            </div>
          </div>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google Login Failed')}
              theme="outline"
              shape="pill"
              size="large"
              width="360"
            />
          </div>

          <p className="text-center mt-10 text-sm font-medium text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#2563EB] font-black hover:text-[#4F46E5] underline-offset-4 decoration-[#2563EB]/20 underline">
              Sign Up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
