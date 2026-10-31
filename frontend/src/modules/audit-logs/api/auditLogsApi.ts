import api from "@/shared/api/apiClient.js";

export interface AuditActor {
  id: number;
  name: string;
  role: string;
}

export interface AuditLogRecord {
  id: number;
  actor_id: number | null;
  actor: AuditActor | null;
  action: string;
  module: string;
  subject_type: string | null;
  subject_id: number | null;
  method: string;
  route: string;
  status_code: number;
  ip_address: string | null;
  created_at: string;
  metadata: {
    changes?: Record<string, { before: unknown; after: unknown }>;
    [key: string]: unknown;
  } | null;
}

export interface AuditLogFilters {
  search?: string;
  module?: string;
  action?: string;
  actor_id?: number;
  role?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
}

export interface AuditLogPage {
  data: AuditLogRecord[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
  from: number | null;
  to: number | null;
}

export interface SystemUser {
  id: number;
  name: string;
  email: string;
  role: "admin" | "teacher";
  is_active: boolean;
  last_activity_at: string | null;
}

export type SystemUserAccount = Pick<SystemUser, "id" | "name" | "email" | "role" | "is_active">;

export interface PaginatedSystemUsers {
  data: SystemUser[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
  from: number | null;
  to: number | null;
}

export interface TeacherModulePermission {
  key: string;
  label: string;
  allowed: boolean;
  features: TeacherFeaturePermission[];
}

export interface TeacherFeaturePermission {
  key: string;
  label: string;
  allowed: boolean;
}

export function getAuditLogs(filters: AuditLogFilters = {}) {
  return api.get<AuditLogPage>("/audit-logs", { params: filters });
}

export function getSystemUsers(params: { search?: string; role?: string; page?: number } = {}) {
  return api.get<PaginatedSystemUsers>("/system-users", { params });
}

export function getSystemUser(id: number | string) {
  return api.get<SystemUserAccount>(`/system-users/${id}`);
}

export function updateSystemUser(id: number | string, data: { name: string; email: string }) {
  return api.put<{ message: string; user: SystemUserAccount }>(`/system-users/${id}`, data);
}

export function setSystemUserActive(id: number | string, isActive: boolean) {
  return api.patch<{ message: string; user: SystemUserAccount }>(`/system-users/${id}/status`, { is_active: isActive });
}

export function deleteSystemUser(id: number | string) {
  return api.delete<{ message: string }>(`/system-users/${id}`);
}

export function getTeacherModulePermissions() {
  return api.get<{ role: "teacher"; modules: TeacherModulePermission[] }>("/role-permissions/teacher");
}

export function updateTeacherModulePermissions(
  modules: Record<string, boolean>,
  features: Record<string, Record<string, boolean>>,
) {
  return api.put<{ role: "teacher"; modules: TeacherModulePermission[] }>("/role-permissions/teacher", { modules, features });
}
