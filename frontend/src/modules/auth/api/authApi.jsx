import api, { csrfApi } from "@/shared/api/apiClient";

export const csrfCookieApi = () => csrfApi.get("/sanctum/csrf-cookie");
export const loginApi = (data) => api.post("/login", data);
export const registerStaffAccount = (data) => api.post("/register", data);
export const requestPasswordReset = (data) => api.post("/password/forgot", data);
export const resetPassword = (data) => api.post("/password/reset", data);
export const meApi = () => api.get("/me");
export const logoutApi = () => api.post("/logout");
