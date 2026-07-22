import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Loader2, LogIn, MailCheck, UserPlus, XCircle } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { acceptTeacherInvitation, getTeacherInvitation, SchoolInvitationResponse } from '../services/schoolService';
import { setLogin } from '../store/authSlice';
import type { RootState } from '../store/store';

type InvitationStatus = 'loading' | 'waiting' | 'accepting' | 'accepted' | 'error';
type ApiError = { response?: { data?: { message?: string } } };

const SchoolInvitationPage: React.FC = () => {
  const { token: invitationToken } = useParams<{ token: string }>();
  const dispatch = useDispatch();
  const { user, token, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [status, setStatus] = useState<InvitationStatus>('loading');
  const [message, setMessage] = useState('');
  const [invitation, setInvitation] = useState<SchoolInvitationResponse | null>(null);
  const loadedRef = useRef(false);
  const invitationPath = `/school/invitations/${invitationToken || ''}`;
  const redirectQuery = `?redirect=${encodeURIComponent(invitationPath)}`;
  const blockedRole = ['SCHOOL_ADMIN', 'ADMIN', 'STUDENT'].includes(user?.role);

  useEffect(() => {
    if (!isAuthenticated || !invitationToken || blockedRole || loadedRef.current) return;
    loadedRef.current = true;
    getTeacherInvitation(invitationToken)
      .then(invitationData => {
        setInvitation(invitationData);
        if (invitationData.status !== 'PENDING') {
          setMessage('Lời mời này đã được xử lý hoặc đã hết hạn.');
          setStatus('error');
          return;
        }
        if (!user?.email || invitationData.email.toLowerCase() !== user.email.toLowerCase()) {
          setMessage(`Lời mời này dành cho ${invitationData.email}. Hãy đăng nhập bằng đúng email đó.`);
          setStatus('error');
          return;
        }
        setStatus('waiting');
      })
      .catch((error: unknown) => {
        setMessage((error as ApiError).response?.data?.message || 'Không thể tải lời mời này.');
        setStatus('error');
      });
  }, [blockedRole, invitationToken, isAuthenticated, user]);

  const accept = async () => {
    if (!invitationToken || status !== 'waiting') return;
    setStatus('accepting');
    try {
      const member = await acceptTeacherInvitation(invitationToken);
      if (token) dispatch(setLogin({ user: { ...user, role: member.role }, token }));
      localStorage.removeItem('pendingInviteRedirect');
      setStatus('accepted');
    } catch (error: unknown) {
      setMessage((error as ApiError).response?.data?.message || 'Không thể chấp nhận lời mời.');
      setStatus('error');
    }
  };

  const effectiveStatus = !invitationToken || blockedRole
    ? 'error'
    : !isAuthenticated && status === 'loading'
      ? 'waiting'
      : status;
  const effectiveMessage = !invitationToken
    ? 'Liên kết lời mời không hợp lệ.'
    : blockedRole
      ? 'Tài khoản hiện tại không thể nhận lời mời giáo viên. Hãy đăng nhập bằng đúng email được mời.'
      : message;

  return (
    <div className="flex min-h-screen flex-col bg-background text-on-surface font-sans">
      <Header />
      <main className="flex flex-1 items-center justify-center px-4 pb-16 pt-28">
        <section className="w-full max-w-lg rounded-[24px] border border-outline-variant/60 bg-surface-container-lowest p-6 text-center shadow-xl sm:p-9">
          {effectiveStatus === 'loading' && (
            <>
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
              <h1 className="mt-6 text-2xl font-black">Đang tải lời mời</h1>
              <p className="mt-3 text-sm text-on-surface-variant">Signify đang kiểm tra thông tin lời mời.</p>
            </>
          )}

          {effectiveStatus === 'waiting' && !isAuthenticated && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"><MailCheck className="h-8 w-8" /></div>
              <h1 className="mt-6 text-2xl font-black">Lời mời tham gia trường học</h1>
              <p className="mt-3 text-sm leading-6 text-on-surface-variant">Đăng nhập bằng đúng email nhận lời mời để xác nhận. Nếu chưa có tài khoản Signify, hãy đăng ký và xác minh email trước.</p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <Link to={`/login${redirectQuery}`} className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-black text-on-primary"><LogIn className="h-4 w-4" />Đăng nhập</Link>
                <Link to={`/register${redirectQuery}`} className="flex items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-black text-primary"><UserPlus className="h-4 w-4" />Đăng ký</Link>
              </div>
            </>
          )}

          {effectiveStatus === 'waiting' && isAuthenticated && invitation && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"><MailCheck className="h-8 w-8" /></div>
              <h1 className="mt-6 text-2xl font-black">Xác nhận lời mời giáo viên</h1>
              <p className="mt-3 text-sm leading-6 text-on-surface-variant">Bạn có chắc chắn muốn chấp nhận lời mời tham gia trường học với vai trò giáo viên không?</p>
              <div className="mt-5 rounded-xl bg-surface-container p-4 text-left text-sm">
                <p><span className="font-bold">Họ tên:</span> {invitation.fullName}</p>
                <p className="mt-1"><span className="font-bold">Email:</span> {invitation.email}</p>
              </div>
              <button type="button" onClick={() => void accept()} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-black text-on-primary"><CheckCircle2 className="h-4 w-4" />Chấp nhận lời mời</button>
              <Link to="/profile" className="mt-3 inline-flex text-sm font-bold text-on-surface-variant">Hủy</Link>
            </>
          )}

          {effectiveStatus === 'accepting' && (
            <>
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
              <h1 className="mt-6 text-2xl font-black">Đang xác nhận lời mời</h1>
              <p className="mt-3 text-sm text-on-surface-variant">Signify đang cấp quyền giáo viên cho tài khoản của bạn.</p>
            </>
          )}

          {effectiveStatus === 'accepted' && (
            <>
              <CheckCircle2 className="mx-auto h-16 w-16 text-secondary" />
              <h1 className="mt-6 text-2xl font-black">Đã tham gia trường học</h1>
              <p className="mt-3 text-sm text-on-surface-variant">Tài khoản của bạn đã được cấp quyền giáo viên. Bạn có thể tạo lớp và quản lý học sinh trong lớp của mình.</p>
              <Link to="/teacher" className="mt-7 inline-flex w-full items-center justify-center rounded-xl bg-secondary px-4 py-3 text-sm font-black text-on-secondary">Đi đến quản lý lớp học</Link>
            </>
          )}

          {effectiveStatus === 'error' && (
            <>
              <XCircle className="mx-auto h-16 w-16 text-error" />
              <h1 className="mt-6 text-2xl font-black">Không thể chấp nhận lời mời</h1>
              <p className="mt-3 text-sm leading-6 text-on-surface-variant">{effectiveMessage}</p>
              <p className="mt-3 text-xs text-on-surface-variant">Hãy đăng nhập bằng đúng email nhận lời mời hoặc yêu cầu quản trị trường gửi lời mời mới.</p>
              <Link to={`/login${redirectQuery}`} className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-black text-on-primary">Đổi tài khoản và đăng nhập</Link>
            </>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default SchoolInvitationPage;
