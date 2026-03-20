import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { GoogleLogin } from '@react-oauth/google';
import api from '../lib/api';
import { setLogin } from '../features/authSlice';
import { Mail, Lock, User, ArrowRight, Youtube, CheckCircle } from 'lucide-react';

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
      <div className="min-h-screen flex items-center justify-center bg-[#0a0c1a] bg-grid p-6 overflow-hidden relative">
        <div className="absolute top-[-10%] right-[-10%] w-[45%] h-[45%] bg-[#3B82F6]/25 blur-[130px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[45%] h-[45%] bg-[#A855F7]/25 blur-[130px] rounded-full animate-pulse delay-1000" />

        <div className="w-full max-w-[480px] glass rounded-[2.5rem] p-10 shadow-2xl animate-slow-fade relative z-10 text-center">
          <div className="flex justify-center mb-10">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          </div>
          <h1 className="text-4xl font-black text-white mb-6">Verify your email</h1>
          <p className="text-gray-400 font-medium leading-relaxed mb-10">
            We've sent a verification link to <span className="text-white font-bold">{email}</span>. 
            Please check your inbox and click the link to activate your account.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 w-full bg-gradient-to-r from-[#3B82F6] to-[#6366F1] text-white font-bold py-4 rounded-2xl hover:brightness-110 shadow-xl shadow-blue-500/30 transition-all active:scale-[0.98]"
          >
            Go to Login
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0c1a] bg-grid p-6 overflow-hidden relative">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[45%] h-[45%] bg-[#3B82F6]/25 blur-[130px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[45%] h-[45%] bg-[#A855F7]/25 blur-[130px] rounded-full animate-pulse delay-1000" />

      <div className="w-full max-w-[480px] glass rounded-[2.5rem] p-10 shadow-2xl animate-slow-fade relative z-10 my-8">
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex flex-col items-center group mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-[#A855F7] to-[#6366F1] rounded-2xl mb-3 shadow-lg shadow-purple-500/30 -rotate-3 group-hover:rotate-0 transition-transform duration-500">
              <Youtube className="text-white w-8 h-8" />
            </div>
            <span className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 uppercase opacity-70 group-hover:opacity-100 transition-opacity">
              SIGNIFY
            </span>
          </Link>
          <h1 className="text-4xl font-black text-white mb-3 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Join Signify
          </h1>
          <p className="text-gray-400 font-medium">Start your journey to accessible content</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl mb-8 text-sm font-medium flex items-center justify-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="group relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#3B82F6] w-5 h-5 transition-colors" />
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-white/10 border border-white/10 rounded-2xl px-12 py-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/50 focus:border-[#3B82F6]/50 transition-all font-medium"
              required
            />
          </div>

          <div className="group relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#6366F1] w-5 h-5 transition-colors" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/10 border border-white/10 rounded-2xl px-12 py-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50 focus:border-[#6366F1]/50 transition-all font-medium"
              required
            />
          </div>

          <div className="group relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#A855F7] w-5 h-5 transition-colors" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/10 border border-white/10 rounded-2xl px-12 py-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#A855F7]/50 focus:border-[#A855F7]/50 transition-all font-medium"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#3B82F6] via-[#6366F1] to-[#A855F7] hover:brightness-110 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-500/30 flex items-center justify-center gap-3 group transition-all active:scale-[0.98] mt-4"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
            {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <div className="mt-8 space-y-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#0d0f1a] text-gray-400 font-medium whitespace-nowrap">Or continue with</span>
            </div>
          </div>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google Login Failed')}
              theme="filled_blue"
              shape="pill"
              size="large"
              width="360"
            />
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-white/5 text-center">
          <p className="text-gray-500 font-medium">
            Already have an account?{' '}
            <Link to="/login" className="text-white font-bold hover:text-[#4F46E5] transition-colors underline underline-offset-4 decoration-[#4F46E5]/30">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
