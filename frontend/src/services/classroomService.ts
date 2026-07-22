import api from './api';

export interface Classroom {
  id: string;
  schoolId: string;
  teacherId: string;
  name: string;
  description?: string;
  status: string;
  createdAt?: string;
}

export interface ClassroomStudent {
  id: string;
  fullName: string;
  email: string;
  username?: string;
  avatarUrl?: string;
  status: string;
}

export const getClasses = async () => (await api.get<Classroom[]>('/v1/classes')).data;
export const createClass = async (name: string, description: string) => (await api.post<Classroom>('/v1/classes', { name, description })).data;
export const updateClass = async (id: string, payload: Partial<Pick<Classroom, 'name' | 'description' | 'status'>>) => (await api.patch<Classroom>(`/v1/classes/${id}`, payload)).data;
export const getClassStudents = async (id: string) => (await api.get<ClassroomStudent[]>(`/v1/classes/${id}/students`)).data;
export const addStudentToClass = async (classId: string, studentId: string) => (await api.post(`/v1/classes/${classId}/students`, { studentId })).data;
export const removeStudentFromClass = async (classId: string, studentId: string) => { await api.delete(`/v1/classes/${classId}/students/${studentId}`); };
