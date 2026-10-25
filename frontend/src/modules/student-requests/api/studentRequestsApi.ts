import api from "@/shared/api/apiClient";
import type {
  PaginatedStudentRequests,
  StudentRequest,
  StudentRequestFilters,
  UpdateStudentRequestPayload,
} from "@/modules/student-requests/types/studentRequest";

export const getStudentRequests = (params: StudentRequestFilters = {}) =>
  api.get<PaginatedStudentRequests>("/student-requests", { params });

export const getStudentRequest = (id: string | number) =>
  api.get<StudentRequest>(`/student-requests/${id}`);

export const updateStudentRequestStatus = (
  id: string | number,
  data: UpdateStudentRequestPayload,
) => api.put<{ message: string; data: StudentRequest }>(`/student-requests/${id}/status`, data);

export const getPendingRequestCount = () =>
  api.get<{ pending_count: number }>("/student-requests/pending-count");
