import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  Mail,
  Lock,
  ArrowRight,
  User,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import api from "../services/api";
import { setLogin } from "../store/authSlice";

const AuthPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isSignIn, setIsSignIn] = useState(location.pathname !== "/register");

  useEffect(() => {
    setIsSignIn(location.pathname !== "/register");
  }, [location.pathname]);

  const toggleAuth = () => {
    const newPath = isSignIn ? "/register" : "/login";
    navigate(newPath);
  };

  // Form states
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    setError("");
    try {
      const response = await api.post("/users/google-login", {
        credential: credentialResponse.credential,
      });
      const { token, ...user } = response.data;

      localStorage.setItem("token", token);
      dispatch(setLogin({ user, token }));
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.message || "Google login failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await api.post("/users/login", {
        email: signInEmail,
        password: signInPassword,
      });
      const { token, ...user } = response.data;

      localStorage.setItem("token", token);
      dispatch(setLogin({ user, token }));
      navigate("/");
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Login failed. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/users/register", {
        fullName: signUpName,
        email: signUpEmail,
        password: signUpPassword,
      });
      setIsSuccess(true);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const springTransition = {
    type: "spring" as const,
    stiffness: 120,
    damping: 20,
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
          <h1 className="text-4xl font-black text-slate-900 mb-6">
            Verify your email
          </h1>
          <p className="text-slate-500 font-medium leading-relaxed mb-10">
            We've sent a verification link to{" "}
            <span className="text-slate-900 font-bold">{signUpEmail}</span>.
            Please check your inbox and click the link to activate your account.
          </p>
          <button
            onClick={() => {
              setIsSuccess(false);
              navigate("/login");
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
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 md:p-6 font-sans select-none overflow-hidden global-no-scrollbar">
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
      <div className="relative w-full max-w-[960px] h-[560px] bg-white rounded-[2.5rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden hidden md:flex border border-slate-100/50">
        {/* Sign Up Content (Right side when active) */}
        <motion.div
          animate={{
            x: isSignIn ? "0%" : "100%",
            opacity: isSignIn ? 0 : 1,
            zIndex: isSignIn ? 0 : 20,
          }}
          transition={springTransition}
          className="absolute top-0 left-0 w-1/2 h-full flex flex-col items-center justify-center bg-[#F3F4F6] px-8"
        >
          <div className="w-full max-w-[320px] flex flex-col justify-center">
            <motion.div
              initial={false}
              animate={{ opacity: isSignIn ? 0 : 1, y: isSignIn ? 20 : 0 }}
              transition={{ delay: 0.1 }}
              className="w-full space-y-3.5"
            >
              <div className="text-center">
                <h1 className="text-2xl font-extrabold text-slate-900 mb-0.5 tracking-tight">
                  Sign Up
                </h1>
                <p className="text-slate-500 text-xs font-medium leading-relaxed">
                  Create your account to start automating
                </p>
              </div>

              {!isSignIn && error && (
                <div className="bg-red-50 text-red-500 py-1.5 px-3 rounded-xl text-[11px] font-medium border border-red-100 text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleSignUp} className="space-y-3">
                <div className="space-y-0.5">
                  <label className="text-[9px] font-bold uppercase tracking-[0.25em] text-slate-400 ml-1">
                    FULL NAME
                  </label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#2563EB] transition-colors" />
                    <input
                      type="text"
                      value={signUpName}
                      onChange={(e) => setSignUpName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10 transition-all shadow-sm"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-0.5">
                  <label className="text-[9px] font-bold uppercase tracking-[0.25em] text-slate-400 ml-1">
                    EMAIL ADDRESS
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#2563EB] transition-colors" />
                    <input
                      type="email"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10 transition-all shadow-sm"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-0.5">
                  <label className="text-[9px] font-bold uppercase tracking-[0.25em] text-slate-400 ml-1">
                    PASSWORD
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#2563EB] transition-colors" />
                    <input
                      type="password"
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      placeholder="••••••"
                      className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10 transition-all shadow-sm"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-[#2563EB]/25 hover:shadow-xl hover:shadow-[#2563EB]/35 active:scale-[0.98] mt-1 cursor-pointer"
                >
                  {loading ? "Processing..." : "CREATE ACCOUNT"}
                </button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-[0.25em] text-slate-400">
                  <span className="bg-[#F3F4F6] px-3">Direct Auth</span>
                </div>
              </div>

              {/* CHỈNH SỬA: Bọc nút Google Desktop bằng wrapper div bo góc 2xl để đồng bộ hoàn toàn */}
              <div className="w-full max-w-[320px] mx-auto rounded-2xl overflow-hidden shadow-sm border border-slate-200/65 flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError("Google Login Failed")}
                  theme="outline"
                  size="large"
                  shape="rectangular"
                  width="320"
                />
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Sign In Content (Left side when active) */}
        <motion.div
          animate={{
            x: isSignIn ? "0%" : "-100%",
            opacity: isSignIn ? 1 : 0,
            zIndex: isSignIn ? 20 : 0,
          }}
          transition={springTransition}
          className="absolute top-0 left-0 w-1/2 h-full flex flex-col items-center justify-center bg-[#F3F4F6] px-8"
        >
          <div className="w-full max-w-[320px] flex flex-col justify-center">
            <motion.div
              initial={false}
              animate={{ opacity: isSignIn ? 1 : 0, y: isSignIn ? 0 : 20 }}
              transition={{ delay: 0.1 }}
              className="w-full space-y-3.5"
            >
              <div className="text-center">
                <h1 className="text-2xl font-extrabold text-slate-900 mb-0.5 tracking-tight">
                  Sign In
                </h1>
                <p className="text-slate-500 text-xs font-medium leading-relaxed">
                  Welcome back to the Signify ecosystem
                </p>
              </div>

              {isSignIn && error && (
                <div className="bg-red-50 text-red-500 py-1.5 px-3 rounded-xl text-[11px] font-medium border border-red-100 text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleSignIn} className="space-y-3">
                <div className="space-y-0.5">
                  <label className="text-[9px] font-bold uppercase tracking-[0.25em] text-slate-400 ml-1">
                    EMAIL ADDRESS
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#2563EB] transition-colors" />
                    <input
                      type="email"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10 transition-all shadow-sm"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[9px] font-bold uppercase tracking-[0.25em] text-slate-400">
                      PASSWORD
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-[10px] font-bold text-[#2563EB] hover:underline uppercase tracking-wider"
                    >
                      Forgot?
                    </Link>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#2563EB] transition-colors" />
                    <input
                      type="password"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      placeholder="••••••"
                      className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10 transition-all shadow-sm"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-[#2563EB]/25 hover:shadow-xl hover:shadow-[#2563EB]/35 active:scale-[0.98] mt-1 cursor-pointer"
                >
                  {loading ? "Processing..." : "SIGN IN"}
                </button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-[0.25em] text-slate-400">
                  <span className="bg-[#F3F4F6] px-3">Direct Auth</span>
                </div>
              </div>

              {/* CHỈNH SỬA: Bọc nút Google Desktop bằng wrapper div bo góc 2xl để đồng bộ hoàn toàn */}
              <div className="w-full max-w-[320px] mx-auto rounded-2xl overflow-hidden shadow-sm border border-slate-200/65 flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError("Google Login Failed")}
                  theme="outline"
                  size="large"
                  shape="rectangular"
                  width="320"
                />
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Sliding Overlay Container */}
        <motion.div
          animate={{
            x: isSignIn ? "100%" : "0%",
            borderRadius: isSignIn ? "0px 40px 40px 0px" : "40px 0px 0px 40px",
          }}
          transition={springTransition}
          className="absolute top-0 left-0 w-1/2 h-full z-[100] overflow-hidden"
        >
          <div className="relative h-full w-full bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#6D28D9] flex items-center justify-center overflow-hidden">
            <div className="absolute top-[-15%] right-[-10%] w-[450px] h-[450px] bg-white/5 rounded-full blur-[120px] animate-pulse animate-duration-5000" />
            <div className="absolute bottom-[-15%] left-[-10%] w-[450px] h-[450px] bg-indigo-500/10 rounded-full blur-[120px]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#6366F1]/5 rounded-full blur-[100px]" />

            <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-12">
              <AnimatePresence mode="wait">
                {isSignIn ? (
                  <motion.div
                    key="to-signup"
                    initial={{ opacity: 0, scale: 0.9, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 1.1, x: -20 }}
                    className="flex flex-col items-center w-full text-center"
                  >
                    <div className="w-16 h-16 bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] group overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <CheckCircle2 className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-xs font-bold text-indigo-200/85 uppercase tracking-[0.4em] mb-4">
                      START YOUR JOURNEY
                    </h2>
                    <h3 className="text-4xl font-extrabold text-white mb-4 leading-tight tracking-tight">
                      New platform?
                    </h3>
                    <p className="text-white/80 mb-8 text-sm font-medium leading-relaxed max-w-xs mx-auto">
                      Discover the future of automation with our next-gen AI
                      ecosystem.
                    </p>

                    <button
                      onClick={toggleAuth}
                      className="w-full max-w-[320px] py-4 bg-white hover:bg-slate-50 text-[#2563EB] rounded-2xl font-bold text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_15px_30px_rgba(0,0,0,0.2)] border border-slate-100 cursor-pointer"
                    >
                      REGISTER NOW
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="to-signin"
                    initial={{ opacity: 0, scale: 0.9, x: -20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 1.1, x: 20 }}
                    className="flex flex-col items-center w-full text-center"
                  >
                    <div className="w-16 h-16 bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] group overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <Lock className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-xs font-bold text-indigo-200/85 uppercase tracking-[0.4em] mb-4">
                      GLAD TO SEE YOU
                    </h2>
                    <h3 className="text-4xl font-extrabold text-white mb-4 leading-tight tracking-tight">
                      Back again?
                    </h3>
                    <p className="text-white/80 mb-8 text-sm font-medium leading-relaxed max-w-xs mx-auto">
                      Log in to access your dashboard and pick up right where
                      you left off.
                    </p>

                    <button
                      onClick={toggleAuth}
                      className="w-full max-w-[320px] py-4 bg-white hover:bg-slate-50 text-[#2563EB] rounded-2xl font-bold text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_15px_30px_rgba(0,0,0,0.2)] border border-slate-100 cursor-pointer"
                    >
                      LOGIN NOW
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
        <div className="bg-white rounded-[3rem] shadow-2xl p-8 border border-slate-100 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={isSignIn ? "signin" : "signup"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex flex-col items-center mb-8">
                <div className="w-14 h-14 bg-[#2563EB] rounded-[1.25rem] flex items-center justify-center mb-4 shadow-xl shadow-[#2563EB]/20">
                  {isSignIn ? (
                    <Lock className="text-white w-6 h-6" />
                  ) : (
                    <User className="text-white w-6 h-6" />
                  )}
                </div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                  SIGNIFY
                </h1>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                  {isSignIn ? "Member Authentication" : "Account Registration"}
                </p>
              </div>

              {error && (
                <div className="bg-red-50 text-red-500 p-3 rounded-xl mb-4 text-xs font-medium border border-red-100 text-center">
                  {error}
                </div>
              )}

              <form
                onSubmit={isSignIn ? handleSignIn : handleSignUp}
                className="space-y-4"
              >
                {!isSignIn && (
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                      FULL NAME
                    </label>
                    <input
                      type="text"
                      value={signUpName}
                      onChange={(e) => setSignUpName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-[#2563EB]/10 focus:border-[#2563EB] transition-all"
                      required
                    />
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                    EMAIL ADDRESS
                  </label>
                  <input
                    type="email"
                    value={isSignIn ? signInEmail : signUpEmail}
                    onChange={(e) =>
                      isSignIn
                        ? setSignInEmail(e.target.value)
                        : setSignUpEmail(e.target.value)
                    }
                    placeholder="you@example.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-[#2563EB]/10 focus:border-[#2563EB] transition-all"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                    PASSWORD
                  </label>
                  <input
                    type="password"
                    value={isSignIn ? signInPassword : signUpPassword}
                    onChange={(e) =>
                      isSignIn
                        ? setSignInPassword(e.target.value)
                        : setSignUpPassword(e.target.value)
                    }
                    placeholder="••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-[#2563EB]/10 focus:border-[#2563EB] transition-all"
                    required
                  />
                </div>
                <button
                  disabled={loading}
                  className="w-full bg-[#2563EB] text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-[#2563EB]/25 mt-4 hover:bg-[#1D4ED8] active:scale-[0.98] transition-all"
                >
                  {loading
                    ? "Processing..."
                    : isSignIn
                      ? "SIGN IN"
                      : "CREATE ACCOUNT"}
                </button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-[9px] uppercase font-bold tracking-[0.2em] text-slate-400">
                  <span className="bg-white px-3">Direct Auth</span>
                </div>
              </div>

              {/* CHỈNH SỬA: Thay thế shape="pill" cũ bằng wrapper div và ép nút Google Mobile dùng shape="rectangular" để bo tròn chuẩn 2xl */}
              <div className="w-full rounded-2xl overflow-hidden shadow-sm border border-slate-200/65 flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError("Google Login Failed")}
                  theme="outline"
                  size="large"
                  shape="rectangular"
                  width="320"
                />
              </div>

              <div className="mt-8 text-center">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">
                  {isSignIn ? "Don't have an account?" : "Already a member?"}
                </p>
                <button
                  onClick={toggleAuth}
                  className="text-[#2563EB] font-bold text-xs uppercase tracking-widest hover:opacity-80 transition-opacity"
                >
                  {isSignIn ? "Switch to Sign Up" : "Switch to Sign In"}
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
