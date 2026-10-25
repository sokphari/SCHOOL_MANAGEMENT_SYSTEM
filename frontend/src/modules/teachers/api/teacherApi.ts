import type { AxiosResponse } from "axios";
import api from "@/shared/api/apiClient";
import type { Teacher, TeacherFilters, TeacherPage, TeacherPayload } from "@/modules/teachers/types/teacher";

export const getTeachers = (
  params: Partial<TeacherFilters> & { per_page?: number } = {},
): Promise<AxiosResponse<TeacherPage>> => api.get<TeacherPage>("/teachers", { params });

export const getTeacher = (id: number | string): Promise<AxiosResponse<Teacher>> =>
  api.get<Teacher>(`/teachers/${id}`);

export const createTeacher = (data: TeacherPayload): Promise<AxiosResponse<{ message: string; data: Teacher }>> =>
  api.post("/teachers", data);

export const updateTeacher = (
  id: number | string,
  data: TeacherPayload,
): Promise<AxiosResponse<{ message: string; data: Teacher }>> => api.put(`/teachers/${id}`, data);

export const deleteTeacher = (id: number | string): Promise<AxiosResponse<{ message: string }>> =>
  api.delete(`/teachers/${id}`);
