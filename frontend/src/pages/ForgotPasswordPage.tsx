import { useState, type FormEvent } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Loader2, Mail } from 'lucide-react';
import api from '../services/api';

type RequestStatus = 'idle' | 'submitting' | 'success' | 'error';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [status, setStatus] = useState<RequestStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    setStatus('submitting');
    setErrorMessage('');

    try {
      await api.post('/users/forgot-password', { email: normalizedEmail });
      setSubmittedEmail(normalizedEmail);
      setStatus('success');
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        setErrorMessage('Email này chưa được đăng ký trong hệ thống. Vui lòng kiểm tra lại hoặc tạo tài khoản mới.');
      } else {
        setErrorMessage('Không thể gửi email đặt lại mật khẩu lúc này. Vui lòng thử lại sau.');
      }
      setStatus('error');
    }
  };

  const resetForm = () => {
    setEmail('');
    setSubmittedEmail('');
    setErrorMessage('');
    setStatus('idle');
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10 font-sans">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
        <Link
          to="/login"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại đăng nhập
        </Link>

        <div className="mb-5 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10">
            <Mail className="h-7 w-7 text-primary" />
          </div>
        </div>

        <h1 className="mb-2 text-center text-2xl font-bold text-slate-900">Quên mật khẩu?</h1>
        <p className="mb-6 text-center text-sm text-slate-500">
          Nhập email đã đăng ký để nhận liên kết đặt lại mật khẩu.
        </p>

        {status === 'success' ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <div className="mb-2 flex items-center gap-2 font-semibold">
                <CheckCircle2 className="h-5 w-5" />
                Email đã được gửi
              </div>
              <p className="leading-6">
                Chúng tôi đã gửi liên kết đặt lại mật khẩu đến <strong>{submittedEmail}</strong>. Liên kết có hiệu lực trong 30 phút.
              </p>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Dùng email khác
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {status === 'error' && (
              <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
                {errorMessage}
              </div>
            )}

            <div>
              <label htmlFor="forgot-password-email" className="mb-2 block text-sm font-semibold text-slate-700">
                Địa chỉ email
              </label>
              <input
                id="forgot-password-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="email@example.com"
                autoComplete="email"
                required
                disabled={status === 'submitting'}
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
            </div>

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-primary/20 transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {status === 'submitting' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              {status === 'submitting' ? 'Đang gửi...' : 'Gửi liên kết đặt lại mật khẩu'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
};

export default ForgotPasswordPage;
