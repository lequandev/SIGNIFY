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
  Sparkles,
  HandMetal,
} from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import api from "../services/api";
import { setLogin } from "../store/authSlice";
import { useToast } from "../context/ToastContext";

// ─── Shared design tokens (mirrors LandingPage) ───────────────────────────────

const AuthStyles: React.FC = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&family=Poppins:wght@400;500;600;700;800&display=swap');

    .auth-root {
      font-family: 'Open Sans', system-ui, sans-serif;
      min-height: 100vh;
      background: linear-gradient(155deg, #f0f9ff 0%, #eff6ff 40%, #f0f9ff 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      overflow: hidden;
      position: relative;
    }

    /* Background orbs */
    .auth-orb {
      position: absolute;
      border-radius: 50%;
      pointer-events: none;
      filter: blur(80px);
    }
    .auth-orb-1 {
      top: -8%;
      left: -6%;
      width: 420px; height: 420px;
      background: radial-gradient(circle, rgba(37,99,235,0.14) 0%, transparent 70%);
    }
    .auth-orb-2 {
      bottom: -8%;
      right: -6%;
      width: 360px; height: 360px;
      background: radial-gradient(circle, rgba(29,78,216,0.12) 0%, transparent 70%);
    }

    /* Back link */
    .auth-back {
      position: fixed;
      top: 1.75rem;
      left: 1.75rem;
      z-index: 200;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #3b82f6;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      text-decoration: none;
      transition: color 200ms ease;
    }
    .auth-back:hover { color: #2563EB; }
    .auth-back-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 34px; height: 34px;
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(37,99,235,0.15);
      border-radius: 10px;
      transition: border-color 200ms ease, box-shadow 200ms ease;
    }
    .auth-back:hover .auth-back-icon {
      border-color: rgba(37,99,235,0.4);
      box-shadow: 0 4px 16px rgba(37,99,235,0.15);
    }

    /* ── Desktop container ── */
    .auth-card {
      position: relative;
      width: 100%;
      max-width: 900px;
      height: 560px;
      background: rgba(255,255,255,0.92);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-radius: 28px;
      border: 1px solid rgba(37,99,235,0.12);
      box-shadow: 0 40px 100px rgba(37,99,235,0.15), 0 0 0 1px rgba(255,255,255,0.6) inset;
      overflow: hidden;
      display: none;
    }
    @media (min-width: 768px) { .auth-card { display: flex; } }

    /* Form panel */
    .auth-panel {
      position: absolute;
      top: 0; left: 0;
      width: 50%; height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: rgba(238,242,255,0.6);
      padding: 2.5rem 2rem;
    }
    .auth-panel-inner {
      width: 100%;
      max-width: 300px;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    /* Overlay panel */
    .auth-overlay {
      position: absolute;
      top: 0; left: 0;
      width: 50%; height: 100%;
      z-index: 100;
      overflow: hidden;
    }
    .auth-overlay-inner {
      position: relative;
      width: 100%; height: 100%;
      background: linear-gradient(135deg, #1e3a8a 0%, #1e3a8a 40%, #2563EB 70%, #1D4ED8 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .auth-overlay-orb-1 {
      position: absolute;
      top: -15%; right: -10%;
      width: 300px; height: 300px;
      background: rgba(255,255,255,0.06);
      border-radius: 50%;
      filter: blur(60px);
      animation: authPulse 5s ease-in-out infinite;
    }
    .auth-overlay-orb-2 {
      position: absolute;
      bottom: -15%; left: -10%;
      width: 300px; height: 300px;
      background: rgba(37,99,235,0.15);
      border-radius: 50%;
      filter: blur(60px);
    }
    .auth-overlay-grid {
      position: absolute;
      inset: 0;
      background-image: radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px);
      background-size: 24px 24px;
    }
    @keyframes authPulse {
      0%, 100% { opacity: 0.5; transform: scale(0.95); }
      50% { opacity: 1; transform: scale(1.05); }
    }
    .auth-overlay-content {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 2.5rem;
      width: 100%;
    }
    .auth-overlay-icon {
      width: 60px; height: 60px;
      background: rgba(255,255,255,0.10);
      border: 1px solid rgba(255,255,255,0.18);
      backdrop-filter: blur(12px);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.5rem;
      box-shadow: inset 0 1px 1px rgba(255,255,255,0.3);
    }
    .auth-overlay-eyebrow {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.35em;
      color: rgba(191,219,254,0.8);
      margin-bottom: 0.75rem;
    }
    .auth-overlay-title {
      font-family: 'Poppins', sans-serif;
      font-size: 2rem;
      font-weight: 800;
      color: #ffffff;
      line-height: 1.15;
      letter-spacing: -0.025em;
      margin-bottom: 0.875rem;
    }
    .auth-overlay-desc {
      font-size: 0.8125rem;
      color: rgba(255,255,255,0.75);
      line-height: 1.7;
      max-width: 240px;
      margin-bottom: 2rem;
    }
    .auth-overlay-btn {
      width: 100%;
      max-width: 260px;
      padding: 0.875rem 1.5rem;
      background: #ffffff;
      color: #2563EB;
      font-family: 'Poppins', sans-serif;
      font-size: 0.8125rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      border-radius: 14px;
      border: none;
      cursor: pointer;
      box-shadow: 0 12px 32px rgba(0,0,0,0.2);
      transition: background 180ms ease, transform 180ms ease, box-shadow 180ms ease;
    }
    .auth-overlay-btn:hover {
      background: #eff6ff;
      transform: translateY(-2px);
      box-shadow: 0 18px 40px rgba(0,0,0,0.25);
    }

    /* ── Form elements ── */
    .auth-section-title {
      text-align: center;
    }
    .auth-heading {
      font-family: 'Poppins', sans-serif;
      font-size: 1.375rem;
      font-weight: 700;
      color: #1e3a8a;
      margin: 0 0 0.25rem;
      letter-spacing: -0.02em;
    }
    .auth-subheading {
      font-size: 0.78rem;
      color: #3b82f6;
      opacity: 0.8;
      margin: 0;
    }

    .auth-field-label {
      display: block;
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      color: #3b82f6;
      opacity: 0.7;
      margin-bottom: 0.35rem;
      margin-left: 0.25rem;
    }
    .auth-field-wrap {
      position: relative;
    }
    .auth-field-icon {
      position: absolute;
      left: 0.875rem;
      top: 50%;
      transform: translateY(-50%);
      color: #93c5fd;
      transition: color 200ms ease;
      width: 16px; height: 16px;
      pointer-events: none;
    }
    .auth-field-wrap:focus-within .auth-field-icon { color: #2563EB; }
    .auth-input {
      width: 100%;
      background: rgba(255,255,255,0.85);
      border: 1px solid rgba(37,99,235,0.15);
      border-radius: 12px;
      padding: 0.625rem 0.875rem 0.625rem 2.5rem;
      font-size: 0.875rem;
      color: #1e3a8a;
      font-family: 'Open Sans', sans-serif;
      outline: none;
      transition: border-color 200ms ease, box-shadow 200ms ease;
      box-shadow: 0 1px 4px rgba(37,99,235,0.06);
      box-sizing: border-box;
    }
    .auth-input::placeholder { color: #93c5fd; }
    .auth-input:focus {
      border-color: #2563EB;
      box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
    }

    .auth-forgot {
      font-size: 0.7rem;
      font-weight: 700;
      color: #2563EB;
      text-decoration: none;
      letter-spacing: 0.05em;
    }
    .auth-forgot:hover { text-decoration: underline; }

    .auth-btn-primary {
      width: 100%;
      padding: 0.75rem;
      background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
      color: #ffffff;
      font-family: 'Poppins', sans-serif;
      font-size: 0.8125rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      box-shadow: 0 6px 24px rgba(37,99,235,0.35);
      transition: filter 180ms ease, transform 180ms ease, box-shadow 180ms ease;
    }
    .auth-btn-primary:hover {
      filter: brightness(1.08);
      transform: translateY(-1px);
      box-shadow: 0 10px 32px rgba(37,99,235,0.45);
    }
    .auth-btn-primary:disabled {
      opacity: 0.65;
      cursor: not-allowed;
      transform: none;
    }

    .auth-divider {
      position: relative;
      display: flex;
      align-items: center;
    }
    .auth-divider-line {
      flex: 1;
      height: 1px;
      background: rgba(37,99,235,0.12);
    }
    .auth-divider-text {
      padding: 0 0.75rem;
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      color: #93c5fd;
      background: rgba(238,242,255,0.6);
    }

    .auth-google-wrap {
      width: 100%;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid rgba(37,99,235,0.12);
      display: flex;
      justify-content: center;
      background: rgba(255,255,255,0.85);
    }

    .auth-error {
      background: rgba(254,242,242,0.9);
      border: 1px solid rgba(239,68,68,0.2);
      color: #dc2626;
      font-size: 0.75rem;
      font-weight: 500;
      padding: 0.5rem 0.75rem;
      border-radius: 10px;
      text-align: center;
    }

    /* ── Mobile card ── */
    .auth-mobile {
      display: flex;
      width: 100%;
      max-width: 380px;
    }
    @media (min-width: 768px) { .auth-mobile { display: none; } }
    .auth-mobile-card {
      width: 100%;
      background: rgba(255,255,255,0.92);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-radius: 24px;
      border: 1px solid rgba(37,99,235,0.12);
      box-shadow: 0 24px 64px rgba(37,99,235,0.15);
      padding: 2rem 1.75rem;
      overflow: hidden;
    }
    .auth-mobile-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 1.75rem;
      gap: 0.75rem;
    }
    .auth-mobile-logo-icon {
      width: 52px; height: 52px;
      background: linear-gradient(135deg, #2563EB, #1D4ED8);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 24px rgba(37,99,235,0.35);
    }
    .auth-mobile-title {
      font-family: 'Poppins', sans-serif;
      font-size: 1.375rem;
      font-weight: 800;
      color: #1e3a8a;
      margin: 0;
      letter-spacing: -0.02em;
    }
    .auth-mobile-sub {
      font-size: 0.75rem;
      color: #3b82f6;
      opacity: 0.75;
      font-weight: 500;
      margin: 0;
    }

    /* ── Success screen ── */
    .auth-success-wrap {
      min-height: 100vh;
      background: linear-gradient(155deg, #f0f9ff 0%, #eff6ff 40%, #f0f9ff 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      font-family: 'Open Sans', system-ui, sans-serif;
    }
    .auth-success-card {
      width: 100%;
      max-width: 440px;
      background: rgba(255,255,255,0.92);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(37,99,235,0.12);
      border-radius: 24px;
      box-shadow: 0 24px 64px rgba(37,99,235,0.15);
      padding: 3rem 2.5rem;
      text-align: center;
    }
    .auth-success-icon-wrap {
      width: 80px; height: 80px;
      background: rgba(16,185,129,0.1);
      border: 1px solid rgba(16,185,129,0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.75rem;
    }
    .auth-success-title {
      font-family: 'Poppins', sans-serif;
      font-size: 1.625rem;
      font-weight: 700;
      color: #1e3a8a;
      margin: 0 0 0.875rem;
    }
    .auth-success-desc {
      font-size: 0.9375rem;
      color: #1e40af;
      opacity: 0.8;
      line-height: 1.7;
      margin: 0 0 2rem;
    }
    .auth-success-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.875rem;
      background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
      color: white;
      font-family: 'Poppins', sans-serif;
      font-size: 0.9375rem;
      font-weight: 600;
      border: none;
      border-radius: 14px;
      cursor: pointer;
      box-shadow: 0 8px 28px rgba(37,99,235,0.35);
      transition: filter 180ms ease, transform 180ms ease;
    }
    .auth-success-btn:hover {
      filter: brightness(1.08);
      transform: translateY(-1px);
    }

    /* Switch link */
    .auth-switch-text { font-size: 0.75rem; color: #3b82f6; opacity: 0.7; margin: 0; }
    .auth-switch-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 0.8rem;
      font-weight: 700;
      color: #2563EB;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      transition: opacity 180ms ease;
    }
    .auth-switch-btn:hover { opacity: 0.75; }
  `}</style>
);

// ─── Component ────────────────────────────────────────────────────────────────

const AuthPage = () => {
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isSignIn, setIsSignIn] = useState(location.pathname !== "/register");

  useEffect(() => {
    setIsSignIn(location.pathname !== "/register");
  }, [location.pathname]);

  const toggleAuth = () => {
    navigate(isSignIn ? "/register" : "/login");
  };

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
      showToast(`Chào mừng trở lại, ${user.fullName}!`, "success");
      navigate(user.role === "ADMIN" ? "/admin" : "/");
    } catch (err: any) {
      const msg = err.response?.data?.message || "Đăng nhập Google thất bại.";
      setError(msg);
      showToast(msg, "error");
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
      showToast("Đăng nhập thành công!", "success");
      navigate(user.role === "ADMIN" ? "/admin" : "/");
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        "Đăng nhập thất bại. Vui lòng kiểm tra thông tin đăng nhập.";
      setError(msg);
      showToast(msg, "error");
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
      showToast("Đăng ký thành công! Vui lòng kiểm tra email của bạn.", "success");
    } catch (err: any) {
      const msg =
        err.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại.";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const springTransition = { type: "spring" as const, stiffness: 120, damping: 20 };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <div className="auth-success-wrap">
        <AuthStyles />
        <motion.div
          className="auth-success-card"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="auth-success-icon-wrap">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="auth-success-title">Xác minh Email</h1>
          <p className="auth-success-desc">
            Chúng tôi đã gửi liên kết xác minh đến{" "}
            <strong style={{ color: "#1e3a8a" }}>{signUpEmail}</strong>.
            Vui lòng kiểm tra hộp thư và nhấp vào liên kết để kích hoạt tài khoản.
          </p>
          <button
            onClick={() => { setIsSuccess(false); navigate("/login"); }}
            className="auth-success-btn"
          >
            Đến Trang Đăng Nhập
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Sign-Up form content ───────────────────────────────────────────────────
  const SignUpForm = ({ bg }: { bg?: string }) => (
    <motion.div
      initial={false}
      animate={{ opacity: isSignIn ? 0 : 1, y: isSignIn ? 16 : 0 }}
      transition={{ delay: 0.1 }}
      className="auth-panel-inner"
      style={bg ? { background: bg } : undefined}
    >
      <div className="auth-section-title">
        <h1 className="auth-heading">Tạo tài khoản</h1>
        <p className="auth-subheading">Bắt đầu giao tiếp không rào cản</p>
      </div>

      {!isSignIn && error && <div className="auth-error">{error}</div>}

      <form onSubmit={handleSignUp} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div>
          <label className="auth-field-label">Họ và tên</label>
          <div className="auth-field-wrap">
            <User className="auth-field-icon" />
            <input type="text" value={signUpName} onChange={(e) => setSignUpName(e.target.value)}
              placeholder="Nguyễn Văn A" className="auth-input" required />
          </div>
        </div>
        <div>
          <label className="auth-field-label">Địa chỉ Email</label>
          <div className="auth-field-wrap">
            <Mail className="auth-field-icon" />
            <input type="email" value={signUpEmail} onChange={(e) => setSignUpEmail(e.target.value)}
              placeholder="ban@example.com" className="auth-input" required />
          </div>
        </div>
        <div>
          <label className="auth-field-label">Mật khẩu</label>
          <div className="auth-field-wrap">
            <Lock className="auth-field-icon" />
            <input type="password" value={signUpPassword} onChange={(e) => setSignUpPassword(e.target.value)}
              placeholder="••••••••" className="auth-input" required />
          </div>
        </div>
        <button type="submit" disabled={loading} className="auth-btn-primary" style={{ marginTop: "0.25rem" }}>
          {loading ? "Đang xử lý..." : "TẠO TÀI KHOẢN"}
        </button>
      </form>

      <div className="auth-divider">
        <div className="auth-divider-line" />
        <span className="auth-divider-text">Hoặc</span>
        <div className="auth-divider-line" />
      </div>

      <div className="auth-google-wrap">
        <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError("Đăng nhập Google thất bại")}
          theme="outline" size="large" shape="rectangular" width="300" />
      </div>
    </motion.div>
  );

  // ── Sign-In form content ───────────────────────────────────────────────────
  const SignInForm = ({ bg }: { bg?: string }) => (
    <motion.div
      initial={false}
      animate={{ opacity: isSignIn ? 1 : 0, y: isSignIn ? 0 : 16 }}
      transition={{ delay: 0.1 }}
      className="auth-panel-inner"
      style={bg ? { background: bg } : undefined}
    >
      <div className="auth-section-title">
        <h1 className="auth-heading">Chào mừng trở lại</h1>
        <p className="auth-subheading">Đăng nhập vào hệ sinh thái Signify</p>
      </div>

      {isSignIn && error && <div className="auth-error">{error}</div>}

      <form onSubmit={handleSignIn} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div>
          <label className="auth-field-label">Địa chỉ Email</label>
          <div className="auth-field-wrap">
            <Mail className="auth-field-icon" />
            <input type="email" value={signInEmail} onChange={(e) => setSignInEmail(e.target.value)}
              placeholder="ban@example.com" className="auth-input" required />
          </div>
        </div>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
            <label className="auth-field-label" style={{ margin: 0 }}>Mật khẩu</label>
            <Link to="/forgot-password" className="auth-forgot">Quên mật khẩu?</Link>
          </div>
          <div className="auth-field-wrap">
            <Lock className="auth-field-icon" />
            <input type="password" value={signInPassword} onChange={(e) => setSignInPassword(e.target.value)}
              placeholder="••••••••" className="auth-input" required />
          </div>
        </div>
        <button type="submit" disabled={loading} className="auth-btn-primary" style={{ marginTop: "0.25rem" }}>
          {loading ? "Đang xử lý..." : "ĐĂNG NHẬP"}
        </button>
      </form>

      <div className="auth-divider">
        <div className="auth-divider-line" />
        <span className="auth-divider-text">Hoặc</span>
        <div className="auth-divider-line" />
      </div>

      <div className="auth-google-wrap">
        <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError("Đăng nhập Google thất bại")}
          theme="outline" size="large" shape="rectangular" width="300" />
      </div>
    </motion.div>
  );

  return (
    <div className="auth-root">
      <AuthStyles />
      <div aria-hidden="true" className="auth-orb auth-orb-1" />
      <div aria-hidden="true" className="auth-orb auth-orb-2" />

      <Link to="/" className="auth-back">
        <div className="auth-back-icon">
          <ArrowLeft className="w-4 h-4" />
        </div>
        Về Trang Chủ
      </Link>

      {/* ── Desktop layout ── */}
      <div className="auth-card">
        {/* Sign-Up Panel */}
        <motion.div
          className="auth-panel"
          animate={{ x: isSignIn ? "0%" : "100%", opacity: isSignIn ? 0 : 1, zIndex: isSignIn ? 0 : 20 }}
          transition={springTransition}
        >
          <SignUpForm />
        </motion.div>

        {/* Sign-In Panel */}
        <motion.div
          className="auth-panel"
          animate={{ x: isSignIn ? "0%" : "-100%", opacity: isSignIn ? 1 : 0, zIndex: isSignIn ? 20 : 0 }}
          transition={springTransition}
        >
          <SignInForm />
        </motion.div>

        {/* Sliding overlay */}
        <motion.div
          className="auth-overlay"
          animate={{
            x: isSignIn ? "100%" : "0%",
            borderRadius: isSignIn ? "0 28px 28px 0" : "28px 0 0 28px",
          }}
          transition={springTransition}
        >
          <div className="auth-overlay-inner">
            <div className="auth-overlay-orb-1" />
            <div className="auth-overlay-orb-2" />
            <div className="auth-overlay-grid" />
            <div className="auth-overlay-content">
              <AnimatePresence mode="wait">
                {isSignIn ? (
                  <motion.div key="to-signup"
                    initial={{ opacity: 0, scale: 0.9, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 1.1, x: -20 }}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}
                  >
                    <div className="auth-overlay-icon">
                      <Sparkles className="w-7 h-7 text-white" />
                    </div>
                    <p className="auth-overlay-eyebrow">Bắt đầu hành trình</p>
                    <h3 className="auth-overlay-title">Chưa có tài khoản?</h3>
                    <p className="auth-overlay-desc">
                      Khám phá tương lai của giao tiếp với AI ngôn ngữ ký hiệu thế hệ mới.
                    </p>
                    <button onClick={toggleAuth} className="auth-overlay-btn">ĐĂNG KÝ NGAY</button>
                  </motion.div>
                ) : (
                  <motion.div key="to-signin"
                    initial={{ opacity: 0, scale: 0.9, x: -20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 1.1, x: 20 }}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}
                  >
                    <div className="auth-overlay-icon">
                      <HandMetal className="w-7 h-7 text-white" />
                    </div>
                    <p className="auth-overlay-eyebrow">Chào mừng trở lại</p>
                    <h3 className="auth-overlay-title">Đã có tài khoản?</h3>
                    <p className="auth-overlay-desc">
                      Đăng nhập để tiếp tục hành trình kết nối không giới hạn của bạn.
                    </p>
                    <button onClick={toggleAuth} className="auth-overlay-btn">ĐĂNG NHẬP NGAY</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Mobile layout ── */}
      <div className="auth-mobile">
        <div className="auth-mobile-card">
          <div className="auth-mobile-header">
            <div className="auth-mobile-logo-icon">
              {isSignIn ? <Lock className="w-6 h-6 text-white" /> : <User className="w-6 h-6 text-white" />}
            </div>
            <h1 className="auth-mobile-title">SIGNIFY</h1>
            <p className="auth-mobile-sub">{isSignIn ? "Xác thực thành viên" : "Đăng ký tài khoản"}</p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={isSignIn ? "signin-m" : "signup-m"}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}
            >
              {error && <div className="auth-error">{error}</div>}

              <form onSubmit={isSignIn ? handleSignIn : handleSignUp}
                style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {!isSignIn && (
                  <div>
                    <label className="auth-field-label">Họ và tên</label>
                    <input type="text" value={signUpName} onChange={(e) => setSignUpName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="auth-input" style={{ paddingLeft: "0.875rem" }} required />
                  </div>
                )}
                <div>
                  <label className="auth-field-label">Địa chỉ Email</label>
                  <input type="email"
                    value={isSignIn ? signInEmail : signUpEmail}
                    onChange={(e) => isSignIn ? setSignInEmail(e.target.value) : setSignUpEmail(e.target.value)}
                    placeholder="ban@example.com"
                    className="auth-input" style={{ paddingLeft: "0.875rem" }} required />
                </div>
                <div>
                  <label className="auth-field-label">Mật khẩu</label>
                  <input type="password"
                    value={isSignIn ? signInPassword : signUpPassword}
                    onChange={(e) => isSignIn ? setSignInPassword(e.target.value) : setSignUpPassword(e.target.value)}
                    placeholder="••••••••"
                    className="auth-input" style={{ paddingLeft: "0.875rem" }} required />
                </div>
                <button type="submit" disabled={loading} className="auth-btn-primary" style={{ marginTop: "0.25rem" }}>
                  {loading ? "Đang xử lý..." : isSignIn ? "ĐĂNG NHẬP" : "TẠO TÀI KHOẢN"}
                </button>
              </form>

              <div className="auth-divider">
                <div className="auth-divider-line" />
                <span className="auth-divider-text" style={{ background: "rgba(255,255,255,0.92)" }}>Hoặc</span>
                <div className="auth-divider-line" />
              </div>

              <div className="auth-google-wrap" style={{ background: "rgba(255,255,255,0.92)" }}>
                <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError("Đăng nhập Google thất bại")}
                  theme="outline" size="large" shape="rectangular" width="320" />
              </div>

              <div style={{ textAlign: "center", marginTop: "0.5rem" }}>
                <p className="auth-switch-text">{isSignIn ? "Chưa có tài khoản?" : "Đã là thành viên?"}</p>
                <button onClick={toggleAuth} className="auth-switch-btn">
                  {isSignIn ? "Chuyển sang Đăng ký" : "Chuyển sang Đăng nhập"}
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
