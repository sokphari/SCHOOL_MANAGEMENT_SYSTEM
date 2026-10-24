import api from "@/shared/api/apiClient";

export const getSettings = () => api.get("/settings");
export const updateSettings = (data) => api.put("/settings", data);