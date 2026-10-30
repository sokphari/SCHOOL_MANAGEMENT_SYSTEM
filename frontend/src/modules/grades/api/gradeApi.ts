import api from "@/shared/api/apiClient";
import type { AxiosResponse } from "axios";
import type {
  GradeTermDetails,
  GradingTerm,
} from "@/modules/grades/types/grade";

export interface GradeTermPayload {
  name: string;
  start_date: string;
  end_date: string;
}

export interface TermScorePayload {
  activity_score: number | null;
  exam_score: number | null;
}

export const getClassTerms = (
  classId: number,
): Promise<AxiosResponse<GradingTerm[]>> =>
  api.get<GradingTerm[]>(`/classes/${classId}/grades/terms`);

export const createGradeTerm = (classId: number, payload: GradeTermPayload) =>
  api.post<{ message: string; data: GradingTerm }>(
    `/classes/${classId}/grades/terms`,
    payload,
  );

export const getGradeTerm = (
  termId: number,
): Promise<AxiosResponse<GradeTermDetails>> =>
  api.get<GradeTermDetails>(`/grades/terms/${termId}`);

export const saveStudentTermScore = (
  termId: number,
  studentId: number,
  payload: TermScorePayload,
) => api.put(`/grades/terms/${termId}/students/${studentId}`, payload);
