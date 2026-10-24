import api from "./axios";

export const getAttendanceByClassAndDate = (classId, date) =>
  api.get(`/classes/${classId}/attendance/${date}`);

export const bulkSaveAttendance = (classId, data) =>
  api.post(`/classes/${classId}/attendance/bulk`, data);