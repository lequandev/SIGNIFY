import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { GoogleLogin } from '@react-oauth/google';
import { CheckCircle2, Shield, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';
import { setLogin } from '../store/authSlice';
import { useToast } from '../context/ToastContext';

const AuthPage = () => {
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const searchParams = new URLSearchParams(location.search);
  const rawRedirect = searchParams.get('redirect');
  const redirectPath = rawRedirect && rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '';
  const redirectQuery = redirectPath ? `?redirect=${encodeURIComponent(redirectPath)}` : '';
  const isInviteRedirect = redirectPath.startsWith('/accept-invite/');
  const navigateAfterAuth = (user: any) => {
    if (isInviteRedirect) {
      localStorage.removeItem('pendingInviteRedirect');
    }
    navigate(redirectPath || (user.role === 'ADMIN' ? '/admin' : '/'));
  };

  const [isSignIn, setIsSignIn] = useState(location.pathname !== '/register');

  useEffect(() => {
    setIsSignIn(location.pathname !== '/register');
  }, [location.pathname]);

  useEffect(() => {
    if (isInviteRedirect) {
      localStorage.setItem('pendingInviteRedirect', redirectPath);
    }
  }, [isInviteRedirect, redirectPath]);

  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

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
      showToast('Chào mừng trở lại, ' + user.fullName + '!', 'success');
      navigateAfterAuth(user);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Đăng nhập Google thất bại.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/users/login', {
        email: signInEmail,
        password: signInPassword,
      });
      const { token, ...user } = response.data;
      localStorage.setItem('token', token);
      dispatch(setLogin({ user, token }));
      showToast('Đăng nhập thành công!', 'success');
      navigateAfterAuth(user);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra thông tin đăng nhập.';
      setError(msg);
      showToast(msg, 'error');
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
        password: signUpPassword,
      });
      setIsSuccess(true);
      showToast('Đăng ký thành công! Vui lòng kiểm tra email của bạn.', 'success');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-slate-50 font-sans overflow-y-auto">
        <div className="w-full max-w-[400px] bg-white border border-slate-200 rounded-3xl shadow-xl p-6 sm:p-8 text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Xác minh Email</h1>
          <p className="text-slate-500 text-sm mb-6">
            Chúng tôi đã gửi liên kết xác minh đến <strong className="text-primary">{signUpEmail}</strong>. Vui lòng kiểm tra hộp thư của bạn.
          </p>
          <button
            onClick={() => { setIsSuccess(false); navigate(`/login${redirectQuery}`); }}
            className="w-full py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
          >
            Đến trang đăng nhập
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full font-sans bg-slate-50 selection:bg-primary/20 selection:text-primary lg:overflow-hidden">

      {/* Left Section - Dark Blue Visual (Desktop Only) */}
      <div className="hidden lg:flex lg:w-[55%] bg-[#0a101f] flex-col justify-between p-10 relative overflow-hidden min-h-screen">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img src="/a.png" alt="Signify Authentication" className="w-full h-full object-contain opacity-90" />
        </div>

        {/* Background Gradients */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] z-0" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] z-0" />

        {/* Top: Logo */}
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity w-fit">
            <img src="/logo_removebg.png" alt="Signify Logo" className="h-10 brightness-0 invert" />
          </Link>
        </div>

      </div>

      {/* Right Section - Form Container */}
      <div className="w-full lg:w-[45%] flex flex-col min-h-screen relative">

        {/* Top Right Contact Support (Desktop) */}
        <div className="hidden lg:flex absolute top-6 right-8">
          <Link to="#" className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors">
            Hỗ trợ
          </Link>
        </div>

        {/* Mobile Header */}
        <div className="lg:hidden p-4 flex justify-between items-center bg-white border-b border-slate-100 shrink-0">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo_removebg.png" alt="Signify Logo" className="h-5" />
            <span className="font-bold text-base text-slate-900">Signify</span>
          </Link>
          <Link to="#" className="text-xs font-semibold text-slate-500">
            Hỗ trợ
          </Link>
        </div>

        {/* Center: The White Card */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8 min-h-0 overflow-y-auto">
          <div className="w-full max-w-[550px] bg-white rounded-3xl shadow-[0_4px_24px_rgb(0,0,0,0.03)] border border-slate-100 p-6 sm:px-10 sm:py-9">

            <AnimatePresence mode="wait">
              <motion.div
                key={isSignIn ? 'login' : 'register'}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
              >
                <div className="text-center mb-5">
                  <h2 className="text-2xl font-extrabold text-slate-900 mb-1">
                    {isSignIn ? "Đăng nhập vào Signify" : "Tạo tài khoản"}
                  </h2>
                  <p className="text-slate-500 text-xs">
                    {isSignIn ? "Chào mừng trở lại! Vui lòng nhập thông tin của bạn." : "Nhập thông tin bên dưới để bắt đầu."}
                  </p>
                </div>

                {isInviteRedirect && (
                  <div className="mb-4 p-3 bg-primary/5 text-primary rounded-lg text-xs border border-primary/15 flex items-start gap-2">
                    <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">Bạn đang mở lời mời doanh nghiệp. Hãy đăng nhập bằng email được mời, hoặc đăng ký nếu chưa có tài khoản Signify.</span>
                  </div>
                )}

                {error && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-xs border border-red-100 flex items-start gap-2">
                    <span className="material-symbols-outlined text-red-500 text-base leading-none">error</span>
                    <span className="leading-tight">{error}</span>
                  </div>
                )}

                <div className="mb-4">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError('Đăng nhập Google thất bại')}
                    theme="outline"
                    size="large"
                    text={isSignIn ? "signin_with" : "signup_with"}
                    shape="rectangular"
                    width="100%"
                    logo_alignment="center"
                  />
                </div>

                <div className="relative mb-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-3 bg-white text-slate-400 font-medium">or</span>
                  </div>
                </div>

                <form onSubmit={isSignIn ? handleSignIn : handleSignUp} className="space-y-3.5">
                  {!isSignIn && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Họ và tên</label>
                      <input
                        type="text"
                        value={signUpName}
                        onChange={(e) => setSignUpName(e.target.value)}
                        placeholder="Nguyễn Văn A"
                        required
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Địa chỉ email</label>
                    <input
                      type="email"
                      value={isSignIn ? signInEmail : signUpEmail}
                      onChange={(e) => isSignIn ? setSignInEmail(e.target.value) : setSignUpEmail(e.target.value)}
                      placeholder="email@example.com"
                      required
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mật khẩu</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={isSignIn ? signInPassword : signUpPassword}
                        onChange={(e) => isSignIn ? setSignInPassword(e.target.value) : setSignUpPassword(e.target.value)}
                        placeholder="Nhập mật khẩu"
                        required
                        className="w-full bg-white border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {isSignIn && (
                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div className="relative flex items-center justify-center w-3.5 h-3.5">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="peer appearance-none w-3.5 h-3.5 border border-slate-300 rounded-[4px] cursor-pointer checked:bg-primary checked:border-primary transition-colors focus:ring-2 focus:ring-primary/20 focus:outline-none"
                          />
                          <svg className="absolute w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 14 10" fill="none">
                            <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">Ghi nhớ đăng nhập</span>
                      </label>
                      <Link to="/forgot-password" className="text-xs font-bold text-primary hover:text-primary-container transition-colors">
                        Quên mật khẩu?
                      </Link>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-all shadow-md shadow-primary/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {loading ? 'Đang xử lý...' : (isSignIn ? 'Đăng nhập' : 'Tạo tài khoản')}
                  </button>
                </form>
              </motion.div>
            </AnimatePresence>

            <div className="mt-5 text-center text-xs font-semibold text-slate-500">
              {isSignIn ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
              <button
                onClick={() => navigate(`${isSignIn ? '/register' : '/login'}${redirectQuery}`)}
                className="font-bold text-primary hover:text-primary-container transition-colors"
              >
                {isSignIn ? 'Đăng ký' : 'Đăng nhập'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
