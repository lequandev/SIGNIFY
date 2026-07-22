import api from './api';

export interface Assignment {
  id: string;
  classId: string;
  teacherId: string;
  youtubeVideoId: string;
  title: string;
  description?: string;
  dueDate?: string;
  status: string;
  progressStatus?: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | string;
  watchedSeconds?: number;
  startedAt?: string;
  completedAt?: string;
  createdAt?: string;
}

export interface AssignmentProgress {
  id: string;
  assignmentId: string;
  studentId: string;
  youtubeVideoId: string;
  status: string;
  watchedSeconds?: number;
  completedAt?: string;
}

export interface HistoryEntry {
  id: string;
  userId: string;
  youtubeVideoId: string;
  watchedAt?: string;
}

export const getClassAssignments = async (classId: string) => (await api.get<Assignment[]>(`/v1/classes/${classId}/assignments`)).data;
export const createAssignment = async (classId: string, payload: { youtubeUrl: string; title: string; description?: string; dueDate?: string }) => (await api.post<Assignment>(`/v1/classes/${classId}/assignments`, payload)).data;
export const getAssignmentProgress = async (id: string) => (await api.get<AssignmentProgress[]>(`/v1/assignments/${id}/progress`)).data;
export const getMyAssignments = async (status?: string) => (await api.get<Assignment[]>('/v1/assignments/my', { params: status ? { status } : undefined })).data;
export const startAssignment = async (id: string) => (await api.post(`/v1/assignments/${id}/start`)).data;
export const completeAssignment = async (id: string, watchedSeconds?: number) => (await api.post(`/v1/assignments/${id}/complete`, watchedSeconds === undefined ? {} : { watchedSeconds })).data;
export const getMyHistory = async () => (await api.get<HistoryEntry[]>('/v1/me/history')).data;
export const getStudentHistory = async (studentId: string) => (await api.get<HistoryEntry[]>(`/v1/students/${studentId}/history`)).data;
