import api from './api';

export interface DailyAiUsage {
  date: string;
  usedSeconds: number;
}

export interface RecentAiVideoUsage {
  processingId: string;
  videoId: string;
  videoTitle?: string | null;
  channelName?: string | null;
  requestedBy: string;
  durationSeconds: number;
  completedAt: string;
}

export interface MemberDailyAiUsage {
  userId: string;
  role: 'TEACHER' | 'STUDENT' | string;
  limitSeconds: number;
  usedSeconds: number;
  reservedSeconds: number;
  remainingSeconds: number;
  processedVideoCount: number;
}

export interface SchoolAiUsage {
  schoolId: string;
  packageName: string;
  periodStart: string;
  periodEnd: string;
  limitSeconds: number;
  additionalSeconds: number;
  usedSeconds: number;
  reservedSeconds: number;
  remainingSeconds: number;
  processedVideoCount: number;
  usagePercent: number;
  teacherDailyLimitMinutes: number;
  studentDailyLimitMinutes: number;
  dailyQuotaResetsAt: string;
  dailyUsage: DailyAiUsage[];
  todayMemberUsage: MemberDailyAiUsage[];
  recentVideos: RecentAiVideoUsage[];
}

export const getSchoolAiUsage = async (): Promise<SchoolAiUsage> =>
  (await api.get<SchoolAiUsage>('/v1/ai-usage/school')).data;

export const updateSchoolDailyAiLimits = async (
  teacherDailyAiMinutes: number,
  studentDailyAiMinutes: number,
): Promise<SchoolAiUsage> => (await api.put<SchoolAiUsage>('/v1/ai-usage/school/daily-limits', {
  teacherDailyAiMinutes,
  studentDailyAiMinutes,
})).data;
