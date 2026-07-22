import api from './api';

export interface Evaluation {
  id: string;
  schoolId: string;
  classId: string;
  studentId: string;
  teacherId: string;
  score?: number;
  comment?: string;
  createdAt?: string;
}

export const createEvaluation = async (payload: { classId: string; studentId: string; score?: number; comment?: string }) => (await api.post<Evaluation>('/v1/evaluations', payload)).data;
export const getClassEvaluations = async (classId: string) => (await api.get<Evaluation[]>(`/v1/evaluations/class/${classId}`)).data;
