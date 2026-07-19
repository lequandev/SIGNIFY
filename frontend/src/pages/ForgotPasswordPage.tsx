import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10 font-sans">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-primary transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Quay lại đăng nhập
        </Link>

        <div className="flex justify-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Mail className="w-7 h-7 text-primary" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 text-center mb-2">Quên mật khẩu?</h1>
        <p className="text-sm text-slate-500 text-center mb-6">
          Nhập email của bạn để nhận hướng dẫn đặt lại mật khẩu.
        </p>

        {submitted ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            Nếu email tồn tại trong hệ thống, chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu cho bạn.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Địa chỉ email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary/90"
            >
              Gửi hướng dẫn
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
