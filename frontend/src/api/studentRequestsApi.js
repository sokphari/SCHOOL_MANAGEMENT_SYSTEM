import api from "./axios";

export const getStudentRequests = (params = {}) =>
  api.get("/student-requests", { params });

export const getStudentRequest = (id) =>
  api.get(`/student-requests/${id}`);

export const updateStudentRequestStatus = (id, data) =>
  api.put(`/student-requests/${id}/status`, data);
export const getPendingRequestCount = () =>
  api.get("/student-requests/pending-count");