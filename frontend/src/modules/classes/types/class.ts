import type { Student } from "@/modules/students/types/student";
import type { Teacher } from "@/modules/teachers/types/teacher";

export type ClassStatus = "active" | "inactive";
export type ClassDeliveryMode = "physical" | "hybrid" | "online";

export interface SchoolClass {
  id: number;
  name: string;
  section: string | null;
  academic_year: string;
  room: string | null;
  building_id?: number | null;
  floor_id?: number | null;
  room_id?: number | null;
  buildingLocation?: { id: number; name: string; code: string | null } | null;
  floorLocation?: { id: number; name: string; code: string | null } | null;
  roomLocation?: { id: number; name: string; code: string | null } | null;
  course?: string | null;
  building?: string | null;
  floor?: string | null;
  term?: string | null;
  time?: string | null;
  lesson?: string | null;
  delivery_mode?: ClassDeliveryMode | null;
  teacher_id: number | null;
  students_count?: number;
  description: string | null;
  status: ClassStatus;
  end_date?: string | null;
  pre_end_at?: string | null;
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
  course: string;
  lesson: string;
  delivery_mode: ClassDeliveryMode;
  section: string;
  academic_year: string;
  building_id: string;
  floor_id: string;
  room_id: string;
  term: string;
  time: string;
  teacher_id: string;
  description: string;
  status: ClassStatus;
}

export type ClassPayload = Omit<ClassForm, "teacher_id" | "building_id" | "floor_id" | "room_id"> & {
  teacher_id: number | null;
  building_id: number;
  floor_id: number;
  room_id: number;
};
export type ClassValidationErrors = Partial<Record<keyof ClassForm, string[]>>;
export interface ClassQuery extends Partial<ClassFilters> { per_page?: number }
export interface TeacherOption { label: string; value: string }
