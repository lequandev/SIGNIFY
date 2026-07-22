import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Ban, Building2, CheckCircle2, Copy, GraduationCap, KeyRound, Loader2, Mail, Pencil, Save, Shield, Trash2, UserPlus, Users, X } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import MemberDetailsModal from '../components/MemberDetailsModal';
import WorkspaceTopbar from '../components/WorkspaceTopbar';
import { useToast } from '../context/ToastContext';
import {
  createStudent,
  deleteMember,
  getMySchool,
  getPendingSchoolInvitations,
  getSchoolMembers,
  inviteTeacher,
  resetStudentPassword,
  SchoolMember,
  SchoolInvitationResponse,
  SchoolOverview,
  updateSchoolName,
  updateMemberStatus,
} from '../services/schoolService';

type ApiError = { response?: { data?: { code?: string; message?: string } } };
type Credentials = { loginId: string; password: string; title: string };
type ConfirmAction = {
  title: string;
  message: string;
  confirmText: string;
  type: 'danger' | 'warning' | 'info';
  onConfirm: () => Promise<void> | void;
};

const roleLabel = (role: string) => ({ SCHOOL_ADMIN: 'Quản trị trường', TEACHER: 'Giáo viên', STUDENT: 'Học sinh' }[role] || role);
const statusLabel = (status: string) => ({ ACTIVE: 'Đang hoạt động', INACTIVE: 'Tạm khóa', PENDING: 'Chờ chấp nhận' }[status] || status);

const getApiError = (error: unknown, fallback: string) => {
  const data = (error as ApiError).response?.data;
  return { code: data?.code, message: data?.message || fallback };
};

const SchoolPage: React.FC = () => {
  const { showToast } = useToast();
  const [school, setSchool] = useState<SchoolOverview | null>(null);
  const [members, setMembers] = useState<SchoolMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<SchoolInvitationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<'TEACHER' | 'STUDENT'>('TEACHER');
  const [form, setForm] = useState({ fullName: '', email: '', username: '' });
  const [submitting, setSubmitting] = useState(false);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [editingSchoolName, setEditingSchoolName] = useState(false);
  const [schoolNameDraft, setSchoolNameDraft] = useState('');
  const [savingSchoolName, setSavingSchoolName] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [selectedMember, setSelectedMember] = useState<SchoolMember | null>(null);
  const [studentPasswords, setStudentPasswords] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      const [overview, list, invitations] = await Promise.all([getMySchool(), getSchoolMembers(), getPendingSchoolInvitations()]);
      setSchool(overview);
      setMembers(list);
      setPendingInvitations(invitations);
    } catch (error: unknown) {
      showToast(getApiError(error, 'Không thể tải dữ liệu trường học').message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (school) setSchoolNameDraft(school.schoolName);
  }, [school]);

  const activeMembers = useMemo(() => members.filter(member => member.status === 'ACTIVE').length, [members]);
  const usage = school?.maxAccounts ? Math.min(100, Math.round((school.memberCount / school.maxAccounts) * 100)) : 0;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.fullName.trim() || (role === 'TEACHER' && !form.email.trim())) return;
    setSubmitting(true);
    try {
      if (role === 'TEACHER') {
        await inviteTeacher(form.fullName, form.email);
      } else {
        const result = await createStudent(form.fullName, form.username || undefined);
        setStudentPasswords(current => ({ ...current, [result.member.userId]: result.temporaryPassword }));
        setCredentials({ loginId: result.loginId, password: result.temporaryPassword, title: 'Thông tin đăng nhập học sinh' });
      }
      setForm({ fullName: '', email: '', username: '' });
      await load();
      showToast(role === 'TEACHER' ? 'Đã gửi lời mời đến email giáo viên' : 'Đã tạo tài khoản học sinh', 'success');
    } catch (error: unknown) {
      const apiError = getApiError(error, 'Không thể tạo tài khoản');
      showToast(apiError.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const saveSchoolName = async () => {
    if (!schoolNameDraft.trim() || savingSchoolName) return;
    setSavingSchoolName(true);
    try {
      const updated = await updateSchoolName(schoolNameDraft.trim());
      setSchool(updated);
      setEditingSchoolName(false);
      showToast('Đã cập nhật tên trường', 'success');
    } catch (error: unknown) {
      showToast(getApiError(error, 'Không thể cập nhật tên trường').message, 'error');
    } finally {
      setSavingSchoolName(false);
    }
  };

  const resetPassword = async (member: SchoolMember) => {
    try {
      const result = await resetStudentPassword(member.userId);
      setStudentPasswords(current => ({ ...current, [member.userId]: result.temporaryPassword }));
      setCredentials({ loginId: result.loginId, password: result.temporaryPassword, title: 'Mật khẩu mới của học sinh' });
    } catch (error: unknown) {
      showToast(getApiError(error, 'Không thể đặt lại mật khẩu').message, 'error');
    }
  };

  const requestResetPassword = (member: SchoolMember) => {
    setConfirmAction({
      title: 'Đặt lại mật khẩu',
      message: `Bạn có chắc muốn tạo mật khẩu mới cho ${member.fullName}? Mật khẩu hiện tại sẽ không còn dùng được.`,
      confirmText: 'Đặt lại mật khẩu',
      type: 'warning',
      onConfirm: () => resetPassword(member),
    });
  };

  const toggleStatus = async (member: SchoolMember) => {
    try {
      await updateMemberStatus(member.id, member.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE');
      await load();
    } catch (error: unknown) {
      showToast(getApiError(error, 'Không thể cập nhật thành viên').message, 'error');
    }
  };

  const requestToggleStatus = (member: SchoolMember) => {
    const activating = member.status !== 'ACTIVE';
    setConfirmAction({
      title: activating ? 'Kích hoạt thành viên' : 'Tạm khóa thành viên',
      message: activating
        ? `Bạn có chắc muốn kích hoạt lại tài khoản ${member.fullName}?`
        : `Bạn có chắc muốn tạm khóa tài khoản ${member.fullName}? Tài khoản sẽ không thể truy cập cho đến khi được kích hoạt lại.`,
      confirmText: activating ? 'Kích hoạt' : 'Tạm khóa',
      type: activating ? 'info' : 'warning',
      onConfirm: () => toggleStatus(member),
    });
  };

  const remove = async (member: SchoolMember) => {
    try {
      await deleteMember(member.id);
      await load();
      if (selectedMember?.id === member.id) setSelectedMember(null);
      showToast(member.role === 'STUDENT' ? 'Đã xóa tài khoản học sinh' : 'Đã gỡ thành viên khỏi trường', 'success');
    } catch (error: unknown) {
      showToast(getApiError(error, 'Không thể xóa thành viên').message, 'error');
    }
  };

  const requestRemove = (member: SchoolMember) => {
    const identity = member.email || member.username || member.fullName;
    const confirmation = member.role === 'STUDENT'
      ? `Bạn có chắc muốn xóa vĩnh viễn tài khoản ${identity}? Toàn bộ dữ liệu lớp học và tiến độ của học sinh cũng sẽ bị xóa.`
      : `Bạn có chắc muốn gỡ ${identity} khỏi trường?`;
    setConfirmAction({
      title: member.role === 'STUDENT' ? 'Xóa tài khoản học sinh' : 'Gỡ thành viên khỏi trường',
      message: confirmation,
      confirmText: 'Xóa',
      type: 'danger',
      onConfirm: () => remove(member),
    });
  };

  const copyStudentCredentials = async (member: SchoolMember) => {
    const password = studentPasswords[member.userId];
    if (!password) return;
    await navigator.clipboard.writeText(`Mã đăng nhập: ${member.username || ''}\nMật khẩu: ${password}`);
    showToast('Đã sao chép thông tin đăng nhập', 'success');
  };

  const copyCredentials = async () => {
    if (!credentials) return;
    await navigator.clipboard.writeText(`Mã đăng nhập: ${credentials.loginId}\nMật khẩu: ${credentials.password}`);
    showToast('Đã sao chép thông tin đăng nhập', 'success');
  };

  return (
    <div className="min-h-screen bg-background font-sans text-on-surface selection:bg-primary/15">
      <WorkspaceTopbar currentLabel="Quản lý trường học" />
      <main className="pb-20">
        <section className="border-b border-outline-variant/40 bg-surface-container-lowest">
          <div className="mx-auto flex max-w-7xl flex-col gap-7 px-4 py-9 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-10">
            <div className="min-w-0 flex-1"><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-xs font-extrabold text-primary"><Building2 className="h-3.5 w-3.5" /> Không gian trường học</div><div className="flex items-center gap-2">{editingSchoolName ? <><input value={schoolNameDraft} onChange={event => setSchoolNameDraft(event.target.value)} maxLength={120} autoFocus className="h-11 min-w-0 max-w-xl flex-1 rounded-xl border border-outline-variant/60 bg-background px-3 text-2xl font-black outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 sm:text-3xl" /><button type="button" onClick={() => void saveSchoolName()} disabled={savingSchoolName} title="Lưu tên trường" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary shadow-sm transition hover:bg-on-primary-fixed-variant disabled:opacity-50"><Save className="h-4 w-4" /></button><button type="button" onClick={() => { setEditingSchoolName(false); setSchoolNameDraft(school?.schoolName || ''); }} title="Hủy" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-container text-on-surface-variant transition hover:bg-surface-container-high"><X className="h-4 w-4" /></button></> : <><h1 className="truncate text-3xl font-black leading-tight sm:text-4xl">{school?.schoolName || 'Trường học của bạn'}</h1>{school?.role === 'SCHOOL_ADMIN' && <button type="button" onClick={() => setEditingSchoolName(true)} title="Đổi tên trường" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-on-surface-variant transition hover:bg-surface-container hover:text-primary"><Pencil className="h-4 w-4" /></button>}</>}</div><p className="mt-2 text-sm font-medium text-on-surface-variant sm:text-base">Quản lý giáo viên, học sinh và quyền truy cập.</p></div>
            {school && <div className="flex h-11 items-center gap-3 rounded-xl border border-outline-variant/50 bg-background px-4"><div className={`h-2.5 w-2.5 rounded-full ${school.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-500'}`} /><div><p className="text-xs font-extrabold">{statusLabel(school.status)}</p><p className="text-[11px] text-on-surface-variant">Gói {school.packageName || 'trường học'}</p></div></div>}
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
          {loading ? <div className="flex min-h-[360px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : !school ? <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest px-6 py-16 text-center"><Building2 className="mx-auto h-10 w-10 text-outline" /><h2 className="mt-4 text-lg font-extrabold">Chưa có không gian trường học</h2><p className="mt-2 text-sm text-on-surface-variant">Tài khoản này chưa được liên kết với một trường học đang hoạt động.</p></div> : <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Stat icon={Building2} label="Trạng thái" value={statusLabel(school.status)} /><Stat icon={Users} label="Thành viên" value={`${activeMembers}/${school.maxAccounts}`} /><Stat icon={GraduationCap} label="Giáo viên" value={school.teacherCount} /><Stat icon={Shield} label="Học sinh" value={school.studentCount} /></div>
            <div className="mt-8 grid items-start gap-7 lg:grid-cols-[310px_minmax(0,1fr)]">
              {school.canManageMembers && <section className="rounded-2xl border border-outline-variant/55 bg-surface-container-lowest p-5 shadow-sm lg:sticky lg:top-24"><div className="mb-5 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><UserPlus className="h-5 w-5" /></div><div><h2 className="font-extrabold">Thêm thành viên</h2><p className="mt-1 text-xs leading-5 text-on-surface-variant">Mời giáo viên qua email hoặc tạo tài khoản học sinh.</p></div></div><div className="mb-5 grid grid-cols-2 rounded-xl bg-surface-container p-1">{(['TEACHER', 'STUDENT'] as const).map(value => <button type="button" key={value} onClick={() => setRole(value)} className={`h-9 rounded-lg text-xs font-extrabold transition ${role === value ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}>{value === 'TEACHER' ? 'Giáo viên' : 'Học sinh'}</button>)}</div><form onSubmit={submit} className="space-y-3"><Field label="Họ và tên" value={form.fullName} onChange={value => setForm({ ...form, fullName: value })} required />{role === 'TEACHER' ? <Field label="Email" type="email" value={form.email} onChange={value => setForm({ ...form, email: value })} required /> : <Field label="Mã đăng nhập" placeholder="Không bắt buộc" value={form.username} onChange={value => setForm({ ...form, username: value })} />}<button type="submit" disabled={submitting} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-on-primary shadow-sm transition hover:bg-on-primary-fixed-variant focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : role === 'TEACHER' ? <Mail className="h-4 w-4" /> : <KeyRound className="h-4 w-4" />}{role === 'TEACHER' ? 'Gửi lời mời' : 'Tạo tài khoản'}</button></form></section>}

              <section className="overflow-hidden rounded-2xl border border-outline-variant/55 bg-surface-container-lowest shadow-sm"><div className="flex flex-col gap-4 border-b border-outline-variant/40 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><h2 className="font-extrabold">Thành viên trường</h2><p className="mt-1 text-xs text-on-surface-variant">{school.memberCount} tài khoản đang hoạt động · {pendingInvitations.length} lời mời chờ xử lý</p></div><div className="flex items-center gap-3"><div className="h-2 w-28 overflow-hidden rounded-full bg-surface-container"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${usage}%` }} /></div><span className="text-xs font-extrabold text-primary">{usage}%</span></div></div><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left"><thead className="bg-surface-container-low text-[10px] font-extrabold uppercase tracking-[0.14em] text-on-surface-variant"><tr><th className="px-5 py-3 sm:px-6">Thành viên</th><th className="px-5 py-3">Vai trò</th><th className="px-5 py-3">Trạng thái</th><th className="px-5 py-3 text-right sm:px-6">Thao tác</th></tr></thead><tbody className="divide-y divide-outline-variant/35">{members.map(member => <tr key={member.id} onClick={() => setSelectedMember(member)} className="cursor-pointer transition hover:bg-surface-container-low"><td className="px-5 py-4 sm:px-6"><div className="flex items-center gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-black text-primary">{member.avatarUrl ? <img src={member.avatarUrl} alt="" className="h-full w-full rounded-xl object-cover" /> : member.fullName.slice(0, 1).toUpperCase()}</div><div className="min-w-0"><p className="truncate text-sm font-extrabold">{member.fullName}</p><p className="truncate text-xs text-on-surface-variant">{member.email || member.username || '-'}</p></div></div></td><td className="px-5 py-4 text-xs font-extrabold text-primary">{roleLabel(member.role)}</td><td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-extrabold ${member.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-700' : 'bg-amber-500/10 text-amber-700'}`}>{statusLabel(member.status)}</span></td><td className="px-5 py-4 sm:px-6"><div className="flex justify-end gap-1">{member.role !== 'SCHOOL_ADMIN' && school.canManageMembers && <>{member.role === 'STUDENT' && <button type="button" title="Đặt lại mật khẩu" aria-label={`Đặt lại mật khẩu cho ${member.fullName}`} onClick={event => { event.stopPropagation(); requestResetPassword(member); }} className="rounded-lg p-2 text-on-surface-variant transition hover:bg-primary/10 hover:text-primary"><KeyRound className="h-4 w-4" /></button>}<button type="button" title={member.status === 'ACTIVE' ? 'Tạm khóa' : 'Kích hoạt'} aria-label={`${member.status === 'ACTIVE' ? 'Tạm khóa' : 'Kích hoạt'} ${member.fullName}`} onClick={event => { event.stopPropagation(); requestToggleStatus(member); }} className="rounded-lg p-2 text-on-surface-variant transition hover:bg-amber-500/10 hover:text-amber-700">{member.status === 'ACTIVE' ? <Ban className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}</button><button type="button" title="Xóa thành viên" aria-label={`Xóa ${member.fullName}`} onClick={event => { event.stopPropagation(); requestRemove(member); }} className="rounded-lg p-2 text-on-surface-variant transition hover:bg-error/10 hover:text-error"><Trash2 className="h-4 w-4" /></button></>}</div></td></tr>)}{pendingInvitations.map(invitation => <tr key={`invitation-${invitation.id}`} className="bg-tertiary/5"><td className="px-5 py-4 sm:px-6"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-tertiary/10 text-tertiary"><Mail className="h-4 w-4" /></div><div><p className="text-sm font-extrabold">{invitation.fullName}</p><p className="text-xs text-on-surface-variant">{invitation.email}</p></div></div></td><td className="px-5 py-4 text-xs font-extrabold text-primary">{roleLabel(invitation.role)}</td><td className="px-5 py-4"><span className="inline-flex rounded-full bg-tertiary/10 px-2.5 py-1 text-[10px] font-extrabold text-tertiary">Chờ chấp nhận</span></td><td className="px-5 py-4 text-right text-xs font-bold text-on-surface-variant sm:px-6">Đã gửi lời mời</td></tr>)}{members.length === 0 && pendingInvitations.length === 0 && <tr><td colSpan={4} className="px-6 py-14 text-center text-sm text-on-surface-variant">Chưa có thành viên nào.</td></tr>}</tbody></table></div></section>
            </div>
          </>}
        </div>
      </main>
      <MemberDetailsModal
        member={selectedMember}
        studentPassword={selectedMember ? studentPasswords[selectedMember.userId] : undefined}
        onClose={() => setSelectedMember(null)}
        onResetPassword={selectedMember?.role === 'STUDENT' ? () => requestResetPassword(selectedMember) : undefined}
        onCopyCredentials={selectedMember?.role === 'STUDENT' && studentPasswords[selectedMember.userId] ? () => void copyStudentCredentials(selectedMember) : undefined}
      />
      <ConfirmModal
        isOpen={Boolean(confirmAction)}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => {
          if (!confirmAction) return;
          const action = confirmAction.onConfirm;
          setConfirmAction(null);
          void action();
        }}
        title={confirmAction?.title || ''}
        message={confirmAction?.message || ''}
        confirmText={confirmAction?.confirmText || 'Xác nhận'}
        type={confirmAction?.type || 'warning'}
      />

      {credentials && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-on-surface/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[24px] border border-outline-variant/60 bg-surface-container-lowest p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-secondary">Tài khoản đã sẵn sàng</p><h2 className="mt-1 text-xl font-black">{credentials.title}</h2></div><button onClick={() => setCredentials(null)} title="Đóng"><X className="h-5 w-5" /></button></div>
            <Credential label="Mã đăng nhập" value={credentials.loginId} />
            <Credential label="Mật khẩu" value={credentials.password} />
            <p className="mt-4 text-sm text-on-surface-variant">Mật khẩu chỉ hiển thị một lần. Hãy gửi trực tiếp cho học sinh.</p>
            <button onClick={() => void copyCredentials()} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm font-black text-on-secondary"><Copy className="h-4 w-4" />Sao chép thông tin</button>
          </div>
        </div>
      )}
    </div>
  );
};

const Stat = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) => (
  <div className="flex items-center gap-3 rounded-2xl border border-outline-variant/55 bg-surface-container-lowest px-4 py-4 shadow-sm"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div><div className="min-w-0"><p className="truncate text-[11px] font-extrabold uppercase tracking-[0.1em] text-on-surface-variant">{label}</p><p className="mt-1 truncate text-lg font-black">{value}</p></div></div>
);

const Field = ({ label, value, onChange, type = 'text', placeholder, required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; required?: boolean }) => (
  <label className="block text-xs font-bold text-on-surface-variant">{label}<input type={type} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} required={required} className="mt-1.5 h-10 w-full rounded-xl border border-outline-variant/60 bg-surface-container px-3 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/15" /></label>
);

const Credential = ({ label, value }: { label: string; value: string }) => (
  <div className="mb-3 rounded-2xl bg-surface-container p-4"><p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{label}</p><code className="mt-1 block select-all text-base font-black text-on-surface">{value}</code></div>
);

export default SchoolPage;
