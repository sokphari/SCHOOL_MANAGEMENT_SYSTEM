export type StudentGender = "male" | "female";
export type StudentStatus = "active" | "inactive";

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
  created_at?: string;
  updated_at?: string;
  classes?: Array<{ id: number; name: string }>;
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
