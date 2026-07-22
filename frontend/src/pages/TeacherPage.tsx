import React, { useCallback, useEffect, useState } from 'react';
import { BarChart3, BookOpen, CalendarDays, CheckCircle2, ChevronDown, Clock3, Copy, ExternalLink, GraduationCap, KeyRound, Loader2, Mail, Pencil, Plus, Save, Send, UserPlus, Users, Video, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '../components/ConfirmModal';
import MemberDetailsModal from '../components/MemberDetailsModal';
import WorkspaceTopbar from '../components/WorkspaceTopbar';
import { useToast } from '../context/ToastContext';
import { addStudentToClass, Classroom, ClassroomStudent, createClass, getClasses, getClassStudents, updateClass } from '../services/classroomService';
import { createStudent, getMySchool, getSchoolMembers, resetStudentPassword, SchoolMember } from '../services/schoolService';
import { Assignment, AssignmentProgress, createAssignment, getAssignmentProgress, getClassAssignments } from '../services/assignmentService';
import { createEvaluation } from '../services/evaluationService';

type Credentials = { loginId: string; password: string; title: string };
type ApiError = { response?: { data?: { message?: string } } };
type ConfirmAction = {
  title: string;
  message: string;
  confirmText: string;
  type: 'danger' | 'warning' | 'info';
  onConfirm: () => Promise<void> | void;
};

const errorMessage = (error: unknown, fallback: string) => (error as ApiError).response?.data?.message || fallback;
const classStatusLabel = (status: string) => ({ ACTIVE: 'Đang hoạt động', INACTIVE: 'Tạm khóa' }[status] || status);
const assignmentStatusLabel = (status?: string) => ({ ASSIGNED: 'Đã giao', IN_PROGRESS: 'Đang học', COMPLETED: 'Đã hoàn thành' }[status || 'ASSIGNED'] || status || 'Đã giao');

const TeacherPage: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [selected, setSelected] = useState<Classroom | null>(null);
  const [students, setStudents] = useState<ClassroomStudent[]>([]);
  const [schoolStudents, setSchoolStudents] = useState<SchoolMember[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [progress, setProgress] = useState<Record<string, AssignmentProgress[]>>({});
  const [loading, setLoading] = useState(true);
  const [classForm, setClassForm] = useState({ name: '', description: '' });
  const [studentForm, setStudentForm] = useState({ fullName: '', username: '' });
  const [existingStudentId, setExistingStudentId] = useState('');
  const [assignmentForm, setAssignmentForm] = useState({ youtubeUrl: '', title: '', dueDate: '' });
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<SchoolMember | null>(null);
  const [studentPasswords, setStudentPasswords] = useState<Record<string, string>>({});
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [studentAddMode, setStudentAddMode] = useState<'CREATE' | 'EXISTING'>('CREATE');
  const [classEditModalOpen, setClassEditModalOpen] = useState(false);
  const [classEditForm, setClassEditForm] = useState({ name: '', description: '' });
  const [savingClass, setSavingClass] = useState(false);
  const [dueDateEnabled, setDueDateEnabled] = useState(false);

  const loadSchoolStudents = useCallback(async () => {
    try { setSchoolStudents(await getSchoolMembers('STUDENT')); }
    catch { setSchoolStudents([]); }
  }, []);

  const loadClasses = useCallback(async () => {
    try {
      const data = await getClasses();
      setClasses(data);
      setSelected(current => current ? data.find(item => item.id === current.id) || data[0] || null : data[0] || null);
    } catch (error: unknown) {
      showToast(errorMessage(error, 'Không thể tải danh sách lớp'), 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const loadClass = useCallback(async (classroom: Classroom | null) => {
    if (!classroom) { setStudents([]); setAssignments([]); return; }
    try {
      const [studentData, assignmentData] = await Promise.all([getClassStudents(classroom.id), getClassAssignments(classroom.id)]);
      setStudents(studentData);
      setAssignments(assignmentData);
    } catch (error: unknown) {
      showToast(errorMessage(error, 'Không thể tải thông tin lớp'), 'error');
    }
  }, [showToast]);

  useEffect(() => {
    getMySchool()
      .then(school => {
        if (school.role !== 'TEACHER') {
          navigate('/');
          return;
        }
        void loadClasses();
        void loadSchoolStudents();
      })
      .catch(() => navigate('/'));
  }, [loadClasses, loadSchoolStudents, navigate]);
  useEffect(() => { void loadClass(selected); }, [loadClass, selected]);

  const handleCreateClass = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const created = await createClass(classForm.name, classForm.description);
      setClassForm({ name: '', description: '' });
      await loadClasses();
      setSelected(created);
    } catch (error: unknown) { showToast(errorMessage(error, 'Không thể tạo lớp học'), 'error'); }
  };

  const openClassEditor = () => {
    if (!selected) return;
    setClassEditForm({ name: selected.name, description: selected.description || '' });
    setClassEditModalOpen(true);
  };

  const handleUpdateClass = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected || !classEditForm.name.trim() || savingClass) return;
    setSavingClass(true);
    try {
      const updated = await updateClass(selected.id, {
        name: classEditForm.name.trim(),
        description: classEditForm.description.trim(),
      });
      setSelected(updated);
      setClasses(current => current.map(item => item.id === updated.id ? updated : item));
      setClassEditModalOpen(false);
      showToast('Đã cập nhật thông tin lớp học', 'success');
    } catch (error: unknown) {
      showToast(errorMessage(error, 'Không thể cập nhật lớp học'), 'error');
    } finally {
      setSavingClass(false);
    }
  };

  const handleCreateStudent = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    try {
      const created = await createStudent(studentForm.fullName, studentForm.username || undefined);
      await addStudentToClass(selected.id, created.member.userId);
      setStudentForm({ fullName: '', username: '' });
      setStudentPasswords(current => ({ ...current, [created.member.userId]: created.temporaryPassword }));
      setCredentials({ loginId: created.loginId, password: created.temporaryPassword, title: 'Thông tin đăng nhập học sinh' });
      await Promise.all([loadClass(selected), loadSchoolStudents()]);
      setStudentModalOpen(false);
    } catch (error: unknown) { showToast(errorMessage(error, 'Không thể tạo học sinh'), 'error'); }
  };

  const handleEnrollExisting = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected || !existingStudentId) return;
    try {
      await addStudentToClass(selected.id, existingStudentId);
      setExistingStudentId('');
      await loadClass(selected);
      showToast('Đã thêm học sinh vào lớp', 'success');
      setStudentModalOpen(false);
    } catch (error: unknown) { showToast(errorMessage(error, 'Không thể thêm học sinh vào lớp'), 'error'); }
  };

  const resetPassword = async (student: ClassroomStudent) => {
    try {
      const result = await resetStudentPassword(student.id);
      setStudentPasswords(current => ({ ...current, [student.id]: result.temporaryPassword }));
      setCredentials({ loginId: result.loginId, password: result.temporaryPassword, title: 'Mật khẩu mới của học sinh' });
    } catch (error: unknown) { showToast(errorMessage(error, 'Không thể đặt lại mật khẩu'), 'error'); }
  };

  const requestResetPassword = (student: ClassroomStudent) => {
    setConfirmAction({
      title: 'Đặt lại mật khẩu',
      message: `Bạn có chắc muốn tạo mật khẩu mới cho ${student.fullName}? Mật khẩu hiện tại sẽ không còn dùng được.`,
      confirmText: 'Đặt lại mật khẩu',
      type: 'warning',
      onConfirm: () => resetPassword(student),
    });
  };

  const openStudentDetails = (student: ClassroomStudent) => {
    const schoolMember = schoolStudents.find(member => member.userId === student.id);
    setSelectedStudent(schoolMember || {
      id: student.id,
      userId: student.id,
      fullName: student.fullName,
      email: student.email,
      username: student.username,
      avatarUrl: student.avatarUrl,
      role: 'STUDENT',
      status: student.status,
    });
  };

  const copyStudentCredentials = async (member: SchoolMember) => {
    const password = studentPasswords[member.userId];
    if (!password) return;
    await navigator.clipboard.writeText(`Mã đăng nhập: ${member.username || ''}\nMật khẩu: ${password}`);
    showToast('Đã sao chép thông tin đăng nhập', 'success');
  };

  const handleCreateAssignment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    try {
      await createAssignment(selected.id, { ...assignmentForm, dueDate: dueDateEnabled ? assignmentForm.dueDate || undefined : undefined });
      setAssignmentForm({ youtubeUrl: '', title: '', dueDate: '' });
      setDueDateEnabled(false);
      await loadClass(selected);
    } catch (error: unknown) { showToast(errorMessage(error, 'Không thể giao bài học'), 'error'); }
  };

  const updateDueDate = (date: string) => {
    const time = assignmentForm.dueDate.split('T')[1] || '23:59';
    setAssignmentForm(current => ({ ...current, dueDate: date ? `${date}T${time}` : '' }));
  };

  const updateDueTime = (time: string) => {
    const date = assignmentForm.dueDate.split('T')[0];
    if (!date) return;
    setAssignmentForm(current => ({ ...current, dueDate: `${date}T${time || '23:59'}` }));
  };

  const loadProgress = async (assignmentId: string) => {
    if (progress[assignmentId]) {
      setProgress(current => {
        const next = { ...current };
        delete next[assignmentId];
        return next;
      });
      return;
    }
    try {
      const data = await getAssignmentProgress(assignmentId);
      setProgress(current => ({ ...current, [assignmentId]: data }));
    } catch (error: unknown) { showToast(errorMessage(error, 'Không thể tải tiến độ học tập'), 'error'); }
  };

  const evaluate = async (student: ClassroomStudent) => {
    if (!selected) return;
    const scoreText = window.prompt(`Điểm của ${student.fullName} (không bắt buộc)`);
    const comment = window.prompt('Nhận xét') || '';
    if (scoreText === null && !comment) return;
    try {
      await createEvaluation({ classId: selected.id, studentId: student.id, score: scoreText ? Number(scoreText) : undefined, comment });
      showToast('Đã lưu đánh giá', 'success');
    } catch (error: unknown) { showToast(errorMessage(error, 'Không thể lưu đánh giá'), 'error'); }
  };

  const copyCredentials = async () => {
    if (!credentials) return;
    await navigator.clipboard.writeText(`Mã đăng nhập: ${credentials.loginId}\nMật khẩu: ${credentials.password}`);
    showToast('Đã sao chép thông tin đăng nhập', 'success');
  };

  return (
    <div className="min-h-screen bg-background font-sans text-on-surface selection:bg-secondary/15">
      <WorkspaceTopbar currentLabel="Quản lý lớp học" />
      <main className="pb-20">
        <section className="border-b border-outline-variant/40 bg-surface-container-lowest">
          <div className="mx-auto flex max-w-7xl flex-col gap-7 px-4 py-9 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-10">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-secondary/15 bg-secondary/5 px-3 py-1.5 text-xs font-extrabold text-secondary"><Video className="h-3.5 w-3.5" /> Không gian giáo viên</div>
              <h1 className="text-3xl font-black leading-tight sm:text-4xl">Lớp học và bài học video</h1>
              <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-on-surface-variant sm:text-base">Tổ chức lớp, cấp tài khoản học sinh và theo dõi tiến độ học tập trong một không gian làm việc.</p>
            </div>
            <div className="grid grid-cols-2 divide-x divide-outline-variant/50 rounded-2xl border border-outline-variant/50 bg-background px-2 py-4 sm:min-w-[280px]"><TeacherMetric label="Lớp học" value={classes.length} /><TeacherMetric label="Bài đã giao" value={assignments.length} accent /></div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
          {loading ? <div className="flex min-h-[360px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-secondary" /></div> : (
            <div className="grid items-start gap-7 lg:grid-cols-[270px_minmax(0,1fr)]">
              <aside className="space-y-5 lg:sticky lg:top-24">
                <form onSubmit={handleCreateClass} className="rounded-2xl border border-outline-variant/55 bg-surface-container-lowest p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/10 text-secondary"><Plus className="h-4 w-4" /></div><div><h2 className="font-extrabold">Tạo lớp học</h2><p className="text-xs text-on-surface-variant">Bắt đầu một lớp mới</p></div></div>
                  <div className="space-y-3"><FieldInput label="Tên lớp học" placeholder="Ví dụ: VSL 8A" value={classForm.name} onChange={value => setClassForm({ ...classForm, name: value })} required /><label className="block text-xs font-bold text-on-surface-variant">Mô tả lớp học<textarea placeholder="Mục tiêu hoặc ghi chú" value={classForm.description} onChange={event => setClassForm({ ...classForm, description: event.target.value })} className="mt-1.5 min-h-20 w-full resize-y rounded-xl border border-outline-variant/60 bg-surface-container px-3 py-2.5 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant/60 focus:border-secondary focus:ring-2 focus:ring-secondary/15" /></label><button type="submit" className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-secondary px-4 text-sm font-bold text-on-secondary shadow-sm transition hover:bg-on-secondary-fixed-variant focus:outline-none focus:ring-2 focus:ring-secondary/30"><Plus className="h-4 w-4" />Tạo lớp học</button></div>
                </form>
                <div className="overflow-hidden rounded-2xl border border-outline-variant/55 bg-surface-container-lowest shadow-sm">
                  <div className="border-b border-outline-variant/40 px-5 py-4"><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-on-surface-variant">Lớp học của tôi</p></div>
                  {classes.length === 0 ? <p className="px-5 py-8 text-sm text-on-surface-variant">Chưa có lớp học.</p> : classes.map(item => <button type="button" key={item.id} onClick={() => setSelected(item)} className={`flex w-full items-center justify-between gap-3 border-b border-outline-variant/35 px-5 py-4 text-left transition last:border-0 ${selected?.id === item.id ? 'bg-secondary/8 text-secondary' : 'hover:bg-surface-container-low'}`}><div className="min-w-0"><p className="truncate text-sm font-extrabold">{item.name}</p><p className="mt-1 text-xs opacity-70">{classStatusLabel(item.status)}</p></div><span className={`h-2 w-2 shrink-0 rounded-full ${selected?.id === item.id ? 'bg-secondary' : item.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-500'}`} /></button>)}
                </div>
              </aside>

              {!selected ? <section className="flex min-h-[460px] items-center justify-center rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest p-10 text-center"><div><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/10 text-secondary"><GraduationCap className="h-7 w-7" /></div><h2 className="mt-5 text-xl font-extrabold">Chọn một lớp học để bắt đầu</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-on-surface-variant">Tạo lớp mới ở cột bên trái hoặc chọn lớp hiện có để quản lý học sinh và bài học.</p></div></section> : (
                <div className="space-y-7">
                  <section className="overflow-hidden rounded-2xl bg-secondary text-on-secondary shadow-sm"><div className="flex flex-col gap-6 p-6 sm:p-7 md:flex-row md:items-end md:justify-between"><div className="min-w-0"><div className="mb-3 flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-xs font-extrabold"><CheckCircle2 className="h-3.5 w-3.5" />{classStatusLabel(selected.status)}</span><button type="button" onClick={openClassEditor} className="inline-flex h-8 items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 text-xs font-extrabold text-on-secondary transition hover:bg-white/20"><Pencil className="h-3.5 w-3.5" />Chỉnh sửa lớp</button></div><h2 className="truncate text-2xl font-black sm:text-3xl">{selected.name}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-on-secondary/75">{selected.description || 'Chưa có mô tả cho lớp học này.'}</p></div><div className="grid w-full grid-cols-2 divide-x divide-white/20 rounded-xl bg-white/10 px-2 py-3 md:w-auto md:min-w-[240px]"><TeacherMetric label="Học sinh" value={students.length} inverse /><TeacherMetric label="Bài học" value={assignments.length} inverse /></div></div></section>

                  <div className="grid gap-7 xl:grid-cols-[minmax(0,1.15fr)_minmax(300px,.85fr)]">
                    <section className="overflow-hidden rounded-2xl border border-outline-variant/55 bg-surface-container-lowest shadow-sm">
                      <div className="flex flex-col gap-3 border-b border-outline-variant/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <div><h3 className="flex items-center gap-2 font-extrabold"><Users className="h-4 w-4 text-secondary" />Học sinh trong lớp</h3><p className="mt-1 text-xs text-on-surface-variant">Bấm vào học sinh để xem tài khoản và thông tin chi tiết.</p></div>
                        <button type="button" onClick={() => setStudentModalOpen(true)} className="inline-flex h-9 items-center justify-center gap-2 self-start rounded-xl bg-secondary px-3 text-xs font-extrabold text-on-secondary shadow-sm transition hover:bg-on-secondary-fixed-variant sm:self-auto"><UserPlus className="h-4 w-4" />Thêm học sinh</button>
                      </div>
                      <div className="divide-y divide-outline-variant/35">{students.map(student => <div key={student.id} onClick={() => openStudentDetails(student)} className="group grid cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-5 py-4 transition hover:bg-surface-container-low sm:px-6"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-sm font-black text-secondary">{student.fullName.slice(0, 1).toUpperCase()}</div><div className="min-w-0"><div className="flex items-center gap-2"><p className="truncate text-sm font-extrabold">{student.fullName}</p><span className="hidden shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 md:inline-flex">Đang học</span></div><p className="mt-1 truncate text-xs text-on-surface-variant">{student.username || student.email || 'Chưa có mã đăng nhập'}</p></div><div className="flex shrink-0 items-center gap-1"><button type="button" title="Đặt lại mật khẩu" aria-label={`Đặt lại mật khẩu cho ${student.fullName}`} onClick={event => { event.stopPropagation(); requestResetPassword(student); }} className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition hover:bg-primary/10 hover:text-primary"><KeyRound className="h-4 w-4" /></button><button type="button" title="Đánh giá học sinh" aria-label={`Đánh giá ${student.fullName}`} onClick={event => { event.stopPropagation(); void evaluate(student); }} className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition hover:bg-secondary/10 hover:text-secondary"><Mail className="h-4 w-4" /></button></div></div>)}{students.length === 0 && <div className="px-6 py-12 text-center"><Users className="mx-auto h-8 w-8 text-outline" /><p className="mt-3 text-sm font-bold">Chưa có học sinh trong lớp</p><p className="mt-1 text-xs text-on-surface-variant">Dùng nút Thêm học sinh để bắt đầu.</p></div>}</div>
                    </section>

                    <section className="rounded-2xl border border-outline-variant/55 bg-surface-container-lowest shadow-sm">
                      <div className="border-b border-outline-variant/40 px-5 py-4 sm:px-6"><h3 className="flex items-center gap-2 font-extrabold"><Video className="h-4 w-4 text-primary" />Giao bài học YouTube</h3><p className="mt-1 text-xs text-on-surface-variant">Thêm video và thời hạn cho lớp.</p></div>
                      <form onSubmit={handleCreateAssignment} className="space-y-3 p-5 sm:p-6">
                        <FieldInput label="Video YouTube" placeholder="Đường dẫn hoặc mã video" value={assignmentForm.youtubeUrl} onChange={value => setAssignmentForm({ ...assignmentForm, youtubeUrl: value })} required />
                        <FieldInput label="Tên bài học" placeholder="Ví dụ: Câu chào hỏi cơ bản" value={assignmentForm.title} onChange={value => setAssignmentForm({ ...assignmentForm, title: value })} required />
                        {!dueDateEnabled ? (
                          <button type="button" onClick={() => setDueDateEnabled(true)} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary/35 bg-primary/5 px-4 text-sm font-bold text-primary transition hover:border-primary/55 hover:bg-primary/10"><CalendarDays className="h-4 w-4" />Thêm hạn hoàn thành</button>
                        ) : (
                          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                            <div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2 text-xs font-extrabold text-primary"><CalendarDays className="h-4 w-4" />Hạn hoàn thành</div><button type="button" onClick={() => { setDueDateEnabled(false); setAssignmentForm(current => ({ ...current, dueDate: '' })); }} title="Bỏ hạn hoàn thành" className="flex h-7 w-7 items-center justify-center rounded-lg text-on-surface-variant transition hover:bg-error/10 hover:text-error"><X className="h-3.5 w-3.5" /></button></div>
                            <div className="grid grid-cols-2 gap-2">
                              <label className="block text-[11px] font-bold text-on-surface-variant">Ngày<span className="relative mt-1 block"><CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" /><input type="date" value={assignmentForm.dueDate.split('T')[0] || ''} onChange={event => updateDueDate(event.target.value)} required className="h-10 w-full rounded-xl border border-outline-variant/60 bg-surface-container-lowest pl-9 pr-2 text-xs font-semibold text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" /></span></label>
                              <label className="block text-[11px] font-bold text-on-surface-variant">Giờ<span className="relative mt-1 block"><Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" /><input type="time" value={assignmentForm.dueDate.split('T')[1] || '23:59'} onChange={event => updateDueTime(event.target.value)} disabled={!assignmentForm.dueDate.split('T')[0]} className="h-10 w-full rounded-xl border border-outline-variant/60 bg-surface-container-lowest pl-9 pr-2 text-xs font-semibold text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50" /></span></label>
                            </div>
                          </div>
                        )}
                        <button type="submit" className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-on-primary shadow-sm transition hover:bg-on-primary-fixed-variant"><Send className="h-4 w-4" />Giao bài học</button>
                      </form>
                    </section>
                  </div>

                  <section className="rounded-2xl border border-outline-variant/55 bg-surface-container-lowest shadow-sm">
                    <div className="flex items-center justify-between border-b border-outline-variant/40 px-5 py-4 sm:px-6"><div><h3 className="flex items-center gap-2 font-extrabold"><BookOpen className="h-4 w-4 text-primary" />Bài học đã giao</h3><p className="mt-1 text-xs text-on-surface-variant">Theo dõi trạng thái và tiến độ của lớp.</p></div><span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-extrabold text-primary">{assignments.length}</span></div>
                    <div className="divide-y divide-outline-variant/35">
                      {assignments.map(assignment => (
                        <div key={assignment.id} className="p-5 sm:p-6">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <a href={`https://www.youtube.com/watch?v=${assignment.youtubeVideoId}`} target="_blank" rel="noreferrer" className="inline-flex min-w-0 items-center gap-1.5 text-sm font-extrabold text-on-surface transition hover:text-primary hover:underline sm:text-base"><span className="truncate">{assignment.title}</span><ExternalLink className="h-3.5 w-3.5 shrink-0" /></a>
                            <button type="button" onClick={() => void loadProgress(assignment.id)} className="inline-flex h-9 shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-outline-variant/60 px-3 text-xs font-extrabold text-on-surface-variant transition hover:border-primary/40 hover:text-primary"><BarChart3 className="h-4 w-4" />{progress[assignment.id] ? 'Ẩn tiến độ' : 'Xem tiến độ'}</button>
                          </div>
                          {progress[assignment.id] && (
                            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                              {progress[assignment.id].map(item => {
                                const studentName = students.find(student => student.id === item.studentId)?.fullName
                                  || schoolStudents.find(student => student.userId === item.studentId)?.fullName
                                  || 'Học sinh';
                                return <div key={item.id} className="flex items-center gap-2 rounded-xl bg-surface-container-low px-3 py-2.5 text-xs"><CheckCircle2 className={`h-4 w-4 shrink-0 ${item.status === 'COMPLETED' ? 'text-secondary' : 'text-on-surface-variant'}`} /><span className="min-w-0 flex-1 truncate font-bold">{studentName}</span><span className="shrink-0 text-on-surface-variant">{assignmentStatusLabel(item.status)}</span></div>;
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                      {assignments.length === 0 && <p className="px-6 py-12 text-center text-sm text-on-surface-variant">Chưa có bài học được giao.</p>}
                    </div>
                  </section>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      {classEditModalOpen && selected && (
        <div className="fixed inset-0 z-[170] flex items-center justify-center bg-on-surface/50 p-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-labelledby="class-edit-title" className="w-full max-w-lg overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-container-lowest shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-outline-variant/40 px-5 py-5 sm:px-6">
              <div><p className="text-xs font-extrabold uppercase tracking-[0.12em] text-secondary">Thông tin lớp học</p><h2 id="class-edit-title" className="mt-1 text-xl font-black">Chỉnh sửa lớp</h2><p className="mt-1 text-sm text-on-surface-variant">Cập nhật tên và mô tả hiển thị của lớp.</p></div>
              <button type="button" onClick={() => setClassEditModalOpen(false)} title="Đóng" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-on-surface-variant transition hover:bg-surface-container hover:text-on-surface"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleUpdateClass} className="space-y-4 p-5 sm:p-6">
              <FieldInput label="Tên lớp học" placeholder="Nhập tên lớp học" value={classEditForm.name} onChange={value => setClassEditForm(current => ({ ...current, name: value }))} required />
              <label className="block text-xs font-bold text-on-surface-variant">Mô tả lớp học<textarea value={classEditForm.description} onChange={event => setClassEditForm(current => ({ ...current, description: event.target.value }))} placeholder="Mục tiêu hoặc ghi chú của lớp" className="mt-1.5 min-h-28 w-full resize-y rounded-xl border border-outline-variant/60 bg-surface-container px-3 py-2.5 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant/60 focus:border-secondary focus:ring-2 focus:ring-secondary/15" /></label>
              <div className="grid grid-cols-2 gap-3 pt-1"><button type="button" onClick={() => setClassEditModalOpen(false)} disabled={savingClass} className="h-11 rounded-xl border border-outline-variant/60 bg-surface-container text-sm font-bold text-on-surface-variant transition hover:border-secondary/35 hover:text-secondary disabled:opacity-50">Hủy</button><button type="submit" disabled={savingClass} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-secondary px-4 text-sm font-bold text-on-secondary shadow-sm transition hover:bg-on-secondary-fixed-variant disabled:cursor-not-allowed disabled:opacity-50">{savingClass ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Lưu thay đổi</button></div>
            </form>
          </div>
        </div>
      )}
      {studentModalOpen && selected && (
        <div className="fixed inset-0 z-[170] flex items-center justify-center bg-on-surface/50 p-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-labelledby="student-modal-title" className="w-full max-w-lg overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-container-lowest shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-outline-variant/40 px-5 py-5 sm:px-6">
              <div><p className="text-xs font-extrabold uppercase tracking-[0.12em] text-secondary">{selected.name}</p><h2 id="student-modal-title" className="mt-1 text-xl font-black">Thêm học sinh vào lớp</h2><p className="mt-1 text-sm text-on-surface-variant">Tạo tài khoản mới hoặc chọn học sinh đã có trong trường.</p></div>
              <button type="button" onClick={() => setStudentModalOpen(false)} title="Đóng" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-on-surface-variant transition hover:bg-surface-container hover:text-on-surface"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-5 sm:p-6">
              <div className="mb-5 grid grid-cols-2 rounded-xl bg-surface-container p-1">
                <button type="button" onClick={() => setStudentAddMode('CREATE')} className={`h-10 rounded-lg text-xs font-extrabold transition ${studentAddMode === 'CREATE' ? 'bg-surface-container-lowest text-secondary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}>Tạo tài khoản mới</button>
                <button type="button" onClick={() => setStudentAddMode('EXISTING')} className={`h-10 rounded-lg text-xs font-extrabold transition ${studentAddMode === 'EXISTING' ? 'bg-surface-container-lowest text-secondary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}>Học sinh đã có</button>
              </div>
              {studentAddMode === 'CREATE' ? (
                <form onSubmit={handleCreateStudent} className="space-y-4">
                  <FieldInput label="Họ và tên" placeholder="Nhập họ tên học sinh" value={studentForm.fullName} onChange={value => setStudentForm({ ...studentForm, fullName: value })} required />
                  <FieldInput label="Mã đăng nhập" placeholder="Để trống để hệ thống tự tạo" value={studentForm.username} onChange={value => setStudentForm({ ...studentForm, username: value })} />
                  <button type="submit" className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-secondary px-4 text-sm font-bold text-on-secondary shadow-sm transition hover:bg-on-secondary-fixed-variant"><UserPlus className="h-4 w-4" />Tạo và thêm vào lớp</button>
                </form>
              ) : (
                <form onSubmit={handleEnrollExisting} className="space-y-4">
                  <label className="block text-xs font-bold text-on-surface-variant">Học sinh trong trường<span className="relative mt-1.5 block"><select value={existingStudentId} onChange={event => setExistingStudentId(event.target.value)} className="h-11 w-full appearance-none rounded-xl border border-outline-variant/60 bg-surface-container px-3 pr-10 text-sm font-medium text-on-surface outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/15" required><option value="">Chọn một học sinh</option>{schoolStudents.map(student => <option key={student.userId} value={student.userId}>{student.fullName} ({student.username || 'chưa có mã'})</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" /></span></label>
                  <button type="submit" className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-secondary px-4 text-sm font-bold text-on-secondary shadow-sm transition hover:bg-on-secondary-fixed-variant"><Plus className="h-4 w-4" />Thêm vào lớp</button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
      <MemberDetailsModal
        member={selectedStudent}
        studentPassword={selectedStudent ? studentPasswords[selectedStudent.userId] : undefined}
        onClose={() => setSelectedStudent(null)}
        onResetPassword={selectedStudent ? () => {
          const student = students.find(item => item.id === selectedStudent.userId);
          if (student) requestResetPassword(student);
        } : undefined}
        onCopyCredentials={selectedStudent && studentPasswords[selectedStudent.userId] ? () => void copyStudentCredentials(selectedStudent) : undefined}
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-on-surface/50 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-[24px] border border-outline-variant/60 bg-surface-container-lowest p-6 shadow-2xl"><div className="mb-5 flex items-start justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-secondary">Tài khoản đã sẵn sàng</p><h2 className="mt-1 text-xl font-black">{credentials.title}</h2></div><button onClick={() => setCredentials(null)} title="Đóng"><X className="h-5 w-5" /></button></div><Credential label="Mã đăng nhập" value={credentials.loginId} /><Credential label="Mật khẩu" value={credentials.password} /><p className="mt-4 text-sm text-on-surface-variant">Hãy gửi trực tiếp thông tin này cho học sinh.</p><button onClick={() => void copyCredentials()} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm font-black text-on-secondary"><Copy className="h-4 w-4" />Sao chép thông tin</button></div></div>
      )}
    </div>
  );
};

const TeacherMetric = ({ label, value, accent = false, inverse = false }: { label: string; value: React.ReactNode; accent?: boolean; inverse?: boolean }) => (
  <div className="px-3 text-center"><p className={`text-xl font-black ${inverse ? 'text-on-secondary' : accent ? 'text-secondary' : 'text-on-surface'}`}>{value}</p><p className={`mt-1 text-[11px] font-bold ${inverse ? 'text-on-secondary/70' : 'text-on-surface-variant'}`}>{label}</p></div>
);

const FieldInput = ({ label, value, onChange, placeholder, required = false }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; required?: boolean }) => (
  <label className="block text-xs font-bold text-on-surface-variant">{label}<input type="text" value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} required={required} className="mt-1.5 h-10 w-full rounded-xl border border-outline-variant/60 bg-surface-container px-3 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant/60 focus:border-secondary focus:ring-2 focus:ring-secondary/15" /></label>
);

const Credential = ({ label, value }: { label: string; value: string }) => <div className="mb-3 rounded-2xl bg-surface-container p-4"><p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{label}</p><code className="mt-1 block select-all text-base font-black text-on-surface">{value}</code></div>;

export default TeacherPage;
