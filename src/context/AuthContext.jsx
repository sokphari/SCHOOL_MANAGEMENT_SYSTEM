import { createContext, useContext, useState, useEffect } from "react";
import { loginApi, meApi, logoutApi } from "../api/authApi";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));

  const login = async (data) => {
    const res = await loginApi(data);

    const token = res.data.token;

    localStorage.setItem("token", token);
    setToken(token);

    await fetchUser();
  };

  const fetchUser = async () => {
    try {
      const res = await meApi();
      setUser(res.data);
    } catch (e) {
      logout();
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch (e) {}

    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    if (token) {
      fetchUser();
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);