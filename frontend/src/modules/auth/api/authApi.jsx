import api from "@/shared/api/apiClient";

export const loginApi = (data) => api.post("/login", data);
export const meApi = () => api.get("/me");
export const logoutApi = () => api.post("/logout");