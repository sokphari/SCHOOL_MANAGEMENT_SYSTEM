import api from "@/shared/api/apiClient";

export const findStudentByCode = (studentCode) =>
  api.get(`/public/students/by-code/${studentCode}`);

export const submitStudentRequest = (data) =>
  api.post("/public/student-requests", data);