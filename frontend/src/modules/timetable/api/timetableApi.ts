import api from "@/shared/api/apiClient";
import type { AxiosResponse } from "axios";
import type {
  TimetableClass,
  TimetablePayload,
  TimetableSession,
} from "@/modules/timetable/types/timetable";

export const getTimetableClasses = (): Promise<AxiosResponse<TimetableClass[]>> =>
  api.get<TimetableClass[]>("/timetable/classes");

export const getTimetable = (): Promise<AxiosResponse<TimetableSession[]>> =>
  api.get<TimetableSession[]>("/timetable");

export const createTimetableSession = (payload: TimetablePayload) =>
  api.post<{ message: string; data: TimetableSession }>("/timetable", payload);

export const updateTimetableSession = (id: number, payload: TimetablePayload) =>
  api.put<{ message: string; data: TimetableSession }>(`/timetable/${id}`, payload);

export const deleteTimetableSession = (id: number) =>
  api.delete<{ message: string }>(`/timetable/${id}`);
