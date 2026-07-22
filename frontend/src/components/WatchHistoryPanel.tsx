import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock3, ExternalLink, Eye, Loader2, RotateCcw, Search, SlidersHorizontal, UserRound, Users, Video } from 'lucide-react';
import CustomSelect, { type CustomSelectOption } from './CustomSelect';
import {
  getSchoolWatchHistory,
  getSchoolWatchHistorySummary,
  getStudentWatchHistory,
  getStudentWatchHistorySummary,
  type WatchHistoryItem,
  type WatchHistoryPage,
  type WatchHistorySummary,
} from '../services/watchHistoryService';

type HistoryPerson = { id: string; fullName: string; role?: string };

interface WatchHistoryPanelProps {
  scope: 'school' | 'student';
  people: HistoryPerson[];
  classId?: string;
}

const emptyPage: WatchHistoryPage = { content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 };
const emptySummary: WatchHistorySummary = { totalViewers: 0, uniqueVideos: 0, totalWatchedSeconds: 0, totalViews: 0 };

const WatchHistoryPanel: React.FC<WatchHistoryPanelProps> = ({ scope, people, classId }) => {
  const [history, setHistory] = useState<WatchHistoryPage>(emptyPage);
  const [summary, setSummary] = useState<WatchHistorySummary>(emptySummary);
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [role, setRole] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (scope !== 'student') return;
    if (!people.some(person => person.id === selectedPersonId)) {
      setSelectedPersonId(people[0]?.id || '');
      setPage(0);
    }
  }, [people, scope, selectedPersonId]);

  const visiblePeople = useMemo(() => {
    if (!role) return people;
    return people.filter(person => person.role === role);
  }, [people, role]);

  useEffect(() => {
    if (selectedPersonId && !visiblePeople.some(person => person.id === selectedPersonId)) {
      setSelectedPersonId('');
    }
  }, [selectedPersonId, visiblePeople]);

  const load = useCallback(async () => {
    if (scope === 'student' && !selectedPersonId) {
      setHistory(emptyPage);
      setSummary(emptySummary);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const filters = {
        keyword: keyword || undefined,
        from: from || undefined,
        to: to || undefined,
        page,
        size: 20,
      };
      if (scope === 'school') {
        const [pageData, summaryData] = await Promise.all([
          getSchoolWatchHistory({
            ...filters,
            role: role || undefined,
            userId: selectedPersonId || undefined,
            classId: classId || undefined,
          }),
          getSchoolWatchHistorySummary(),
        ]);
        setHistory(pageData);
        setSummary(summaryData);
      } else {
        const [pageData, summaryData] = await Promise.all([
          getStudentWatchHistory(selectedPersonId, filters),
          getStudentWatchHistorySummary(selectedPersonId),
        ]);
        setHistory(pageData);
        setSummary(summaryData);
      }
    } catch (requestError) {
      const message = (requestError as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(message || 'Không thể tải lịch sử xem.');
      setHistory(emptyPage);
      setSummary(emptySummary);
    } finally {
      setLoading(false);
    }
  }, [classId, from, keyword, page, role, scope, selectedPersonId, to]);

  useEffect(() => { void load(); }, [load]);

  const applySearch = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(0);
    setKeyword(searchInput.trim());
  };

  const clearFilters = () => {
    setRole('');
    if (scope === 'school') setSelectedPersonId('');
    setSearchInput('');
    setKeyword('');
    setFrom('');
    setTo('');
    setPage(0);
  };

  const hasActiveFilters = Boolean(role || (scope === 'school' && selectedPersonId) || searchInput || keyword || from || to);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric icon={Users} label="Người đã xem" value={summary.totalViewers} />
        <Metric icon={Video} label="Video khác nhau" value={summary.uniqueVideos} />
        <Metric icon={Eye} label="Lượt xem" value={summary.totalViews} />
        <Metric icon={Clock3} label="Tổng thời gian" value={formatDuration(summary.totalWatchedSeconds)} />
      </div>

      <section className="overflow-hidden rounded-2xl border border-outline-variant/55 bg-surface-container-lowest shadow-sm">
        <div className="border-b border-outline-variant/40 bg-surface-container-low/45 p-4 sm:p-5">
          <div className="mb-4 flex min-h-8 items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-extrabold text-on-surface"><SlidersHorizontal className="h-4 w-4 text-primary" />Bộ lọc lịch sử</div>
            <button type="button" onClick={clearFilters} disabled={!hasActiveFilters} title="Xóa bộ lọc" className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold text-on-surface-variant transition hover:bg-surface-container-high hover:text-primary disabled:pointer-events-none disabled:opacity-35"><RotateCcw className="h-3.5 w-3.5" />Đặt lại</button>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(150px,0.8fr)_minmax(210px,1.15fr)_minmax(150px,0.8fr)_minmax(150px,0.8fr)_minmax(240px,1.45fr)]">
            {scope === 'school' && (
              <FilterSelect icon={Users} label="Vai trò" value={role} options={[
                { value: '', label: 'Tất cả vai trò' },
                { value: 'TEACHER', label: 'Giáo viên' },
                { value: 'STUDENT', label: 'Học sinh' },
              ]} onChange={value => { setRole(value); setPage(0); }} />
            )}
            <FilterSelect
              icon={UserRound}
              className={scope === 'student' ? 'md:col-span-2 xl:col-span-2' : ''}
              label={scope === 'school' ? 'Thành viên' : 'Học sinh'}
              value={selectedPersonId}
              options={[
                ...(scope === 'school' ? [{ value: '', label: 'Tất cả thành viên' }] : []),
                ...(scope === 'student' && people.length === 0 ? [{ value: '', label: 'Chưa có học sinh', disabled: true }] : []),
                ...visiblePeople.map(person => ({ value: person.id, label: person.fullName })),
              ]}
              onChange={value => { setSelectedPersonId(value); setPage(0); }}
            />
            <FilterDate label="Từ ngày" value={from} onChange={value => { setFrom(value); setPage(0); }} />
            <FilterDate label="Đến ngày" value={to} onChange={value => { setTo(value); setPage(0); }} />
            <form onSubmit={applySearch} className="min-w-0 md:col-span-2 xl:col-span-1">
              <FilterLabel>Tìm video</FilterLabel>
              <div className="mt-1.5 flex h-11 overflow-hidden rounded-xl border border-outline-variant/60 bg-surface-container-lowest shadow-sm transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
                <Search className="ml-3.5 h-4 w-4 shrink-0 self-center text-outline" />
                <input value={searchInput} onChange={event => setSearchInput(event.target.value)} placeholder="Tên video hoặc kênh" className="min-w-0 flex-1 bg-transparent px-2.5 text-sm font-semibold text-on-surface outline-none placeholder:font-normal placeholder:text-on-surface-variant/60" />
                <button type="submit" title="Tìm kiếm" className="flex w-11 shrink-0 items-center justify-center border-l border-outline-variant/45 text-on-surface-variant transition hover:bg-primary/10 hover:text-primary"><Search className="h-4 w-4" /></button>
              </div>
            </form>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
        ) : error ? (
          <div className="px-6 py-14 text-center text-sm font-semibold text-error">{error}</div>
        ) : history.content.length === 0 ? (
          <div className="px-6 py-14 text-center"><Video className="mx-auto h-8 w-8 text-outline" /><p className="mt-3 text-sm font-bold">Chưa có lịch sử xem bằng extension</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-surface-container-low text-[10px] font-extrabold uppercase tracking-[0.12em] text-on-surface-variant">
                <tr><th className="px-5 py-3">Người xem</th><th className="px-5 py-3">Video</th><th className="px-5 py-3">Thời gian xem</th><th className="px-5 py-3">Lượt xem</th><th className="px-5 py-3">Gần nhất</th><th className="px-5 py-3 text-right">Mở</th></tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/35">
                {history.content.map(item => <HistoryRow key={item.id} item={item} />)}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-outline-variant/40 px-5 py-4 text-xs text-on-surface-variant">
          <span>{history.totalElements} kết quả</span>
          <div className="flex items-center gap-2">
            <button type="button" disabled={page <= 0 || loading} onClick={() => setPage(current => Math.max(0, current - 1))} className="h-8 rounded-lg border border-outline-variant/60 px-3 font-bold disabled:opacity-40">Trước</button>
            <span className="font-bold text-on-surface">{history.totalPages === 0 ? 0 : page + 1}/{history.totalPages}</span>
            <button type="button" disabled={page + 1 >= history.totalPages || loading} onClick={() => setPage(current => current + 1)} className="h-8 rounded-lg border border-outline-variant/60 px-3 font-bold disabled:opacity-40">Sau</button>
          </div>
        </div>
      </section>
    </div>
  );
};

const HistoryRow = ({ item }: { item: WatchHistoryItem }) => (
  <tr className="transition hover:bg-surface-container-low">
    <td className="px-5 py-4"><p className="max-w-44 truncate text-sm font-extrabold">{item.userName}</p><p className="mt-1 text-[11px] font-bold text-primary">{item.role === 'TEACHER' ? 'Giáo viên' : 'Học sinh'}</p></td>
    <td className="px-5 py-4"><p className="max-w-80 truncate text-sm font-bold">{item.videoTitle}</p><p className="mt-1 max-w-80 truncate text-xs text-on-surface-variant">{item.channelName || item.youtubeVideoId}</p></td>
    <td className="px-5 py-4"><p className="text-sm font-extrabold">{formatDuration(item.totalWatchedSeconds)}</p>{item.videoDurationSeconds ? <p className="mt-1 text-xs text-on-surface-variant">Đã xem đến {item.completionPercent}%</p> : null}</td>
    <td className="px-5 py-4 text-sm font-bold">{item.viewCount}</td>
    <td className="px-5 py-4 text-xs font-semibold text-on-surface-variant">{formatDateTime(item.lastWatchedAt)}</td>
    <td className="px-5 py-4 text-right"><a href={item.videoUrl || `https://www.youtube.com/watch?v=${item.youtubeVideoId}`} target="_blank" rel="noreferrer" title="Mở video" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition hover:bg-primary/10 hover:text-primary"><ExternalLink className="h-4 w-4" /></a></td>
  </tr>
);

const Metric = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) => (
  <div className="flex items-center gap-3 rounded-xl border border-outline-variant/55 bg-surface-container-lowest px-4 py-4 shadow-sm"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div><div className="min-w-0"><p className="truncate text-[10px] font-extrabold uppercase tracking-[0.1em] text-on-surface-variant">{label}</p><p className="mt-1 truncate text-lg font-black">{value}</p></div></div>
);

const FilterLabel = ({ children }: { children: React.ReactNode }) => (
  <span className="block text-[11px] font-extrabold text-on-surface-variant">{children}</span>
);

const FilterSelect = ({ icon, className = '', label, value, options, onChange }: { icon: React.ElementType; className?: string; label: string; value: string; options: CustomSelectOption[]; onChange: (value: string) => void }) => (
  <div className={`block min-w-0 ${className}`}><FilterLabel>{label}</FilterLabel><CustomSelect ariaLabel={label} leadingIcon={icon} value={value} options={options} onChange={onChange} className="mt-1.5" /></div>
);

const FilterDate = ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => (
  <label className="block min-w-0"><FilterLabel>{label}</FilterLabel><span className="relative mt-1.5 block"><CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" /><input type="date" value={value} onChange={event => onChange(event.target.value)} className="h-11 w-full rounded-xl border border-outline-variant/60 bg-surface-container-lowest pl-10 pr-3 text-sm font-semibold text-on-surface shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" /></span></label>
);

const formatDuration = (seconds = 0) => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  if (hours > 0) return `${hours} giờ ${minutes} phút`;
  if (minutes > 0) return `${minutes} phút`;
  return `${safeSeconds} giây`;
};

const formatDateTime = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'short',
}).format(new Date(value));

export default WatchHistoryPanel;
