export interface RequestStats {
  pending: number;
  in_progress: number;
  resolved: number;
  rejected: number;
}

export interface DashboardClass {
  id: number;
  name: string;
  section: string | null;
}

interface DashboardBase {
  today_attendance: number;
  total_students: number;
  male_students: number;
  female_students: number;
  request_stats: RequestStats;
}

export interface AdminDashboardData extends DashboardBase {
  role: "admin";
  total_teachers: number;
  total_classes: number;
}

export interface TeacherDashboardData extends DashboardBase {
  role: "teacher";
  my_classes: DashboardClass[];
}

export type DashboardData = AdminDashboardData | TeacherDashboardData;

export interface ApiErrorResponse {
  message?: string;
}
