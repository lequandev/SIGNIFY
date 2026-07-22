import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Video,
  CalendarDays,
  Calendar,
  Sparkles,
  Search,
  ExternalLink,
  FileCode,
  Trash2,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock,
  ShieldCheck,
  X,
  Languages
} from 'lucide-react';
import { getAdminVideos, deleteAdminVideo, YoutubeVideoItem, VideoStats } from '../../services/videoService';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/ConfirmModal';

const VideoManagement: React.FC = () => {
  const { showToast } = useToast();
  const [videos, setVideos] = useState<YoutubeVideoItem[]>([]);
  const [stats, setStats] = useState<VideoStats>({
    totalVideos: 0,
    todayCount: 0,
    monthCount: 0,
    yearCount: 0,
    cachedScriptCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'day' | 'month' | 'year' | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [selectedScriptVideo, setSelectedScriptVideo] = useState<YoutubeVideoItem | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; title: string } | null>(null);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const data = await getAdminVideos(period, searchTerm, page, 10);
      setVideos(data.videos || []);
      setStats(data.stats || { totalVideos: 0, todayCount: 0, monthCount: 0, yearCount: 0, cachedScriptCount: 0 });
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || 0);
    } catch (err: any) {
      console.error('Failed to fetch admin videos:', err);
      showToast('Không thể tải danh sách video. Vui lòng kiểm tra lại kết nối.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [period, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchVideos();
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      await deleteAdminVideo(deleteModal.id);
      showToast('Đã xóa video thành công', 'success');
      setDeleteModal(null);
      fetchVideos();
    } catch (err: any) {
      console.error('Failed to delete video:', err);
      showToast('Xóa video thất bại', 'error');
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Quản lý Video YouTube</h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" /> Chống Trùng DB & Groq AI
            </span>
          </div>
          <p className="text-slate-500 font-medium text-sm md:text-base">
            Thống kê video người dùng đã xem theo ngày, tháng, năm & tự động rút gọn tiêu đề sang ngôn ngữ ký hiệu.
          </p>
        </div>

        <button
          onClick={fetchVideos}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition-all shadow-md active:scale-95 self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Tải lại dữ liệu
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Today */}
        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Xem Trong Ngày</span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-slate-900">{stats.todayCount}</div>
            <p className="text-xs font-semibold text-blue-600 mt-1">Hôm nay ({new Date().toLocaleDateString('vi-VN')})</p>
          </div>
        </motion.div>

        {/* Month */}
        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Xem Trong Tháng</span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-slate-900">{stats.monthCount}</div>
            <p className="text-xs font-semibold text-indigo-600 mt-1">Tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}</p>
          </div>
        </motion.div>

        {/* Year */}
        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Xem Trong Năm</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-slate-900">{stats.yearCount}</div>
            <p className="text-xs font-semibold text-amber-600 mt-1">Năm {new Date().getFullYear()}</p>
          </div>
        </motion.div>

        {/* Total & Cached */}
        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tổng Video Unique</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Video className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-slate-900">{stats.totalVideos}</div>
            <p className="text-xs font-semibold text-emerald-600 mt-1">{stats.cachedScriptCount} video đã có Ký Hiệu / Script</p>
          </div>
        </motion.div>
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3.5">
        <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs md:text-sm text-slate-700 leading-relaxed">
          <strong className="text-slate-900 font-bold">Chống trùng DB & Tự động rút gọn Ngôn ngữ ký hiệu với Groq AI:</strong> Các video được định danh duy nhất theo <code className="bg-white px-1.5 py-0.5 rounded border border-blue-200 text-blue-700 font-bold">videoId</code>. Trường <code className="bg-white px-1.5 py-0.5 rounded border border-blue-200 text-blue-700 font-bold">signLanguage</code> được Groq LLM (<code className="bg-white px-1.5 py-0.5 rounded border border-blue-200 text-blue-700 font-bold">llama-3.3-70b-versatile</code>) rút gọn tự động thành các từ ngữ ký hiệu cách nhau bằng dấu phẩy.
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        {/* Period Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl self-start md:self-auto overflow-x-auto max-w-full">
          {[
            { key: 'all', label: 'Tất cả' },
            { key: 'day', label: 'Hôm nay' },
            { key: 'month', label: 'Tháng này' },
            { key: 'year', label: 'Năm nay' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setPeriod(tab.key as any);
                setPage(0);
              }}
              className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all whitespace-nowrap ${
                period === tab.key
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative group flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
          <input
            type="text"
            placeholder="Tìm theo tiêu đề, Video ID hoặc từ Ký hiệu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 pl-10 pr-4 text-xs md:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 focus:bg-white transition-all"
          />
        </form>
      </div>

      {/* Videos List Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-600" />
            <p className="font-semibold text-sm">Đang tải danh sách video...</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Video className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-bold text-slate-700 text-lg">Không tìm thấy video nào</p>
            <p className="text-xs text-slate-400 mt-1">Thử thay đổi bộ lọc thời gian hoặc từ khóa tìm kiếm</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-black uppercase text-slate-400 tracking-wider">
                  <th className="py-4 px-6">Video</th>
                  <th className="py-4 px-4">Video ID</th>
                  <th className="py-4 px-4">Ngôn Ngữ Ký Hiệu (Groq AI)</th>
                  <th className="py-4 px-4 text-center">Lượt Xem</th>
                  <th className="py-4 px-4 text-center">Trạng Thái Script</th>
                  <th className="py-4 px-4">Thời Gian Tạo / Xem</th>
                  <th className="py-4 px-6 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {videos.map((video) => (
                  <tr key={video.id || video.videoId} className="hover:bg-slate-50/80 transition-colors group">
                    {/* Thumbnail & Title */}
                    <td className="py-4 px-6 max-w-xs md:max-w-sm">
                      <div className="flex items-center gap-3.5">
                        <div className="relative w-20 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 shadow-sm">
                          <img
                            src={`https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`}
                            alt={video.title || video.videoId}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                            {video.title || 'Video YouTube không tiêu đề'}
                          </p>
                          <a
                            href={video.videoUrl || `https://www.youtube.com/watch?v=${video.videoId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-blue-600 transition-colors mt-0.5 truncate max-w-full"
                          >
                            <span>Xem trên YouTube</span>
                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          </a>
                        </div>
                      </div>
                    </td>

                    {/* Video ID */}
                    <td className="py-4 px-4 font-mono text-xs text-slate-600">
                      <span className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 font-semibold">
                        {video.videoId}
                      </span>
                    </td>

                    {/* Sign Language Field */}
                    <td className="py-4 px-4 max-w-xs">
                      {video.signLanguage ? (
                        <div className="bg-indigo-50/80 border border-indigo-100 p-2 rounded-xl text-xs text-indigo-950 font-medium line-clamp-2" title={video.signLanguage}>
                          <span className="font-bold text-indigo-600 mr-1">🔤</span>
                          {video.signLanguage}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Chưa tạo ký hiệu</span>
                      )}
                    </td>

                    {/* View Count */}
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">
                        <Eye className="w-3.5 h-3.5" /> {video.viewCount || 1}
                      </span>
                    </td>

                    {/* Script Status */}
                    <td className="py-4 px-4 text-center">
                      {video.hasCachedScripts ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Đã có Script
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold rounded-full">
                          <Clock className="w-3.5 h-3.5" /> Chưa cào Script
                        </span>
                      )}
                    </td>

                    {/* Timestamps */}
                    <td className="py-4 px-4 text-xs text-slate-500">
                      <div className="font-semibold text-slate-700">Tạo: {formatDate(video.createdAt)}</div>
                      {video.lastAccessedAt && (
                        <div className="text-slate-400 text-[11px] mt-0.5">Xem gần nhất: {formatDate(video.lastAccessedAt)}</div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedScriptVideo(video)}
                          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                          title="Xem chi tiết Script & Ngôn Ngữ Ký Hiệu"
                        >
                          <FileCode className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteModal({ isOpen: true, id: video.id, title: video.title || video.videoId })}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                          title="Xóa video khỏi DB"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Hiển thị <strong>{videos.length}</strong> / <strong>{totalElements}</strong> video
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 disabled:opacity-50 hover:bg-slate-100 transition-colors"
              >
                Trang trước
              </button>
              <span className="font-semibold">Trang {page + 1} / {totalPages}</span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 disabled:opacity-50 hover:bg-slate-100 transition-colors"
              >
                Trang sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Script & Sign Language Detail Modal */}
      <AnimatePresence>
        {selectedScriptVideo && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col border border-slate-100"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Languages className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">Chi tiết Ngôn Ngữ Ký Hiệu & Script</h3>
                    <p className="text-xs text-slate-500 truncate max-w-md">{selectedScriptVideo.title || selectedScriptVideo.videoId}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedScriptVideo(null)}
                  className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-white hover:text-slate-900 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                {/* Sign Language Words Section */}
                <div className="bg-indigo-50/70 border border-indigo-100 p-5 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                    <Languages className="w-4 h-4 text-indigo-600" />
                    <span>Chuỗi Ngôn Ngữ Ký Hiệu (Rút gọn bởi Groq AI):</span>
                  </div>
                  {selectedScriptVideo.signLanguage ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {selectedScriptVideo.signLanguage.split(',').map((word, idx) => (
                        <span key={idx} className="px-3 py-1 bg-white border border-indigo-200 text-indigo-800 font-bold text-xs rounded-xl shadow-xs">
                          {word.trim()}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Chưa có dữ liệu chuỗi ký hiệu rút gọn.</p>
                  )}
                </div>

                {/* Raw JSON Scripts */}
                <div>
                  <h4 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-slate-500" /> RAW JSON Cached Scripts:
                  </h4>
                  <div className="p-4 font-mono text-xs bg-slate-900 text-slate-100 rounded-2xl overflow-x-auto">
                    <pre className="whitespace-pre-wrap break-all">
                      {JSON.stringify(selectedScriptVideo.signLanguageScripts || [], null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <ConfirmModal
          isOpen={deleteModal.isOpen}
          title="Xác nhận xóa video"
          message={`Bạn có chắc chắn muốn xóa video "${deleteModal.title}" khỏi cơ sở dữ liệu?`}
          confirmText="Xóa video"
          cancelText="Hủy"
          type="danger"
          onConfirm={handleDelete}
          onClose={() => setDeleteModal(null)}
        />
      )}
    </div>
  );
};

export default VideoManagement;
