export type TeacherGender = "male" | "female";
export type TeacherStatus = "active" | "inactive";

export interface Teacher {
  id: number;
  user_id: number | null;
  teacher_code: string;
  first_name: string;
  last_name: string;
  gender: TeacherGender | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  hire_date: string | null;
  status: TeacherStatus;
  created_at?: string;
  updated_at?: string;
}

export interface TeacherPage {
  current_page: number;
  data: Teacher[];
  last_page: number;
  per_page: number;
  total: number;
}

export interface TeacherFilters {
  search: string;
  status: "" | TeacherStatus;
  gender: "" | TeacherGender;
  page: number;
}

export interface TeacherForm {
  user_id: string;
  teacher_code: string;
  first_name: string;
  last_name: string;
  gender: "" | TeacherGender;
  phone: string;
  email: string;
  address: string;
  hire_date: string;
  status: TeacherStatus;
}

export type TeacherPayload = Omit<TeacherForm, "user_id" | "gender"> & {
  user_id: number | null;
  gender: TeacherGender | null;
};

export type TeacherValidationErrors = Partial<Record<keyof TeacherForm, string[]>>;
