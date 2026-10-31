import type { AxiosResponse } from "axios";
import api from "@/shared/api/apiClient.js";
import { csrfCookieApi } from "@/modules/auth/api/authApi.jsx";
import type {
  StudentRegistrationForm,
  StudentRegistrationPage,
} from "@/modules/students/types/studentRegistration";

export const submitStudentRegistration = async (
  data: StudentRegistrationForm,
) => {
  await csrfCookieApi();
  return api.post<{ message: string; data: { id: number; status: string } }>(
    "/public/student-registrations",
    data,
  );
};

export const checkStudentRegistrationQr = (token: string) =>
  api.get<{ valid: boolean }>("/public/student-registrations/qr-status", { params: { token } });

export const getStudentRegistrations = (params: {
  page?: number;
  search?: string;
  status?: string;
}, options: { notificationPoll?: boolean } = {}) => api.get<StudentRegistrationPage>("/student-registrations", {
  params,
  headers: options.notificationPoll ? { "X-Notification-Poll": "true" } : undefined,
});

export const issueStudentRegistrationQr = () =>
  api.post<{ message: string; data: { token: string; expires_at: string } }>("/student-registrations/qr-tokens");

export const approveStudentRegistration = (
  id: number,
): Promise<
  AxiosResponse<{ message: string; data: { id: number; student_code: string } }>
> => api.post(`/student-registrations/${id}/approve`);

export const rejectStudentRegistration = (id: number, review_note?: string) =>
  api.post(`/student-registrations/${id}/reject`, { review_note });
