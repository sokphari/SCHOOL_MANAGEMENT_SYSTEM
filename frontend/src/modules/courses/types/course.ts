export type AcademicStatus = "active" | "inactive";

export interface CourseLesson {
  id: number;
  course_id: number;
  name: string;
  lesson_number: number | null;
  description: string | null;
  status: AcademicStatus;
  school_classes_count?: number;
}

export interface Course {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
  status: AcademicStatus;
  lessons_count?: number;
  school_classes_count?: number;
  lessons?: CourseLesson[];
}

export interface CoursePayload {
  name: string;
  code: string;
  description: string;
  status: AcademicStatus;
}

export interface LessonPayload {
  name: string;
  lesson_number: number | null;
  description: string;
  status: AcademicStatus;
}
