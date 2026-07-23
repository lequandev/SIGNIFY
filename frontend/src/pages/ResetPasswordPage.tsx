import { useState, type FormEvent } from 'react';
import axios from 'axios';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, KeyRound, Loader2 } from 'lucide-react';
import api from '../services/api';

type ResetStatus = 'idle' | 'submitting' | 'success' | 'error';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<ResetStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      setStatus('error');
      setErrorMessage('Mật khẩu xác nhận không khớp.');
      return;
    }

    setStatus('submitting');
    setErrorMessage('');
    try {
      await api.post('/users/reset-password', { token, newPassword });
      setStatus('success');
    } catch (error: unknown) {
      const serverMessage = axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message
        : undefined;
      setErrorMessage(
        serverMessage === 'The password reset link is invalid or has expired.'
          ? 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.'
          : 'Không thể đặt lại mật khẩu lúc này. Vui lòng thử lại sau.',
      );
      setStatus('error');
    }
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
            <KeyRound className="h-7 w-7 text-primary" />
          </div>
        </div>

        {status === 'success' ? (
          <div className="space-y-5 text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
            <div>
              <h1 className="mb-2 text-2xl font-bold text-slate-900">Đặt lại mật khẩu thành công</h1>
              <p className="text-sm leading-6 text-slate-500">Bạn có thể đăng nhập bằng mật khẩu mới.</p>
            </div>
            <Link
              to="/login"
              className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary/90"
            >
              Đăng nhập
            </Link>
          </div>
        ) : !token ? (
          <div role="alert" className="space-y-4 text-center">
            <AlertCircle className="mx-auto h-14 w-14 text-red-500" />
            <div>
              <h1 className="mb-2 text-2xl font-bold text-slate-900">Liên kết không hợp lệ</h1>
              <p className="text-sm leading-6 text-slate-500">Liên kết đặt lại mật khẩu bị thiếu token. Vui lòng yêu cầu một liên kết mới.</p>
            </div>
            <Link
              to="/forgot-password"
              className="inline-flex w-full items-center justify-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Yêu cầu liên kết mới
            </Link>
          </div>
        ) : (
          <>
            <h1 className="mb-2 text-center text-2xl font-bold text-slate-900">Tạo mật khẩu mới</h1>
            <p className="mb-6 text-center text-sm text-slate-500">Mật khẩu mới phải có ít nhất 8 ký tự.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {status === 'error' && (
                <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
                  {errorMessage}
                </div>
              )}

              <div>
                <label htmlFor="new-password" className="mb-2 block text-sm font-semibold text-slate-700">Mật khẩu mới</label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                  disabled={status === 'submitting'}
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>

              <div>
                <label htmlFor="confirm-password" className="mb-2 block text-sm font-semibold text-slate-700">Xác nhận mật khẩu</label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                  disabled={status === 'submitting'}
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-primary/20 transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {status === 'submitting' ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                {status === 'submitting' ? 'Đang cập nhật...' : 'Đặt lại mật khẩu'}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
};

export default ResetPasswordPage;
