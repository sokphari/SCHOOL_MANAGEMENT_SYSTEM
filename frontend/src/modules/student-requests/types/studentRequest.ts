export type StudentRequestStatus = "pending" | "in_progress" | "resolved" | "rejected";
export type StudentRequestPriority = "low" | "medium" | "high";
export type StudentRequestCategory =
  | "teacher_feedback"
  | "room_issue"
  | "facility_issue"
  | "class_request"
  | "general_request";

export interface StudentRequestStudent {
  id: number;
  first_name: string;
  last_name: string;
}

export interface StudentRequest {
  id: number;
  student_id: number | null;
  student_code_snapshot: string;
  student?: StudentRequestStudent | null;
  category: StudentRequestCategory;
  subject: string;
  description: string;
  status: StudentRequestStatus;
  priority: StudentRequestPriority;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentRequestFilters {
  search?: string;
  status?: StudentRequestStatus | "";
  category?: StudentRequestCategory | "";
  page?: number;
}

export interface PaginatedStudentRequests {
  data: StudentRequest[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface UpdateStudentRequestPayload {
  status: StudentRequestStatus;
  admin_note: string;
}
