import api from "@/shared/api/apiClient";

export const getPublicSettings = () => api.get("/public/settings");