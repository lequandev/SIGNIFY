import api from './api';

export interface Feature {
  icon: string;
  text: string;
}

export interface ServicePackage {
  id: string;
  planType: 'individual' | 'education';
  name: string;
  description: string;
  price: string;
  duration: string;
  durationDays?: number;
  aiLimitPerDay?: number;
  dailyUsageMinutes?: number | null;
  monthlyAiMinutes?: number | null;
  fullFeatures?: boolean;
  buttonText: string;
  isRecommended: boolean;
  badge: string | null;
  features: Feature[];
}

export const getServicePackages = async (): Promise<ServicePackage[]> => {
  const response = await api.get('/v1/service-packages');
  return response.data;
};
