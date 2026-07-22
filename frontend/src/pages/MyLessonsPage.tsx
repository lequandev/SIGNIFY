import React, { useCallback, useEffect, useState } from 'react';
import { BookOpen, CheckCircle2, Clock3, ExternalLink, History, Loader2, PlayCircle } from 'lucide-react';
import Header from '../components/Header';
import ConfirmModal from '../components/ConfirmModal';
import { Assignment, completeAssignment, getMyAssignments, getMyHistory, HistoryEntry, startAssignment } from '../services/assignmentService';
import { useToast } from '../context/ToastContext';

const errorMessage = (error: unknown, fallback: string) => {
  const response = error as { response?: { data?: { message?: string } } };
  return response.response?.data?.message || fallback;
};

const progressLabel = (status?: string) => ({ ASSIGNED: 'Chưa bắt đầu', IN_PROGRESS: 'Đang học', COMPLETED: 'Đã hoàn thành' }[status || 'ASSIGNED'] || status || 'Chưa bắt đầu');
const progressClass = (status?: string) => status === 'COMPLETED'
  ? 'bg-secondary/10 text-secondary'
  : status === 'IN_PROGRESS'
    ? 'bg-primary/10 text-primary'
    : 'bg-tertiary/10 text-tertiary';

const MyLessonsPage: React.FC = () => {
  const { showToast } = useToast();
  const [lessons, setLessons] = useState<Assignment[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lessonToComplete, setLessonToComplete] = useState<Assignment | null>(null);

  const load = useCallback(async () => {
    try {
      const [lessonData, historyData] = await Promise.all([getMyAssignments(), getMyHistory()]);
      setLessons(lessonData);
      setHistory(historyData);
    } catch (error: unknown) {
      showToast(errorMessage(error, 'Không thể tải bài học'), 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { void load(); }, [load]);

  const openLesson = async (lesson: Assignment) => {
    try {
      if (lesson.progressStatus === 'ASSIGNED') await startAssignment(lesson.id);
      window.open(`https://www.youtube.com/watch?v=${lesson.youtubeVideoId}`, '_blank', 'noopener,noreferrer');
      await load();
    } catch (error: unknown) {
      showToast(errorMessage(error, 'Không thể mở bài học'), 'error');
    }
  };

  const complete = async (lesson: Assignment) => {
    try {
      await completeAssignment(lesson.id);
      await load();
      showToast('Đã đánh dấu bài học hoàn thành', 'success');
    } catch (error: unknown) {
      showToast(errorMessage(error, 'Không thể cập nhật tiến độ'), 'error');
    }
  };

  const completedCount = lessons.filter(lesson => lesson.progressStatus === 'COMPLETED').length;
  const inProgressCount = lessons.filter(lesson => lesson.progressStatus === 'IN_PROGRESS').length;
  const completionRate = lessons.length ? Math.round((completedCount / lessons.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-background font-sans text-on-surface selection:bg-primary/15">
      <Header />
      <main className="pb-20 pt-20 sm:pt-24">
        <section className="border-b border-outline-variant/40 bg-surface-container-lowest">
          <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-9 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-10">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-xs font-extrabold text-primary">
                <BookOpen className="h-3.5 w-3.5" /> Không gian học sinh
              </div>
              <h1 className="text-3xl font-black leading-tight text-on-surface sm:text-4xl">Bài học của tôi</h1>
              <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-on-surface-variant sm:text-base">Theo dõi bài học được giao, tiến độ hiện tại và các video bạn đã hoàn thành.</p>
            </div>
            <div className="grid grid-cols-3 divide-x divide-outline-variant/50 rounded-2xl border border-outline-variant/50 bg-background px-2 py-4 shadow-sm sm:min-w-[420px]">
              <LessonMetric label="Tổng bài" value={lessons.length} />
              <LessonMetric label="Đang học" value={inProgressCount} />
              <LessonMetric label="Hoàn thành" value={`${completionRate}%`} accent />
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
          {loading ? (
            <div className="flex min-h-[360px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
              <section>
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div><h2 className="text-xl font-black">Bài học được giao</h2><p className="mt-1 text-sm text-on-surface-variant">{lessons.length} bài học trong danh sách</p></div>
                  <span className="rounded-full bg-surface-container px-3 py-1.5 text-xs font-bold text-on-surface-variant">{completedCount}/{lessons.length} hoàn thành</span>
                </div>
                <div className="space-y-3">
                  {lessons.map(lesson => (
                    <article key={lesson.id} className={`group overflow-hidden rounded-2xl border bg-surface-container-lowest shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${lesson.progressStatus === 'COMPLETED' ? 'border-secondary/25' : 'border-outline-variant/55'}`}>
                      <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold ${progressClass(lesson.progressStatus)}`}>{progressLabel(lesson.progressStatus)}</span>
                            {lesson.dueDate && <span className="inline-flex items-center gap-1.5 text-xs font-medium text-on-surface-variant"><Clock3 className="h-3.5 w-3.5" />Hạn {new Date(lesson.dueDate).toLocaleString('vi-VN')}</span>}
                          </div>
                          <h3 className="truncate text-base font-extrabold text-on-surface sm:text-lg">{lesson.title}</h3>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-2">
                          <button type="button" onClick={() => void openLesson(lesson)} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-on-primary shadow-sm transition hover:bg-on-primary-fixed-variant focus:outline-none focus:ring-2 focus:ring-primary/30"><PlayCircle className="h-4 w-4" />Mở bài học</button>
                          {lesson.progressStatus !== 'COMPLETED' && <button type="button" onClick={() => setLessonToComplete(lesson)} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-secondary/25 bg-secondary/5 px-4 text-sm font-bold text-secondary transition hover:border-secondary/45 hover:bg-secondary/10 focus:outline-none focus:ring-2 focus:ring-secondary/20"><CheckCircle2 className="h-4 w-4" />Hoàn thành</button>}
                        </div>
                      </div>
                    </article>
                  ))}
                  {lessons.length === 0 && <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest px-6 py-16 text-center"><BookOpen className="mx-auto h-9 w-9 text-outline" /><h3 className="mt-4 font-extrabold">Chưa có bài học</h3><p className="mt-1 text-sm text-on-surface-variant">Bài học giáo viên giao sẽ xuất hiện tại đây.</p></div>}
                </div>
              </section>

              <aside className="overflow-hidden rounded-2xl border border-outline-variant/55 bg-surface-container-lowest shadow-sm lg:sticky lg:top-24">
                <div className="flex items-center justify-between border-b border-outline-variant/40 px-5 py-4"><div><h2 className="flex items-center gap-2 font-extrabold"><History className="h-4 w-4 text-secondary" />Lịch sử gần đây</h2><p className="mt-1 text-xs text-on-surface-variant">Các video đã học</p></div><span className="text-xs font-bold text-secondary">{history.length}</span></div>
                <div className="max-h-[560px] divide-y divide-outline-variant/35 overflow-y-auto">
                  {history.map(entry => {
                    const lessonTitle = lessons.find(lesson => lesson.youtubeVideoId === entry.youtubeVideoId)?.title || 'Bài học đã xem';
                    return (
                      <a key={entry.id} href={`https://www.youtube.com/watch?v=${entry.youtubeVideoId}`} target="_blank" rel="noreferrer" className="group flex items-start gap-3 px-5 py-4 transition hover:bg-surface-container-low">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary"><PlayCircle className="h-4 w-4" /></div>
                        <div className="min-w-0 flex-1"><p className="flex items-center gap-1 text-sm font-bold text-on-surface group-hover:text-primary"><span className="truncate">{lessonTitle}</span><ExternalLink className="h-3 w-3 shrink-0" /></p><p className="mt-1 text-xs text-on-surface-variant">{entry.watchedAt ? new Date(entry.watchedAt).toLocaleString('vi-VN') : 'Đã hoàn thành'}</p></div>
                      </a>
                    );
                  })}
                  {history.length === 0 && <p className="px-5 py-10 text-center text-sm text-on-surface-variant">Chưa có lịch sử học tập.</p>}
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>
      <ConfirmModal
        isOpen={Boolean(lessonToComplete)}
        onClose={() => setLessonToComplete(null)}
        onConfirm={() => {
          if (!lessonToComplete) return;
          const lesson = lessonToComplete;
          setLessonToComplete(null);
          void complete(lesson);
        }}
        title="Đánh dấu hoàn thành"
        message={`Bạn có chắc đã hoàn thành bài học "${lessonToComplete?.title || ''}"?`}
        confirmText="Hoàn thành"
        type="info"
      />
    </div>
  );
};

const LessonMetric = ({ label, value, accent = false }: { label: string; value: React.ReactNode; accent?: boolean }) => (
  <div className="px-3 text-center"><p className={`text-xl font-black sm:text-2xl ${accent ? 'text-secondary' : 'text-on-surface'}`}>{value}</p><p className="mt-1 text-[11px] font-bold text-on-surface-variant sm:text-xs">{label}</p></div>
);

export default MyLessonsPage;
