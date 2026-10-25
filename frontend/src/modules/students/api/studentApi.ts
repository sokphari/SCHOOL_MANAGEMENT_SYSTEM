import type { AxiosResponse } from "axios";
import api from "@/shared/api/apiClient";
import type { Student, StudentAttendancePage, StudentFilters, StudentPage, StudentPayload } from "@/modules/students/types/student";

export const getStudents = (
  params: Partial<StudentFilters> & { per_page?: number } = {},
): Promise<AxiosResponse<StudentPage>> => api.get<StudentPage>("/students", { params });

export const getStudent = (id: number | string): Promise<AxiosResponse<Student>> =>
  api.get<Student>(`/students/${id}`);

export const getStudentAttendance = (
  id: number | string,
  page = 1,
): Promise<AxiosResponse<StudentAttendancePage>> => api.get<StudentAttendancePage>(`/students/${id}/attendances`, { params: { page } });

export const createStudent = (data: StudentPayload): Promise<AxiosResponse<{ message: string; data: Student }>> =>
  api.post("/students", data);

export const updateStudent = (
  id: number | string,
  data: StudentPayload,
): Promise<AxiosResponse<{ message: string; data: Student }>> => api.put(`/students/${id}`, data);

export const deleteStudent = (id: number | string): Promise<AxiosResponse<{ message: string }>> =>
  api.delete(`/students/${id}`);
