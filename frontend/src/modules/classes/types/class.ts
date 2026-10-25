import type { Student } from "@/modules/students/types/student";
import type { Teacher } from "@/modules/teachers/types/teacher";

export type ClassStatus = "active" | "inactive";

export interface SchoolClass {
  id: number;
  name: string;
  section: string | null;
  academic_year: string;
  room: string | null;
  teacher_id: number | null;
  students_count?: number;
  description: string | null;
  status: ClassStatus;
  teacher?: Pick<Teacher, "id" | "first_name" | "last_name"> | null;
  students?: ClassStudent[];
  created_at?: string;
  updated_at?: string;
}

export interface ClassStudent extends Student {
  pivot?: { joined_at: string | null; status?: string };
}

export interface ClassPage {
  current_page: number;
  data: SchoolClass[];
  last_page: number;
  per_page: number;
  total: number;
}

export interface ClassFilters {
  search: string;
  status: "" | ClassStatus;
  page: number;
}

export interface ClassForm {
  name: string;
  section: string;
  academic_year: string;
  room: string;
  teacher_id: string;
  description: string;
  status: ClassStatus;
}

export type ClassPayload = Omit<ClassForm, "teacher_id"> & { teacher_id: number | null };
export type ClassValidationErrors = Partial<Record<keyof ClassForm, string[]>>;
export interface ClassQuery extends Partial<ClassFilters> { per_page?: number }
export interface TeacherOption { label: string; value: string }
