export interface TimetableClass {
  id: number;
  name: string;
  section: string | null;
  teacher_id: number | null;
  building?: string | null;
  building_location?: { id: number; name: string; code: string | null } | null;
  buildingLocation?: { id: number; name: string; code: string | null } | null;
  teacher?: { first_name: string; last_name: string } | null;
  course?: string | null;
  lesson?: string | null;
  course_record?: { name: string } | null;
  lesson_record?: { name: string } | null;
  room?: string | null;
  roomLocation?: { id: number; name: string; code: string | null } | null;
  room_location?: { name: string; floor?: { building?: { name: string } | null } | null } | null;
}

export interface TimetableSession {
  id: number;
  school_class_id: number;
  day_of_week: number;
  starts_at: string;
  ends_at: string;
  school_class: TimetableClass;
}

export interface TimetablePayload {
  school_class_id: number;
  day_of_week: number;
  starts_at: string;
  ends_at: string;
}
