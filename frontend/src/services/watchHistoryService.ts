import api from './api';

export interface WatchHistoryItem {
  id: string;
  userId: string;
  userName: string;
  role: 'TEACHER' | 'STUDENT' | string;
  youtubeVideoId: string;
  videoTitle: string;
  videoUrl: string;
  channelName?: string;
  videoDurationSeconds?: number;
  totalWatchedSeconds: number;
  furthestPositionSeconds?: number;
  completionPercent: number;
  viewCount: number;
  firstWatchedAt: string;
  lastWatchedAt: string;
  source: string;
}

export interface WatchHistoryPage {
  content: WatchHistoryItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface WatchHistorySummary {
  totalViewers: number;
  uniqueVideos: number;
  totalWatchedSeconds: number;
  totalViews: number;
}

export interface WatchHistoryFilters {
  role?: string;
  userId?: string;
  classId?: string;
  keyword?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

export const getSchoolWatchHistory = async (filters: WatchHistoryFilters) =>
  (await api.get<WatchHistoryPage>('/v1/schools/me/watch-history', { params: filters })).data;

export const getSchoolWatchHistorySummary = async () =>
  (await api.get<WatchHistorySummary>('/v1/schools/me/watch-history/summary')).data;

export const getStudentWatchHistory = async (studentId: string, filters: WatchHistoryFilters) =>
  (await api.get<WatchHistoryPage>(`/v1/students/${studentId}/watch-history`, { params: filters })).data;

export const getStudentWatchHistorySummary = async (studentId: string) =>
  (await api.get<WatchHistorySummary>(`/v1/students/${studentId}/watch-history/summary`)).data;
