import api from "./axios";

export const getPublicSettings = () => api.get("/public/settings");