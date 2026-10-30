import api from "@/shared/api/apiClient";
import type { AxiosResponse } from "axios";
import type { Student } from "@/modules/students/types/student";
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

export interface ClassEndPayload {
  end_date: string;
}

export type AvailableClassStudent = Pick<Student, "id" | "student_code" | "first_name" | "last_name" | "gender" | "phone">;

export const getClasses = (params: ClassQuery = {}): Promise<AxiosResponse<ClassPage>> =>
  api.get<ClassPage>("/classes", { params });

export const getClass = (id: string | number): Promise<AxiosResponse<ClassDetails>> =>
  api.get<ClassDetails>(`/classes/${id}`);

export const getAvailableClassStudents = (id: string | number): Promise<AxiosResponse<AvailableClassStudent[]>> =>
  api.get<AvailableClassStudent[]>(`/classes/${id}/available-students`);

export const createClass = (data: ClassPayload): Promise<AxiosResponse<SchoolClass>> =>
  api.post<SchoolClass>("/classes", data);

export const updateClass = (id: string | number, data: ClassPayload): Promise<AxiosResponse<SchoolClass>> =>
  api.put<SchoolClass>(`/classes/${id}`, data);

export const deleteClass = (id: number): Promise<AxiosResponse<void>> =>
  api.delete<void>(`/classes/${id}`);

export const scheduleClassEnd = (id: number, data: ClassEndPayload) =>
  api.post<{ message: string; data: SchoolClass }>(`/classes/${id}/end`, data);

export const preEndClass = (id: number) =>
  api.post<{ message: string; data: SchoolClass }>(`/classes/${id}/pre-end`);

export const resumeClass = (id: number) =>
  api.post<{ message: string; data: SchoolClass }>(`/classes/${id}/resume`);

export const assignStudentToClass = (classId: string | number, studentId: string | number) =>
  api.post(`/classes/${classId}/students/${studentId}`);

export const removeStudentFromClass = (classId: string | number, studentId: number) =>
  api.delete(`/classes/${classId}/students/${studentId}`);

export const transferStudentToClass = (sourceClassId: string | number, studentId: number, targetClassId: number) =>
  api.post(`/classes/${sourceClassId}/students/${studentId}/transfer`, { target_class_id: targetClassId });

export const switchClassTeacher = (classId: number, teacherId: number) =>
  api.put(`/classes/${classId}/teacher`, { teacher_id: teacherId });
