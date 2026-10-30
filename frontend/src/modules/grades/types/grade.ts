export interface GradeClass {
  id: number;
  name: string;
  section?: string | null;
}

export interface GradingTerm {
  id: number;
  school_class_id: number;
  name: string;
  start_date: string;
  end_date: string;
  scores_count?: number;
}

export interface StudentTermScore {
  id: number;
  student_code: string;
  name: string;
  attendance_score: number;
  absent_count: number;
  permission_count: number;
  late_count: number;
  activity_score: number | null;
  exam_score: number | null;
  total_score: number;
}

export interface GradeTermDetails {
  term: GradingTerm;
  class: GradeClass;
  students: StudentTermScore[];
  score_maximums: { attendance: 40; activity: 30; exam: 40; total: 110 };
}
