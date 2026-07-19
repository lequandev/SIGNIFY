import api from './api';

export interface BusinessOverview {
  organizationId: string;
  organizationName: string;
  role: 'BUSINESS_ADMIN' | 'MEMBER' | string;
  status: string;
  subscriptionId: string;
  packageName: string;
  planType: string;
  expiresAt: string | null;
  memberCount: number;
  maxAccounts: number;
  canManageMembers: boolean;
}

export interface BusinessMember {
  id: string;
  userId: string;
  fullName: string | null;
  email: string;
  avatarUrl: string | null;
  userStatus: string | null;
  role: 'BUSINESS_ADMIN' | 'MEMBER' | string;
  status: 'ACTIVE' | 'INACTIVE' | string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface BusinessInvitation {
  id: string;
  email: string;
  role: 'BUSINESS_ADMIN' | 'MEMBER' | string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | string;
  expiresAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export const getMyBusiness = async (): Promise<BusinessOverview> => {
  const response = await api.get('/v1/businesses/me');
  return response.data;
};

export const getBusinessMembers = async (): Promise<BusinessMember[]> => {
  const response = await api.get('/v1/businesses/me/members');
  return response.data;
};

export const inviteBusinessMember = async (email: string): Promise<BusinessInvitation> => {
  const response = await api.post('/v1/businesses/me/members', { email });
  return response.data;
};

export const addBusinessMember = inviteBusinessMember;

export const acceptBusinessInvitation = async (token: string): Promise<BusinessMember> => {
  const response = await api.post(`/v1/businesses/me/invitations/${token}/accept`);
  return response.data;
};

export const updateBusinessMemberStatus = async (memberId: string, status: 'ACTIVE' | 'INACTIVE'): Promise<BusinessMember> => {
  const response = await api.patch(`/v1/businesses/me/members/${memberId}/status`, { status });
  return response.data;
};

export const deleteBusinessMember = async (memberId: string): Promise<void> => {
  await api.delete(`/v1/businesses/me/members/${memberId}`);
};
