import api from "@/shared/api/apiClient.js";

export interface StaffAccountRegistration {
  id: number;
  name: string;
  email: string;
  ip_address: string | null;
  ip_blocked: boolean | 1 | null;
  status: "pending";
  expires_at: string;
  created_at: string;
}

export interface StaffAccountRegistrationPage {
  data: StaffAccountRegistration[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

export const getPendingStaffRegistrations = (notificationPoll = false) =>
  api.get<StaffAccountRegistrationPage>("/staff-registrations", {
    headers: notificationPoll ? { "X-Notification-Poll": "true" } : undefined,
  });

export const approveStaffRegistration = (id: number) =>
  api.post<{ message: string }>(`/staff-registrations/${id}/approve`);

export const rejectStaffRegistration = (id: number) =>
  api.post<{ message: string }>(`/staff-registrations/${id}/reject`);

export const blockRegistrationIp = (id: number) =>
  api.post<{ message: string }>(`/staff-registrations/${id}/block-ip`);

export const unblockRegistrationIp = (ip_address: string) =>
  api.delete<{ message: string }>("/staff-registrations/blocked-ip", { data: { ip_address } });
