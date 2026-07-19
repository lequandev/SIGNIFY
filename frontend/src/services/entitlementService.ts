import api from './api';

export interface EntitlementData {
  plan: string;
  planType: string;
  packageName: string;
  fullFeatures: boolean;
  unlimited: boolean;
  dailyUsageLimitMinutes: number | null;
  usedMinutesToday: number;
  remainingMinutesToday: number | null;
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
