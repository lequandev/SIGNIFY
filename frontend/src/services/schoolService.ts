import api from './api';

export type SchoolRole = 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT';

export interface SchoolOverview {
  schoolId: string;
  schoolName: string;
  role: SchoolRole | string;
  status: string;
  subscriptionId: string;
  packageName: string;
  planType: string;
  expiresAt?: string;
  memberCount: number;
  teacherCount: number;
  studentCount: number;
  maxAccounts: number;
  canManageMembers: boolean;
}

export interface SchoolMember {
  id: string;
  userId: string;
  fullName: string;
  email?: string | null;
  username?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  avatarUrl?: string;
  userStatus?: string;
  role: SchoolRole | string;
  status: 'ACTIVE' | 'INACTIVE' | string;
  createdAt?: string;
}

export interface ProvisionedMemberResponse {
  member: SchoolMember;
  loginId: string;
  temporaryPassword: string;
}

export const getMySchool = async () => (await api.get<SchoolOverview>('/v1/schools/me')).data;
export const getSchoolMembers = async (role?: SchoolRole) => (await api.get<SchoolMember[]>('/v1/schools/me/members', { params: role ? { role } : undefined })).data;
export const getPendingSchoolInvitations = async () => (await api.get<SchoolInvitationResponse[]>('/v1/schools/me/invitations')).data;
export const createStudent = async (fullName: string, username?: string) => (await api.post<ProvisionedMemberResponse>('/v1/schools/me/students', { fullName, username })).data;
export const inviteTeacher = async (fullName: string, email: string) => (await api.post<SchoolInvitationResponse>('/v1/schools/me/teachers', { fullName, email })).data;
export const getTeacherInvitation = async (token: string) => (await api.get<SchoolInvitationResponse>(`/v1/school-invitations/${token}`)).data;
export const acceptTeacherInvitation = async (token: string) => (await api.post<SchoolMember>(`/v1/school-invitations/${token}/accept`)).data;
export const resetStudentPassword = async (studentId: string) => (await api.post<{ loginId: string; temporaryPassword: string }>(`/v1/schools/me/students/${studentId}/reset-password`)).data;
export const updateMemberStatus = async (memberId: string, status: 'ACTIVE' | 'INACTIVE') => (await api.patch<SchoolMember>(`/v1/schools/me/members/${memberId}/status`, { status })).data;
export const deleteMember = async (memberId: string) => { await api.delete(`/v1/schools/me/members/${memberId}`); };
export const getSchoolStats = async () => (await api.get('/v1/schools/me/stats')).data;
export const updateSchoolName = async (name: string) => (await api.patch<SchoolOverview>('/v1/schools/me', { name })).data;

export interface SchoolInvitationResponse {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  expiresAt?: string;
}
