import axios from "axios";
const apiBaseURL = import.meta.env.VITE_API_URL || "http://localhost:8010/api";

const api = axios.create({
    baseURL: apiBaseURL,
    withCredentials: true,
    withXSRFToken: true,
    xsrfCookieName: "XSRF-TOKEN",
    xsrfHeaderName: "X-XSRF-TOKEN",
    headers:{
        Accept: "application/json",
        "Content-Type": "application/json",
    }
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new Event("auth:session-expired"));
    }

    return Promise.reject(error);
  },
);

export const csrfApi = axios.create({
  baseURL: apiBaseURL.replace(/\/api\/?$/, ""),
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
  headers: { Accept: "application/json" },
});

export default api;
