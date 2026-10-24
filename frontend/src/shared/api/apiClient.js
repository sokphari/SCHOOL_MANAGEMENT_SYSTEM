import axios from "@/shared/api/apiClient";
const api = axios.create({
    baseURL : "http://127.0.0.1:8000/api",
    headers:{
        Accept: "application/json",
        "Content-Type": "application/json",
    }
})
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;


//Testing with my phone in local
// import axios from "@/shared/api/apiClient";

// const api = axios.create({
//   baseURL: "http://192.168.0.129:8000/api",    //ip wifi in etec
//   // baseURL: "http://172.20.10.3:8000/api", //ip wifi in my phone
//   headers: {
//     Accept: "application/json",
//     "Content-Type": "application/json",
//   },
// });

// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem("token");

//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }

//   return config;
// });

// export default api;