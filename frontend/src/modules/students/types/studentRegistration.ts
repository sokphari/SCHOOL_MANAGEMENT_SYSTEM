import type { StudentGender, Student } from "@/modules/students/types/student";

export type StudentRegistrationStatus = "pending" | "approved" | "rejected";

export interface StudentRegistrationForm {
  registration_token?: string;
  first_name: string;
  last_name: string;
  gender: "" | StudentGender;
  date_of_birth: string;
  phone: string;
  email: string;
  address: string;
  guardian_name: string;
  guardian_phone: string;
}

export interface StudentRegistration extends StudentRegistrationForm {
  id: number;
  status: StudentRegistrationStatus;
  review_note: string | null;
  student_id: number | null;
  student?: Pick<Student, "id" | "student_code"> | null;
  created_at: string;
  reviewed_at: string | null;
}

export interface StudentRegistrationPage {
  current_page: number;
  data: StudentRegistration[];
  last_page: number;
  total: number;
}
