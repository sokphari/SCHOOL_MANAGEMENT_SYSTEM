import api from "@/shared/api/apiClient";

export const getDashboard = () => api.get("/dashboard");