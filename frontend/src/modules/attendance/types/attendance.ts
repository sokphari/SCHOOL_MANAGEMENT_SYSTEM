import type { AttendanceStatus } from "@/modules/students/types/student";

export interface ClassAttendanceRecord {
  id?: number;
  student_id: number;
  school_class_id: number;
  attendance_date: string;
  status: AttendanceStatus;
  note: string | null;
  marked_by?: number | null;
}

export interface AttendanceDraft {
  student_id: number;
  student_code: string;
  student_name: string;
  status: AttendanceStatus;
  note: string;
}

export interface BulkAttendancePayload {
  attendance_date: string;
  records: Array<{
    student_id: number;
    status: AttendanceStatus;
    note: string | null;
  }>;
}

export interface PermissionRangePayload {
  student_id: number;
  start_date: string;
  end_date: string;
  note: string;
}

export interface PermissionAvailabilityResponse {
  availability: Record<string, boolean>;
  week_start: string;
  week_end: string;
}

