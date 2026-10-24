import api from "@/shared/api/apiClient";

export const getClasses = (params = {}) => api.get("/classes", { params });
export const getClass = (id) => api.get(`/classes/${id}`);
export const createClass = (data) => api.post("/classes", data);
export const updateClass = (id, data) => api.put(`/classes/${id}`, data);
export const deleteClass = (id) => api.delete(`/classes/${id}`);

export const assignStudentToClass = (classId, studentId) =>
  api.post(`/classes/${classId}/students/${studentId}`);

export const removeStudentFromClass = (classId, studentId) =>
  api.delete(`/classes/${classId}/students/${studentId}`);