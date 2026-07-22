import api from './api';

export interface YoutubeVideoItem {
  id: string;
  videoId: string;
  videoUrl: string;
  title: string;
  signLanguage?: string;
  signLanguageScripts?: Array<Record<string, any>> | null;
  hasCachedScripts: boolean;
  isProcessed: boolean;
  viewCount: number;
  lastAccessedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface VideoStats {
  totalVideos: number;
  todayCount: number;
  monthCount: number;
  yearCount: number;
  cachedScriptCount: number;
}

export interface AdminVideosResponse {
  videos: YoutubeVideoItem[];
  stats: VideoStats;
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export const getAdminVideos = async (
  period: 'day' | 'month' | 'year' | 'all' = 'all',
  search: string = '',
  page: number = 0,
  size: number = 10
): Promise<AdminVideosResponse> => {
  const response = await api.get('/youtube/admin/videos', {
    params: { period, search, page, size },
  });
  return response.data;
};

export const deleteAdminVideo = async (id: string): Promise<void> => {
  await api.delete(`/youtube/admin/videos/${id}`);
};
