import api from "@/shared/api/apiClient";
import type { AxiosResponse } from "axios";
import type { Course, CoursePayload, CourseLesson, LessonPayload } from "@/modules/courses/types/course";

export const getCourses = (): Promise<AxiosResponse<Course[]>> => api.get<Course[]>("/courses");
export const getCourse = (id: number | string): Promise<AxiosResponse<Course>> => api.get<Course>(`/courses/${id}`);
export const saveCourse = (payload: CoursePayload, id?: number | string) => id ? api.put(`/courses/${id}`, payload) : api.post("/courses", payload);
export const deleteCourse = (id: number | string) => api.delete(`/courses/${id}`);
export const saveLesson = (courseId: number | string, payload: LessonPayload, lessonId?: number | string) => lessonId
  ? api.put(`/lessons/${lessonId}`, payload)
  : api.post(`/courses/${courseId}/lessons`, payload);
export const deleteLesson = (id: number | string) => api.delete(`/lessons/${id}`);
export type { Course, CourseLesson, CoursePayload, LessonPayload };
