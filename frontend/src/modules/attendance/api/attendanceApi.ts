import type { AxiosResponse } from "axios";
import api from "@/shared/api/apiClient";
import type {
  BulkAttendancePayload,
  ClassAttendanceRecord,
  PermissionRangePayload,
  PermissionAvailabilityResponse,
} from "@/modules/attendance/types/attendance";

export const getAttendanceByClassAndDate = (
  classId: string | number,
  date: string,
): Promise<AxiosResponse<ClassAttendanceRecord[]>> =>
  api.get<ClassAttendanceRecord[]>(`/classes/${classId}/attendance/${date}`);

export const bulkSaveAttendance = (
  classId: string | number,
  data: BulkAttendancePayload,
): Promise<AxiosResponse<{ message: string; data: ClassAttendanceRecord[] }>> =>
  api.post(`/classes/${classId}/attendance/bulk`, data);

export const getTeacherPermissionAvailability = (
  classId: string | number,
  date: string,
): Promise<AxiosResponse<PermissionAvailabilityResponse>> =>
  api.get(`/classes/${classId}/attendance/permission-availability`, { params: { date } });

export const grantPermissionRange = (
  classId: string | number,
  data: PermissionRangePayload,
): Promise<AxiosResponse<{ message: string; data: ClassAttendanceRecord[] }>> =>
  api.post(`/classes/${classId}/attendance/permission-range`, data);
