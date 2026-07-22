import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarClock, Calculator, CircleGauge, Cpu, ExternalLink, GraduationCap, Loader2, RefreshCw, Save, ShoppingCart, Sparkles, UserRound, Video } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getSchoolAiUsage, updateSchoolDailyAiLimits, type SchoolAiUsage } from '../services/aiUsageService';

const AI_USAGE_TOP_UP_PLAN = {
  id: 'ai-usage-top-up-1000',
  purchaseType: 'AI_USAGE_TOP_UP',
  planType: 'ai-usage-top-up',
  name: 'Mua thêm 1.000 phút AI',
  price: '399,000',
  duration: 'chu kỳ hiện tại',
  badge: 'Bổ sung quota',
};

interface AiUsageDashboardProps {
  people: Array<{ id: string; fullName: string; role: string; status: string }>;
}

const AiUsageDashboard: React.FC<AiUsageDashboardProps> = ({ people }) => {
  const navigate = useNavigate();
  const [usage, setUsage] = useState<SchoolAiUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [teacherDailyMinutes, setTeacherDailyMinutes] = useState(0);
  const [studentDailyMinutes, setStudentDailyMinutes] = useState(0);
  const [savingLimits, setSavingLimits] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const activeTeacherCount = useMemo(() => people.filter(person => person.role === 'TEACHER' && person.status === 'ACTIVE').length, [people]);
  const activeStudentCount = useMemo(() => people.filter(person => person.role === 'STUDENT' && person.status === 'ACTIVE').length, [people]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getSchoolAiUsage();
      setUsage(result);
      setTeacherDailyMinutes(result.teacherDailyLimitMinutes || 0);
      setStudentDailyMinutes(result.studentDailyLimitMinutes || 0);
    } catch (requestError: unknown) {
      const message = (requestError as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(message || 'Không thể tải AI Usage của trường.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const namesById = useMemo(() => new Map(people.map(person => [person.id, person.fullName])), [people]);
  const chartPoints = useMemo(() => usage?.dailyUsage.slice(-14) || [], [usage]);
  const chartMaximum = Math.max(1, ...chartPoints.map(point => point.usedSeconds));

  const saveDailyLimits = async () => {
    const teacherMinutes = clampWholeNumber(teacherDailyMinutes, 0, 1440);
    const studentMinutes = clampWholeNumber(studentDailyMinutes, 0, 1440);
    setTeacherDailyMinutes(teacherMinutes);
    setStudentDailyMinutes(studentMinutes);
    setSavingLimits(true);
    setSaveMessage('');
    try {
      const result = await updateSchoolDailyAiLimits(teacherMinutes, studentMinutes);
      setUsage(result);
      setSaveMessage('Đã lưu giới hạn AI Usage mỗi ngày.');
    } catch (requestError: unknown) {
      const message = (requestError as { response?: { data?: { message?: string } } }).response?.data?.message;
      setSaveMessage(message || 'Không thể lưu giới hạn AI Usage.');
    } finally {
      setSavingLimits(false);
    }
  };

  if (loading) {
    return <div className="flex min-h-[360px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!usage || error) {
    return (
      <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest px-6 py-14 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-error" />
        <p className="mt-3 text-sm font-bold">{error || 'Chưa có dữ liệu AI Usage.'}</p>
        <button type="button" onClick={() => void load()} className="mt-4 inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-extrabold text-on-primary"><RefreshCw className="h-4 w-4" />Thử lại</button>
      </div>
    );
  }

  const totalLimit = usage.limitSeconds + usage.additionalSeconds;
  const consumedSeconds = usage.usedSeconds + usage.reservedSeconds;
  const critical = usage.remainingSeconds <= 0;
  const warning = usage.usagePercent >= 80;
  const resetDate = formatDate(usage.periodEnd);
  const normalizedTeacherCount = activeTeacherCount;
  const normalizedStudentCount = activeStudentCount;
  const teacherUnlimited = normalizedTeacherCount > 0 && teacherDailyMinutes === 0;
  const studentUnlimited = normalizedStudentCount > 0 && studentDailyMinutes === 0;
  const projectionUnavailable = teacherUnlimited || studentUnlimited;
  const missingDailyLimitLabels = [
    teacherUnlimited ? 'giáo viên' : '',
    studentUnlimited ? 'học sinh' : '',
  ].filter(Boolean);
  const projectedDailyMinutes = teacherDailyMinutes * normalizedTeacherCount
    + studentDailyMinutes * normalizedStudentCount;
  const projectedMonthlyMinutes = projectedDailyMinutes * 30;
  const projectedYearlyMinutes = projectedDailyMinutes * 365;
  const packageMonthlyMinutes = Math.floor(totalLimit / 60);
  const packageYearlyMinutes = packageMonthlyMinutes * 12;
  const todayMemberUsage = usage.todayMemberUsage || [];

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 border-b border-outline-variant/45 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-extrabold text-primary"><Cpu className="h-4 w-4" />AI Usage</div>
          <h2 className="mt-2 text-2xl font-black">Mức sử dụng AI của trường</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">AI Usage là thời lượng video mới mà Signify phải dùng AI để xử lý. Video đã xử lý hoặc lấy từ cache sẽ không bị trừ thêm.</p>
        </div>
        <button type="button" onClick={() => void load()} title="Làm mới AI Usage" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-outline-variant/55 bg-surface-container-lowest text-on-surface-variant transition hover:text-primary"><RefreshCw className="h-4 w-4" /></button>
      </section>

      {(warning || critical) && (
        <section className={`flex flex-col gap-4 rounded-2xl border px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${critical ? 'border-error/30 bg-error/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
          <div className="flex items-start gap-3"><AlertTriangle className={`mt-0.5 h-5 w-5 shrink-0 ${critical ? 'text-error' : 'text-amber-700'}`} /><div><p className="text-sm font-extrabold">{critical ? 'Đã dùng hết AI Usage tháng này' : 'AI Usage sắp đạt giới hạn'}</p><p className="mt-1 text-xs leading-5 text-on-surface-variant">{critical ? 'Mua thêm 1.000 phút với giá 399.000đ để tiếp tục xử lý video mới trong chu kỳ này.' : `Tổ chức đã dùng ${usage.usagePercent.toFixed(1)}% quota của chu kỳ hiện tại.`}</p></div></div>
          {critical ? (
            <button type="button" onClick={() => navigate('/payment', { state: { plan: AI_USAGE_TOP_UP_PLAN } })} className="inline-flex min-h-9 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-extrabold text-on-primary"><ShoppingCart className="h-3.5 w-3.5" />Mua thêm 1.000 phút</button>
          ) : (
            <Link to="/packages" className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-extrabold text-on-primary"><ExternalLink className="h-3.5 w-3.5" />Xem gói</Link>
          )}
        </section>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <UsageMetric icon={CircleGauge} label="Đã dùng kỳ này" value={formatDuration(consumedSeconds)} detail={`trên ${formatDuration(totalLimit)}`} />
        <UsageMetric icon={Sparkles} label="Còn lại" value={formatDuration(usage.remainingSeconds)} detail={`${Math.max(0, 100 - usage.usagePercent).toFixed(1)}% quota`} />
        <UsageMetric icon={Video} label="Video mới" value={usage.processedVideoCount.toLocaleString('vi-VN')} detail="đã xử lý trong kỳ" />
        <UsageMetric icon={CalendarClock} label="Cấp lại quota" value={resetDate} detail={usage.packageName} />
      </div>

      <section className="rounded-2xl border border-outline-variant/55 bg-surface-container-lowest p-5 shadow-sm sm:p-6">
        <div className="flex items-end justify-between gap-4"><div><h3 className="font-extrabold">Tiến độ quota</h3><p className="mt-1 text-xs text-on-surface-variant">Bao gồm {formatDuration(usage.reservedSeconds)} đang được giữ cho video đang xử lý.</p></div><span className={`text-xl font-black ${critical ? 'text-error' : warning ? 'text-amber-700' : 'text-primary'}`}>{usage.usagePercent.toFixed(1)}%</span></div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-surface-container-high"><div className={`h-full rounded-full transition-all ${critical ? 'bg-error' : warning ? 'bg-amber-500' : 'bg-primary'}`} style={{ width: `${Math.min(100, usage.usagePercent)}%` }} /></div>
        <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs font-semibold text-on-surface-variant"><span>{formatDuration(consumedSeconds)} đã dùng</span><span>{formatDuration(totalLimit)} tổng quota{usage.additionalSeconds > 0 ? `, gồm ${formatDuration(usage.additionalSeconds)} mua thêm` : ''}</span></div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-outline-variant/55 bg-surface-container-lowest p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div><div className="flex items-center gap-2"><CalendarClock className="h-4 w-4 text-primary" /><h3 className="font-extrabold">Giới hạn theo ngày</h3></div><p className="mt-2 text-xs leading-5 text-on-surface-variant">Nhập số phút tối đa cho 1 người trong 1 ngày. Ví dụ: 120 nghĩa là mỗi người được dùng 120 phút/ngày. Nhập 0 để không giới hạn.</p></div>
            <button type="button" onClick={() => void saveDailyLimits()} disabled={savingLimits} title="Lưu giới hạn theo ngày" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary transition hover:bg-on-primary-fixed-variant disabled:opacity-50">{savingLimits ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}</button>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <NumberField id="teacher-daily-ai-minutes" icon={GraduationCap} label="1 giáo viên được dùng" value={teacherDailyMinutes} onChange={setTeacherDailyMinutes} max={1440} suffix="phút/ngày" />
            <NumberField id="student-daily-ai-minutes" icon={UserRound} label="1 học sinh được dùng" value={studentDailyMinutes} onChange={setStudentDailyMinutes} max={1440} suffix="phút/ngày" />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant/40 pt-4 text-xs text-on-surface-variant"><span>Cấp lại lúc {formatTime(usage.dailyQuotaResetsAt)} mỗi ngày.</span>{saveMessage && <span className="font-bold text-primary">{saveMessage}</span>}</div>
        </section>

        <section className="rounded-2xl border border-outline-variant/55 bg-surface-container-lowest p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-2"><Calculator className="h-4 w-4 text-primary" /><h3 className="font-extrabold">Tính nhanh nhu cầu quota</h3></div>
          <p className="mt-2 text-xs leading-5 text-on-surface-variant">Số người được lấy tự động từ các thành viên đang hoạt động trong trường và nhân với giới hạn phút/người/ngày.</p>
          <div className="mt-4 grid grid-cols-2 divide-x divide-outline-variant/45 border-y border-outline-variant/45 py-3">
            <div className="flex min-w-0 items-center gap-3 pr-4"><GraduationCap className="h-4 w-4 shrink-0 text-primary" /><div className="min-w-0"><p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-on-surface-variant">Giáo viên hoạt động</p><p className="mt-1 text-lg font-black">{activeTeacherCount.toLocaleString('vi-VN')}</p></div></div>
            <div className="flex min-w-0 items-center gap-3 pl-4"><UserRound className="h-4 w-4 shrink-0 text-primary" /><div className="min-w-0"><p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-on-surface-variant">Học sinh hoạt động</p><p className="mt-1 text-lg font-black">{activeStudentCount.toLocaleString('vi-VN')}</p></div></div>
          </div>
          <div className="grid grid-cols-3 divide-x divide-outline-variant/45 border-b border-outline-variant/45 py-4 text-center">
            <ProjectionMetric label="1 ngày" value={projectionUnavailable ? 'Chưa thể tính' : formatMinutes(projectedDailyMinutes)} detail={projectionUnavailable ? 'Thiếu giới hạn' : formatRawMinutes(projectedDailyMinutes)} />
            <ProjectionMetric label="1 tháng" value={projectionUnavailable ? 'Chưa thể tính' : formatMinutes(projectedMonthlyMinutes)} detail={projectionUnavailable ? 'Thiếu giới hạn' : formatRawMinutes(projectedMonthlyMinutes)} />
            <ProjectionMetric label="1 năm" value={projectionUnavailable ? 'Chưa thể tính' : formatMinutes(projectedYearlyMinutes)} detail={projectionUnavailable ? 'Thiếu giới hạn' : formatRawMinutes(projectedYearlyMinutes)} />
          </div>
          {projectionUnavailable ? (
            <div className="mt-4 flex flex-col gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="text-xs font-extrabold text-amber-800">Thiếu giới hạn của {missingDailyLimitLabels.join(' và ')}</p><p className="mt-1 text-xs leading-5 text-on-surface-variant">Hãy nhập số phút lớn hơn 0 tại phần Giới hạn theo ngày để hệ thống có số liệu tính toán.</p></div>
              <button type="button" onClick={() => document.getElementById(teacherUnlimited ? 'teacher-daily-ai-minutes' : 'student-daily-ai-minutes')?.focus()} className="h-9 shrink-0 rounded-lg bg-primary px-3 text-xs font-extrabold text-on-primary">Nhập giới hạn</button>
            </div>
          ) : (
            <div className="mt-4 space-y-2 text-xs leading-5 text-on-surface-variant">
              <p><span className="font-extrabold text-on-surface">Cách tính 1 ngày:</span> ({normalizedTeacherCount} giáo viên × {teacherDailyMinutes} phút) + ({normalizedStudentCount} học sinh × {studentDailyMinutes} phút) = <span className="font-extrabold text-primary">{formatDetailedMinutes(projectedDailyMinutes)}</span>.</p>
              <p><span className="font-extrabold text-on-surface">Kết quả:</span> 1 tháng = {formatRawMinutes(projectedDailyMinutes)} × 30 ngày = <span className="font-extrabold text-primary">{formatDetailedMinutes(projectedMonthlyMinutes)}</span>; 1 năm = {formatRawMinutes(projectedDailyMinutes)} × 365 ngày = <span className="font-extrabold text-primary">{formatDetailedMinutes(projectedYearlyMinutes)}</span>.</p>
              <p className={projectedMonthlyMinutes > packageMonthlyMinutes ? 'font-bold text-amber-700' : ''}>Gói hiện tại cấp {formatDetailedMinutes(packageMonthlyMinutes)}/tháng và {formatDetailedMinutes(packageYearlyMinutes)}/12 tháng. Ước tính này {projectedMonthlyMinutes > packageMonthlyMinutes ? 'vượt' : 'nằm trong'} quota tháng của gói.</p>
            </div>
          )}
        </section>
      </div>

      <section className="overflow-hidden rounded-2xl border border-outline-variant/55 bg-surface-container-lowest shadow-sm">
        <div className="border-b border-outline-variant/40 px-5 py-4 sm:px-6"><h3 className="font-extrabold">Sử dụng hôm nay</h3><p className="mt-1 text-xs text-on-surface-variant">Quota của từng thành viên được tính lại từ 00:00 mỗi ngày.</p></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left">
            <thead className="bg-surface-container-low text-[10px] font-extrabold uppercase tracking-[0.12em] text-on-surface-variant"><tr><th className="px-5 py-3 sm:px-6">Thành viên</th><th className="px-5 py-3">Vai trò</th><th className="px-5 py-3">Đã dùng</th><th className="px-5 py-3 text-right sm:px-6">Còn lại</th></tr></thead>
            <tbody className="divide-y divide-outline-variant/35">
              {todayMemberUsage.map(member => {
                const consumed = member.usedSeconds + member.reservedSeconds;
                return <tr key={member.userId}><td className="px-5 py-3.5 text-sm font-bold sm:px-6">{namesById.get(member.userId) || 'Thành viên trường'}</td><td className="px-5 py-3.5 text-xs font-semibold text-on-surface-variant">{member.role === 'TEACHER' ? 'Giáo viên' : 'Học sinh'}</td><td className="px-5 py-3.5 text-xs font-extrabold text-primary">{formatDuration(consumed)}</td><td className="px-5 py-3.5 text-right text-xs font-semibold sm:px-6">{member.limitSeconds === 0 ? 'Không giới hạn' : formatDuration(member.remainingSeconds)}</td></tr>;
              })}
              {todayMemberUsage.length === 0 && <tr><td colSpan={4} className="px-6 py-10 text-center text-sm text-on-surface-variant">Chưa có giáo viên hoặc học sinh phát sinh AI Usage hôm nay.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <section className="rounded-2xl border border-outline-variant/55 bg-surface-container-lowest p-5 shadow-sm sm:p-6">
          <div><h3 className="font-extrabold">14 ngày gần nhất</h3><p className="mt-1 text-xs text-on-surface-variant">Phút AI phát sinh theo ngày hoàn tất xử lý.</p></div>
          <div className="mt-6 grid h-48 grid-cols-14 items-end gap-1.5" aria-label="Biểu đồ AI Usage 14 ngày">
            {chartPoints.map(point => {
              const height = point.usedSeconds === 0 ? 3 : Math.max(8, Math.round(point.usedSeconds * 100 / chartMaximum));
              return <div key={point.date} className="group flex h-full min-w-0 items-end" title={`${formatShortDate(point.date)}: ${formatDuration(point.usedSeconds)}`}><div className="w-full rounded-t-sm bg-primary/75 transition hover:bg-primary" style={{ height: `${height}%` }} /></div>;
            })}
          </div>
          <div className="mt-2 flex justify-between text-[10px] font-semibold text-on-surface-variant"><span>{chartPoints[0] ? formatShortDate(chartPoints[0].date) : '-'}</span><span>{chartPoints.at(-1) ? formatShortDate(chartPoints.at(-1)!.date) : '-'}</span></div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-outline-variant/55 bg-surface-container-lowest shadow-sm">
          <div className="border-b border-outline-variant/40 px-5 py-4 sm:px-6"><h3 className="font-extrabold">Video phát sinh AI Usage</h3><p className="mt-1 text-xs text-on-surface-variant">Các video mới được xử lý gần nhất trong chu kỳ.</p></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left">
              <thead className="bg-surface-container-low text-[10px] font-extrabold uppercase tracking-[0.12em] text-on-surface-variant"><tr><th className="px-5 py-3 sm:px-6">Video</th><th className="px-5 py-3">Người yêu cầu</th><th className="px-5 py-3">AI Usage</th><th className="px-5 py-3 text-right sm:px-6">Thời gian</th></tr></thead>
              <tbody className="divide-y divide-outline-variant/35">
                {usage.recentVideos.map(video => <tr key={video.processingId}><td className="max-w-[280px] px-5 py-3.5 sm:px-6"><p className="truncate text-sm font-bold">{video.videoTitle || video.videoId}</p><p className="mt-1 truncate text-xs text-on-surface-variant">{video.channelName || 'YouTube'}</p></td><td className="px-5 py-3.5 text-xs font-semibold">{namesById.get(video.requestedBy) || 'Thành viên trường'}</td><td className="px-5 py-3.5 text-xs font-extrabold text-primary">{formatDuration(video.durationSeconds)}</td><td className="px-5 py-3.5 text-right text-xs text-on-surface-variant sm:px-6">{formatDateTime(video.completedAt)}</td></tr>)}
                {usage.recentVideos.length === 0 && <tr><td colSpan={4} className="px-6 py-12 text-center text-sm text-on-surface-variant">Chưa có video mới phát sinh AI Usage trong chu kỳ này.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

const NumberField = ({ id, icon: Icon, label, value, onChange, max, suffix }: { id?: string; icon: React.ElementType; label: string; value: number; onChange: (value: number) => void; max: number; suffix: string }) => (
  <label className="block min-w-0">
    <span className="mb-2 flex items-center gap-2 text-xs font-extrabold text-on-surface-variant"><Icon className="h-3.5 w-3.5 text-primary" />{label}</span>
    <span className="flex h-11 items-center overflow-hidden rounded-xl border border-outline-variant/60 bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
      <input id={id} type="number" min={0} max={max} step={1} value={value} onChange={event => onChange(clampWholeNumber(Number(event.target.value), 0, max))} className="h-full min-w-0 flex-1 appearance-none bg-transparent px-3 text-sm font-extrabold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
      <span className="shrink-0 border-l border-outline-variant/45 px-3 text-[11px] font-bold text-on-surface-variant">{suffix}</span>
    </span>
  </label>
);

const ProjectionMetric = ({ label, value, detail }: { label: string; value: string; detail: string }) => (
  <div className="min-w-0 px-2"><p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-on-surface-variant">{label}</p><p className="mt-1 break-words text-xs font-black sm:text-sm">{value}</p><p className="mt-1 break-words text-[10px] text-on-surface-variant">{detail}</p></div>
);

const UsageMetric = ({ icon: Icon, label, value, detail }: { icon: React.ElementType; label: string; value: string; detail: string }) => (
  <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-outline-variant/55 bg-surface-container-lowest px-4 py-4 shadow-sm"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div><div className="min-w-0"><p className="truncate text-[11px] font-extrabold uppercase tracking-[0.08em] text-on-surface-variant">{label}</p><p className="mt-1 truncate text-lg font-black">{value}</p><p className="truncate text-[11px] text-on-surface-variant">{detail}</p></div></div>
);

const formatDuration = (seconds: number) => {
  const minutes = Math.ceil(Math.max(0, seconds) / 60);
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return remainder > 0 ? `${hours.toLocaleString('vi-VN')} giờ ${remainder} phút` : `${hours.toLocaleString('vi-VN')} giờ`;
  }
  return `${minutes.toLocaleString('vi-VN')} phút`;
};

const formatMinutes = (minutes: number) => {
  const normalized = Math.max(0, Math.round(minutes));
  if (normalized >= 60) {
    const hours = normalized / 60;
    return `${hours.toLocaleString('vi-VN', { maximumFractionDigits: hours < 100 ? 1 : 0 })} giờ`;
  }
  return `${normalized.toLocaleString('vi-VN')} phút`;
};

const formatRawMinutes = (minutes: number) => `${Math.max(0, Math.round(minutes)).toLocaleString('vi-VN')} phút`;
const formatDetailedMinutes = (minutes: number) => {
  const raw = formatRawMinutes(minutes);
  return minutes >= 60 ? `${raw} (${formatMinutes(minutes)})` : raw;
};

const clampWholeNumber = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? Math.round(value) : min));

const formatDate = (value: string) => new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
const formatShortDate = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
const formatDateTime = (value: string) => new Date(value).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
const formatTime = (value: string) => new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

export default AiUsageDashboard;
