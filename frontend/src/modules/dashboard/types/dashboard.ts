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

export interface AttendanceTrendPoint {
  date: string;
  present: number;
  absent: number;
  late: number;
  permission: number;
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
  today_present: number;
  attendance_range: { from_date: string; to_date: string };
  attendance_trend: AttendanceTrendPoint[];
}

export interface TeacherDashboardData extends DashboardBase {
  role: "teacher";
  my_classes: DashboardClass[];
}

export type DashboardData = AdminDashboardData | TeacherDashboardData;

export interface ApiErrorResponse {
  message?: string;
}
