import api from './api';

export interface EntitlementData {
  plan: string;
  planType: string;
  packageName: string;
  fullFeatures: boolean;
  unlimited: boolean;
  usageScope: 'USER_DAILY' | 'USER_MONTHLY' | 'SCHOOL_MONTHLY' | 'UNLIMITED' | string;
  dailyUsageLimitMinutes: number | null;
  usedMinutesToday: number | null;
  remainingMinutesToday: number | null;
  dailyUsageResetsAt: string | null;
  monthlyAiLimitMinutes: number | null;
  usedAiMinutesThisPeriod: number | null;
  remainingAiMinutesThisPeriod: number | null;
  aiUsagePeriodEndsAt: string | null;
  expiresAt: string | null;
  organizationName?: string | null;
}

export const getMyEntitlement = async (): Promise<EntitlementData> => {
  const response = await api.get('/v1/entitlements/me');
  return response.data;
};

export const recordUsage = async (usedSeconds: number): Promise<EntitlementData> => {
  const response = await api.post('/v1/entitlements/usage', { usedSeconds });
  return response.data;
};
