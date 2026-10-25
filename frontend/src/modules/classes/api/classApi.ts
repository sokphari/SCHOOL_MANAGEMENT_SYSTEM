import api from "@/shared/api/apiClient";
import type { AxiosResponse } from "axios";
import type {
  ClassPage,
  ClassPayload,
  ClassQuery,
  ClassStudent,
  SchoolClass,
} from "@/modules/classes/types/class";

export interface ClassDetails extends SchoolClass {
  students?: ClassStudent[];
}

export const getClasses = (params: ClassQuery = {}): Promise<AxiosResponse<ClassPage>> =>
  api.get<ClassPage>("/classes", { params });

export const getClass = (id: string | number): Promise<AxiosResponse<ClassDetails>> =>
  api.get<ClassDetails>(`/classes/${id}`);

export const createClass = (data: ClassPayload): Promise<AxiosResponse<SchoolClass>> =>
  api.post<SchoolClass>("/classes", data);

export const updateClass = (id: string | number, data: ClassPayload): Promise<AxiosResponse<SchoolClass>> =>
  api.put<SchoolClass>(`/classes/${id}`, data);

export const deleteClass = (id: number): Promise<AxiosResponse<void>> =>
  api.delete<void>(`/classes/${id}`);

export const assignStudentToClass = (classId: string | number, studentId: string | number) =>
  api.post(`/classes/${classId}/students/${studentId}`);

export const removeStudentFromClass = (classId: string | number, studentId: number) =>
  api.delete(`/classes/${classId}/students/${studentId}`);
