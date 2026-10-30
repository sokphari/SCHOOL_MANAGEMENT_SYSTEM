import api, { csrfApi } from "@/shared/api/apiClient";

export const csrfCookieApi = () => csrfApi.get("/sanctum/csrf-cookie");
export const loginApi = (data) => api.post("/login", data);
export const meApi = () => api.get("/me");
export const logoutApi = () => api.post("/logout");
