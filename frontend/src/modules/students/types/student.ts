export type StudentGender = "male" | "female";
export type StudentStatus = "active" | "inactive";
export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export interface StudentAttendanceRecord {
  id: number;
  student_id: number;
  school_class_id: number;
  attendance_date: string;
  status: AttendanceStatus;
  note: string | null;
  school_class?: { id: number; name: string; section: string | null };
}

export interface StudentAttendancePage {
  current_page: number;
  data: StudentAttendanceRecord[];
  last_page: number;
  per_page: number;
  total: number;
}

export interface StudentClass {
  id: number;
  name: string;
  section: string | null;
  academic_year: string;
  room: string | null;
  status: StudentStatus;
  pivot?: {
    joined_at: string | null;
    status: string;
  };
}

export interface Student {
  id: number;
  student_code: string;
  first_name: string;
  last_name: string;
  gender: StudentGender | null;
  date_of_birth: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  enrollment_date: string | null;
  status: StudentStatus;
  attendances_count?: number;
  attendance_present_count?: number;
  attendance_absent_count?: number;
  attendance_late_count?: number;
  attendance_excused_count?: number;
  attendance_rate?: number | null;
  created_at?: string;
  updated_at?: string;
  classes?: StudentClass[];
}

export interface StudentPage {
  current_page: number;
  data: Student[];
  last_page: number;
  per_page: number;
  total: number;
}

export interface StudentFilters {
  search: string;
  status: "" | StudentStatus;
  gender: "" | StudentGender;
  page: number;
}

export interface StudentForm {
  student_code: string;
  first_name: string;
  last_name: string;
  gender: "" | StudentGender;
  date_of_birth: string;
  phone: string;
  email: string;
  address: string;
  guardian_name: string;
  guardian_phone: string;
  enrollment_date: string;
  status: StudentStatus;
}

export type StudentPayload = Omit<StudentForm, "gender"> & {
  gender: StudentGender | null;
};

export type StudentValidationErrors = Partial<Record<keyof StudentForm, string[]>>;
