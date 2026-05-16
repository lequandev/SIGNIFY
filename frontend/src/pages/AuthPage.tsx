import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Mail, Lock, ArrowRight, Github, Chrome, User, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import api from '../services/api';
import { setLogin } from '../store/authSlice';

const AuthPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isSignIn, setIsSignIn] = useState(location.pathname !== '/register');

  useEffect(() => {
    setIsSignIn(location.pathname !== '/register');
  }, [location.pathname]);

  const toggleAuth = () => {
    const newPath = isSignIn ? '/register' : '/login';
    navigate(newPath);
  };

  // Form states
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/users/login', { email: signInEmail, password: signInPassword });
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/users/register', { 
        fullName: signUpName, 
        email: signUpEmail, 
        password: signUpPassword
      });
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const springTransition = {
    type: "spring" as const,
    stiffness: 120,
    damping: 20
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 font-sans overflow-hidden">
        <div className="w-full max-w-[480px] bg-white rounded-[2.5rem] p-10 shadow-2xl text-center border border-slate-100">
          <div className="flex justify-center mb-10">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30">
              <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            </div>
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-6">Verify your email</h1>
          <p className="text-slate-500 font-medium leading-relaxed mb-10">
            We've sent a verification link to <span className="text-slate-900 font-bold">{signUpEmail}</span>. 
            Please check your inbox and click the link to activate your account.
          </p>
          <button
            onClick={() => {
              setIsSuccess(false);
              navigate('/login');
            }}
            className="inline-flex items-center justify-center gap-2 w-full bg-[#2563EB] text-white font-bold py-4 rounded-2xl hover:bg-[#1E40AF] shadow-xl shadow-[#2563EB]/20 transition-all active:scale-[0.98]"
          >
            Go to Login
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 font-sans overflow-hidden select-none">
      {/* Absolute Back Link */}
      <Link 
        to="/" 
        className="fixed top-8 left-8 z-[200] flex items-center gap-2 text-slate-400 hover:text-[#2563EB] transition-all font-bold text-xs uppercase tracking-widest group"
      >
        <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 group-hover:border-[#2563EB]/30 transition-all">
          <ArrowLeft className="w-4 h-4" />
        </div>
        Back to Home
      </Link>

      {/* Main Desktop Container */}
      <div className="relative w-full max-w-[960px] h-[600px] bg-white rounded-[2.5rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden hidden md:flex border border-slate-100/50">
        
        {/* Sign Up Content (Left side, only visible when sliding) */}
        <motion.div 
          animate={{ 
            x: isSignIn ? '0%' : '100%',
            opacity: isSignIn ? 0 : 1,
            zIndex: isSignIn ? 0 : 20
          }}
          transition={springTransition}
          className="absolute top-0 left-0 w-1/2 h-full px-12 lg:px-16 flex flex-col justify-center bg-white"
        >
          <div className="w-full max-w-sm mx-auto">
            <motion.div
              initial={false}
              animate={{ opacity: isSignIn ? 0 : 1, y: isSignIn ? 20 : 0 }}
              transition={{ delay: 0.1 }}
            >
              <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Sign Up</h1>
              <p className="text-slate-400 mb-6 text-sm font-medium">Create your account to start automating</p>
              
              {!isSignIn && error && (
                <div className="bg-red-50 text-red-500 p-3 rounded-xl mb-6 text-xs font-medium border border-red-100">
                  {error}
                </div>
              )}

              <form onSubmit={handleSignUp} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-[#2563EB] transition-colors" />
                    <input
                      type="text"
                      value={signUpName}
                      onChange={(e) => setSignUpName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl py-3 pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-[#2563EB]/10 focus:border-[#2563EB] transition-all"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-[#2563EB] transition-colors" />
                    <input
                      type="email"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl py-3 pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-[#2563EB]/10 focus:border-[#2563EB] transition-all"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-[#2563EB] transition-colors" />
                    <input
                      type="password"
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl py-3 pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-[#2563EB]/10 focus:border-[#2563EB] transition-all"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-[#2563EB] text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-[#1E40AF] transition-all shadow-xl shadow-[#2563EB]/25 active:scale-[0.98]"
                >
                  {loading ? 'Processing...' : 'Create Account'}
                </button>
              </form>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                <div className="relative flex justify-center text-[10px] uppercase font-black tracking-[0.3em] text-slate-300"><span className="bg-white px-6">Direct Auth</span></div>
              </div>

              <div className="flex justify-center w-full">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google Login Failed')}
                  theme="outline"
                  size="large"
                  shape="pill"
                  width="100%"
                />
              </div>

            </motion.div>
          </div>
        </motion.div>

        {/* Sign In Content (Left side, primary) */}
        <motion.div 
          animate={{ 
            x: isSignIn ? '0%' : '-100%',
            opacity: isSignIn ? 1 : 0,
            zIndex: isSignIn ? 20 : 0
          }}
          transition={springTransition}
          className="absolute top-0 left-0 w-1/2 h-full px-12 lg:px-16 flex flex-col justify-center bg-white"
        >
          <div className="w-full max-w-sm mx-auto">
            <motion.div
              initial={false}
              animate={{ opacity: isSignIn ? 1 : 0, y: isSignIn ? 0 : 20 }}
              transition={{ delay: 0.1 }}
            >
              <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Sign In</h1>
              <p className="text-slate-400 mb-6 text-sm font-medium">Welcome back to the Signify ecosystem</p>
              
              {isSignIn && error && (
                <div className="bg-red-50 text-red-500 p-3 rounded-xl mb-6 text-xs font-medium border border-red-100">
                  {error}
                </div>
              )}

              <form onSubmit={handleSignIn} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-[#2563EB] transition-colors" />
                    <input
                      type="email"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl py-3 pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-[#2563EB]/10 focus:border-[#2563EB] transition-all"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Password</label>
                    <Link to="/forgot-password" className="text-[10px] font-bold text-[#2563EB] hover:underline uppercase tracking-wider">Forgot?</Link>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-[#2563EB] transition-colors" />
                    <input
                      type="password"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl py-3 pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-[#2563EB]/10 focus:border-[#2563EB] transition-all"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-[#2563EB] text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-[#1E40AF] transition-all shadow-xl shadow-[#2563EB]/25 active:scale-[0.98]"
                >
                  {loading ? 'Processing...' : 'Continue'}
                </button>
              </form>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                <div className="relative flex justify-center text-[10px] uppercase font-black tracking-[0.3em] text-slate-300"><span className="bg-white px-6">Direct Auth</span></div>
              </div>

              <div className="flex justify-center w-full">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google Login Failed')}
                  theme="outline"
                  size="large"
                  shape="pill"
                  width="100%"
                />
              </div>

            </motion.div>
          </div>
        </motion.div>

        {/* Sliding Overlay Container */}
        <motion.div 
          animate={{ x: isSignIn ? '100%' : '0%' }}
          transition={springTransition}
          className="absolute top-0 left-0 w-1/2 h-full z-[100] overflow-hidden"
        >
          {/* Background Gradient & Animated Orbs */}
          <div className="relative h-full w-full bg-gradient-to-br from-[#2563EB] via-[#4F46E5] to-[#9333EA] flex items-center justify-center overflow-hidden">
            {/* Animated Orbs */}
            <div className="absolute top-[-15%] right-[-10%] w-[450px] h-[450px] bg-white/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-15%] left-[-10%] w-[450px] h-[450px] bg-indigo-400/30 rounded-full blur-[120px]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#6366F1]/10 rounded-full blur-[100px]" />

            <div className="relative z-10 w-full h-full flex items-center justify-center">
              <AnimatePresence mode="wait">
                {isSignIn ? (
                   <motion.div 
                    key="to-signup"
                    initial={{ opacity: 0, scale: 0.9, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 1.1, x: -20 }}
                    className="text-center px-16"
                  >
                    <div className="w-20 h-20 bg-white/10 border border-white/20 backdrop-blur-3xl rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-[0_20px_50px_rgba(0,0,0,0.2)] overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <CheckCircle2 className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-[10px] font-black text-white/60 uppercase tracking-[0.5em] mb-4">Start Your Journey</h2>
                    <h3 className="text-4xl font-black text-white mb-4 leading-tight tracking-tight">New platform?</h3>
                    <p className="text-white/80 mb-10 text-sm font-medium leading-relaxed max-w-xs mx-auto">Discover the future of automation with our next-gen AI ecosystem.</p>
                    <button 
                      onClick={toggleAuth}
                      className="px-12 py-4 bg-white text-[#2563EB] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-[0_20px_40px_rgba(0,0,0,0.15)] hover:translate-y-[-2px] active:scale-[0.98]"
                    >
                      Create Account
                    </button>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="to-signin"
                    initial={{ opacity: 0, scale: 0.9, x: -20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 1.1, x: 20 }}
                    className="text-center px-16"
                  >
                    <div className="w-20 h-20 bg-white/10 border border-white/20 backdrop-blur-3xl rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-[0_20px_50px_rgba(0,0,0,0.2)] group">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <Lock className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-[10px] font-black text-white/60 uppercase tracking-[0.5em] mb-4">Glad to see you</h2>
                    <h3 className="text-4xl font-black text-white mb-4 leading-tight tracking-tight">Back again?</h3>
                    <p className="text-white/80 mb-10 text-sm font-medium leading-relaxed max-w-xs mx-auto">Log in to access your dashboard and pick up right where you left off.</p>
                    <button 
                      onClick={toggleAuth}
                      className="px-12 py-4 bg-white text-[#4F46E5] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-[0_20px_40px_rgba(0,0,0,0.15)] hover:translate-y-[-2px] active:scale-[0.98]"
                    >
                      Login Now
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Mobile Version (Simplified Smooth Slide) */}
      <div className="md:hidden w-full max-w-sm">
        <div className="bg-white rounded-[3rem] shadow-2xl p-10 border border-slate-100 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={isSignIn ? 'signin' : 'signup'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex flex-col items-center mb-10">
                <div className="w-16 h-16 bg-[#2563EB] rounded-[1.5rem] flex items-center justify-center mb-6 shadow-2xl shadow-[#2563EB]/30">
                  {isSignIn ? <Lock className="text-white w-8 h-8" /> : <User className="text-white w-8 h-8" />}
                </div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">SIGNIFY</h1>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">
                  {isSignIn ? 'Member Authentication' : 'Account Registration'}
                </p>
              </div>

              {error && (
                <div className="bg-red-50 text-red-500 p-3 rounded-xl mb-6 text-xs font-medium border border-red-100 text-center">
                  {error}
                </div>
              )}

              <form onSubmit={isSignIn ? handleSignIn : handleSignUp} className="space-y-4">
                {!isSignIn && (
                  <input
                    type="text"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-[#2563EB]/10 transition-all"
                    required
                  />
                )}
                <input
                  type="email"
                  value={isSignIn ? signInEmail : signUpEmail}
                  onChange={(e) => isSignIn ? setSignInEmail(e.target.value) : setSignUpEmail(e.target.value)}
                  placeholder="Email Address"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-[#2563EB]/10 transition-all"
                  required
                />
                <input
                  type="password"
                  value={isSignIn ? signInPassword : signUpPassword}
                  onChange={(e) => isSignIn ? setSignInPassword(e.target.value) : setSignUpPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-[#2563EB]/10 transition-all"
                  required
                />
                <button 
                  disabled={loading}
                  className="w-full bg-[#2563EB] text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#2563EB]/25 mt-4"
                >
                  {loading ? 'Processing...' : (isSignIn ? 'Sign In' : 'Create Account')}
                </button>
              </form>

              <div className="mt-8 text-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google Login Failed')}
                  theme="outline"
                  shape="pill"
                />
              </div>

              <div className="mt-10 text-center">
                <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-3">
                  {isSignIn ? "Don't have an account?" : "Already member?"}
                </p>
                <button 
                  onClick={toggleAuth} 
                  className="text-[#2563EB] font-black text-xs uppercase tracking-[0.2em] hover:opacity-80 transition-opacity"
                >
                  {isSignIn ? 'Switch to Sign Up' : 'Switch to Sign In'}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
